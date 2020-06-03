import {TelnetError, ChannelError} from "../lib/Twitch2Ma";
import Twitch2Ma from "../lib/Twitch2Ma";
import {Config} from "../lib/Config";

import TwitchChatClient from "twitch-chat-client";
import Fs = require("fs");

// Workaround, see https://github.com/evanw/node-source-map-support/issues/279
jest.mock("source-map-support");
////

jest.mock("twitch-chat-client");
jest.mock("telnet-client", require("./mocks/telnet-client"));

let config = new Config(JSON.parse(Fs.readFileSync("config.json.sample", {encoding: "utf-8"})));

test("Test connection chain", async () => {

    let twitch2Ma = getTwitch2MaInstanceAndEnableLogin();

    let spyOnTelnetLogin = jest.spyOn(twitch2Ma, "telnetLogin");
    let spyOnInitTwitch = jest.spyOn(twitch2Ma, "initTwitch");
    let spyOnOnError = jest.spyOn(twitch2Ma, "onError");

    expect.assertions(6);

    await expect(twitch2Ma.start()).resolves.toBeUndefined();

    expect(twitch2Ma["telnet"].connect).toBeCalled();
    expect(spyOnTelnetLogin).toBeCalled();
    expect(spyOnInitTwitch).toBeCalled();
    expect(twitch2Ma["chatClient"].join).toBeCalled();

    expect(spyOnOnError).not.toBeCalled();
});

test("Telnet connection failed", () => {

    let twitch2Ma = new Twitch2Ma(config);
    let telnetInstance = twitch2Ma["telnet"];

    jest.spyOn(telnetInstance, "connect").mockRejectedValueOnce("Fooled!");

    return expect(twitch2Ma.start()).rejects.toThrow(new TelnetError("Could not connect to desk!"));
});

test("Telnet login fails", () => {
    return expect(new Twitch2Ma(config).start()).rejects
        .toThrow(new TelnetError(`Could not log into the desk as user ${config.ma.user}!`));
});

test("Twitch connection failed", () => {

    let twitch2Ma = getTwitch2MaInstanceAndEnableLogin();

    jest.spyOn(TwitchChatClient, "forTwitchClient")
        .mockImplementationOnce(() => {
            throw Error("Not this time!");
        });

    return expect(twitch2Ma.start()).rejects.toThrow(new Error("Not this time!"));
});

test("Twitch channel join failed", async () => {

    // @ts-ignore
    TwitchChatClient.joinImplementation.mockImplementationOnce(() => {
        return () => {
            return new Promise((resolve, reject) => reject());
        }
    });

    let errorHandler = jest.fn();

    let twitch2Ma = getTwitch2MaInstanceAndEnableLogin();
    twitch2Ma.onError(errorHandler);

    await twitch2Ma.start();

    expect(twitch2Ma["chatClient"].join).toBeCalled();
    expect(errorHandler).toBeCalledWith(new ChannelError());
})

test("Message handler set", async () => {

    let twitch2Ma = getTwitch2MaInstanceAndEnableLogin();

    await twitch2Ma.start();

    let spyOnMessageHandler = jest.spyOn(twitch2Ma, "handleMessage");

    // @ts-ignore
    twitch2Ma["chatClient"].onPrivmsgHandler("#mychannel", "myUser", "myMessage", null);

    expect(spyOnMessageHandler).toBeCalled();
});

function getTwitch2MaInstanceAndEnableLogin(): Twitch2Ma {

    let twitch2Ma = new Twitch2Ma(config);

    jest.spyOn(twitch2Ma["telnet"], "exec")
        .mockResolvedValueOnce(`Logged in as User '${config.ma.user}'`);

    return twitch2Ma;
}
