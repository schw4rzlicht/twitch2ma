import {PermissionCollector, PermissionController, PermissionError, Reason} from "../src/lib/PermissionController";
import {Config} from "../src/lib/Config";
import CooldownPermission from "../src/lib/permissions/CooldownPermission";
import ModeratorPermission from "../src/lib/permissions/ModeratorPermission";
import OwnerPermission from "../src/lib/permissions/OwnerPermission";
import {RuntimeInformation} from "../src/lib/RuntimeInformation";
import TwitchPrivateMessage from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";
import SACNPermission, {SACNLost, SACNReceiving, SACNStopped, SACNWaiting} from "../src/lib/permissions/SACNPermission";

const Fs = require("fs");
const _ = require("lodash");

let config: Config;
let permissionController: PermissionController;

jest.mock("sacn");

beforeEach(() => {
    config = loadConfig();
    permissionController = new PermissionController()
        .withPermissionInstance(new SACNPermission(config))
        .withPermissionInstance(new CooldownPermission())
        .withPermissionInstance(new ModeratorPermission())
        .withPermissionInstance(new OwnerPermission())
        .start();
});

afterEach(() => {
    jest.clearAllMocks();
});

test("Permission collector denies permission", () => {

    let permissionCollector = new PermissionCollector();
    permissionCollector.denyPermission("test", "i want to");

    expect(permissionCollector.permissionDenied).toBe(true);
    expect(permissionCollector.godMode).toBe(false);
    expect(permissionCollector.permissionDeniedReasons).toContainEqual(new Reason("test", "i want to"));
    expect(permissionCollector.godModeReasons.length).toBe(0);
});

test("Permission collector grants permission b/c of godMode", () => {

    let permissionCollector = new PermissionCollector();
    permissionCollector.denyPermission("test", "i want to");
    permissionCollector.enableGodMode("i know why");

    expect(permissionCollector.permissionDenied).toBe(false);
    expect(permissionCollector.godMode).toBe(true);
    expect(permissionCollector.permissionDeniedReasons).toContainEqual(new Reason("test", "i want to"));
    expect(permissionCollector.godModeReasons).toContainEqual("i know why");
});

test("Permission collector's god mode cannot be overwritten", () => {
    let permissionCollector = new PermissionCollector();
    permissionCollector.denyPermission("test", "i want to");

    expect(permissionCollector.permissionDenied).toBe(true);
    expect(permissionCollector.godMode).toBe(false);

    permissionCollector.enableGodMode("i know why");

    expect(permissionCollector.permissionDenied).toBe(false);
    expect(permissionCollector.godMode).toBe(true);

    permissionCollector.denyPermission("test2", "i still want to!");

    expect(permissionCollector.permissionDenied).toBe(false);
    expect(permissionCollector.godMode).toBe(true);

    expect(permissionCollector.permissionDeniedReasons).toContainEqual(new Reason("test", "i want to"));
    expect(permissionCollector.permissionDeniedReasons).toContainEqual(new Reason("test2", "i still want to!"));

    expect(permissionCollector.godModeReasons).toContainEqual("i know why");
});

test("Permission denied b/c of active cooldown", () => {

    permissionController.setAdditionalRuntimeInformation("lastCall", new Date().getTime() - 10000);

    let rawMessage = new TwitchPrivateMessage("doesNotMatter", null, null, {nick: "Alice"});

    return expect(permissionController.checkPermissions(new RuntimeInformation(config, "Alice",
        rawMessage, null))).rejects.toBeInstanceOf(PermissionError);
});

test("Permission granted b/c user is moderator", async () => {

    permissionController.setAdditionalRuntimeInformation("lastCall", new Date().getTime() - 10000);

    let rawMessage = new TwitchPrivateMessage("doesNotMatter", null, new Map([["badges", "moderator"]]), {nick: "Alice"});
    let permissionCollector = await permissionController.checkPermissions(new RuntimeInformation(config, "Alice", rawMessage, null));

    expect(permissionCollector.godModeReasons).toContain("user is moderator");
});

test("Permission granted b/c user is owner", async () => {

    permissionController.setAdditionalRuntimeInformation("lastCall", new Date().getTime() - 10000);

    let rawMessage = new TwitchPrivateMessage("doesNotMatter", null, null, {nick: "Alice"});
    let permissionCollector = await permissionController.checkPermissions(new RuntimeInformation(
        loadConfig({twitch: {channel: "Alice", clientId: "clientId", accessToken: "accessToken"}}),
        "Alice", rawMessage, null))

    expect(permissionCollector.godModeReasons).toContain("user is channel owner");
});

test("sACN lock", async () => {

    let sacnReceiver: any;
    permissionController["permissionInstances"].forEach(permissionInstance => {
        if (permissionInstance instanceof SACNPermission) {
            sacnReceiver = permissionInstance["sACNReceiver"];
        }
    });

    expect(sacnReceiver).not.toBeUndefined();
    expect(sacnReceiver.on).toBeCalledTimes(2);

    sacnReceiver.on.mock.calls[0][1]({
        slotsData: Buffer.from(new Uint8Array(512)),
        universe: 1
    });

    let runtimeInformation = new RuntimeInformation(config, "Alice",
        new TwitchPrivateMessage("doesNotMatter", null, null, {nick: "Alice"}),
        config.getCommand("lockableCommand"));

    await permissionController.checkPermissions(runtimeInformation)
        .catch(error => {
            expect(error).toBeInstanceOf(PermissionError);
            expect(error.permissionCollector.permissionDeniedReasons)
                .toContainEqual(new Reason("sacn", "@Alice, {command} is currently locked! Please wait!"));
        });

    sacnReceiver.on.mock.calls[0][1]({
        slotsData: Buffer.from(new Uint8Array(512).fill(255)),
        universe: 1
    });

    await permissionController.checkPermissions(runtimeInformation)
        .then(permissionCollector => {
            expect(permissionCollector.permissionDenied).toBe(false);
            expect(permissionCollector.godMode).toBe(false);
            expect(permissionCollector.permissionDeniedReasons.length).toBe(0);
        });

    expect.assertions(7);
});

test("sACN lock status", async () => {

    config = loadConfig({
        sacn: {
            timeout: 1
        }
    });

    let statusHandler = jest.fn();

    let sACNPermissionInstance = new SACNPermission(config);
    sACNPermissionInstance.onStatus(statusHandler);

    permissionController = new PermissionController()
        .withPermissionInstance(sACNPermissionInstance)
        .start();

    await expect(statusHandler).toBeCalledWith(new SACNWaiting([1]));

    let sendData = {
        slotsData: Buffer.from(new Uint8Array(512)),
        universe: 1
    };

    (sACNPermissionInstance["sACNReceiver"] as any).on.mock.calls[0][1](sendData);

    await expect(statusHandler).toBeCalledWith(new SACNReceiving([1]));
    await expect(statusHandler).toBeCalledWith(new SACNLost([1]));

    (sACNPermissionInstance["sACNReceiver"] as any).on.mock.calls[0][1](sendData);

    await expect(statusHandler).toBeCalledWith(new SACNReceiving([1]));

    sACNPermissionInstance.stop();

    await expect(statusHandler).toBeCalledWith(new SACNStopped());

    expect.assertions(5);
});

function loadConfig(overrideConfigValues?: any): Config {
    return new Config(_.assign({}, JSON.parse(Fs.readFileSync("config.json.sample", {encoding: "utf-8"})), overrideConfigValues));
}
