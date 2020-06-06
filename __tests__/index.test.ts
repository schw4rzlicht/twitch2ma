import * as index from "../src/lib/index";
import {Config} from "../src/lib/Config";
import Twitch2Ma from "../src/lib/Twitch2Ma";

import Fs = require("fs");
import _ = require("lodash");

jest.mock("../src/lib/Twitch2Ma");

test("Update notification", () => {

    const packageInformation = require("../package.json");
    const higherVersion = require("semver/functions/inc")(packageInformation.version, "major");

    let consoleSpy = jest.spyOn(console, "log");

    index.notifyUpdate({version: higherVersion});

    expect(consoleSpy).toBeCalledWith(
        expect.stringMatching("A new version of \\w+ is available!"));
});

test.skip("Event handlers attached", () => {    // fixme pls

    let twitch2Ma = new Twitch2Ma(loadConfig());

    let spyOnEventHandlers = [
        jest.spyOn(twitch2Ma, "onTelnetConnected"),
        jest.spyOn(twitch2Ma, "onTwitchConnected"),
        jest.spyOn(twitch2Ma, "onCommandExecuted"),
        jest.spyOn(twitch2Ma, "onHelpExecuted"),
        jest.spyOn(twitch2Ma, "onError")
    ]

    index.attachEventHandlers(twitch2Ma);

    for (const spy of spyOnEventHandlers) {
        expect(spy).toBeCalled();
    }
});

function loadConfig(overrideConfigValues?: any): Config {
    return new Config(_.assign({}, JSON.parse(Fs.readFileSync("config.json.sample", {encoding: "utf-8"})), overrideConfigValues));
}
