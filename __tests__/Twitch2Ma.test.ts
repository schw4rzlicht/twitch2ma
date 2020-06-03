import Twitch2Ma from "../lib/Twitch2Ma";
import {Config} from "../lib/Config";

import Fs = require("fs");

// Workaround, see https://github.com/evanw/node-source-map-support/issues/279
jest.mock("source-map-support");
////

jest.mock("twitch-chat-client");
jest.mock("telnet-client", require("./mocks/telnet-client"));

let config = new Config(JSON.parse(Fs.readFileSync("config.json.sample", {encoding: "utf-8"})));

test("Test connection", async () => {

    let twitch2Ma = new Twitch2Ma(config);
    let telnetInstance = twitch2Ma["telnet"];

    jest.spyOn(telnetInstance, "exec")
        .mockReturnValueOnce(new Promise(resolve => resolve(`Logged in as User '${config.ma.user}'`)));

    let spyOnTelnetLogin = jest.spyOn(twitch2Ma, "telnetLogin");
    let spyOnInitTwitch = jest.spyOn(twitch2Ma, "initTwitch");
    let spyOnOnError = jest.spyOn(twitch2Ma, "onError");

    await expect(twitch2Ma.start()).resolves.toBeUndefined();

    expect(twitch2Ma["telnet"].connect).toBeCalled();
    expect(spyOnTelnetLogin).toBeCalled();
    expect(spyOnInitTwitch).toBeCalled();

    expect(spyOnOnError).not.toBeCalled();
});
