import {TelnetError, ChannelError} from "../lib/Twitch2Ma";
import Twitch2Ma from "../lib/Twitch2Ma";
import {Config} from "../lib/Config";
import TwitchPrivateMessage from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";

import TwitchChatClient from "twitch-chat-client";
import Fs = require("fs");
import SpyInstance = jest.SpyInstance;

// Workaround, see https://github.com/evanw/node-source-map-support/issues/279
jest.mock("source-map-support");
////

jest.mock("twitch-chat-client");
jest.mock("telnet-client", require("./mocks/telnet-client"));

let config = loadConfig();

test("Connection chain", async () => {

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

    sendMessageToBot(twitch2Ma, "#mychannel", "myUser", "myMessage", null);

    expect(spyOnMessageHandler).toBeCalled();
});

test("Send help", async () => {

    let helpExecutedHandler = jest.fn();

    let twitch2Ma = getTwitch2MaInstanceAndEnableLogin();
    twitch2Ma.onHelpExecuted(helpExecutedHandler);

    await twitch2Ma.start();

    let spyOnTwitchSay = jest.spyOn(twitch2Ma["chatClient"], "say");

    sendMessageToBotAndExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter", "Alice", "!lights", null,
        `Available commands are: ${twitch2Ma["availableCommands"]}. Type !lights !command for help.`);
    expect(helpExecutedHandler).toBeCalledWith("#doesNotMatter", "Alice");

    helpExecutedHandler.mockReset();

    sendMessageToBotAndExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter", "Bob", "!lights !doesNotExist", null,
        "Command !doesNotExist does not exist! Type !lights for a list of available commands.");
    expect(helpExecutedHandler).not.toBeCalled();

    sendMessageToBotAndExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter", "Celine", "!lights !red", null,
        "Help for !red: Sets the lights to red");
    expect(helpExecutedHandler).toBeCalledWith("#doesNotMatter", "Celine", "red");

    sendMessageToBotAndExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter", "Celine", "!lights blue", null,
        "Help for !blue: Sets the lights to blue");
    expect(helpExecutedHandler).toBeCalledWith("#doesNotMatter", "Celine", "blue");

    sendMessageToBotAndExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter", "Mary", "!lights !yellow", null,
        "No help for !yellow available!");
    expect(helpExecutedHandler).toBeCalledWith("#doesNotMatter", "Mary", "yellow");
});

test("Send help w/o commands", async () => {

    let helpExecutedHandler = jest.fn();

    let twitch2Ma = getTwitch2MaInstanceAndEnableLogin(loadConfig());
    twitch2Ma.onHelpExecuted(helpExecutedHandler);
    twitch2Ma["config"].commands = [];

    await twitch2Ma.start();

    sendMessageToBotAndExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!lights", null, "There are no commands available.");
    expect(helpExecutedHandler).toBeCalledWith("#doesNotMatter", "Alice");
});

test("Cooldown calculation", () => {

    let aliceRawMessage = new TwitchPrivateMessage("doesNotMatter", null, null, {nick: "Alice"});
    let bobRawMessage = new TwitchPrivateMessage("doesNotMatter", null, new Map([["badges", "moderator"]]), {nick: "Bob"});
    let ownerRawMessage = new TwitchPrivateMessage("doesNotMatter", null, null, {nick: config.twitch.channel});

    let twitch2Ma = getTwitch2MaInstanceAndEnableLogin();

    expect(twitch2Ma.cooldown(new Date().getTime(), null, aliceRawMessage)).toBeLessThanOrEqual(0);
    expect(twitch2Ma.cooldown(new Date().getTime(), new Date().getTime(), aliceRawMessage)).toBeGreaterThan(0);
    expect(twitch2Ma.cooldown(new Date().getTime(), new Date().getTime(), bobRawMessage)).toBeLessThanOrEqual(0);
    expect(twitch2Ma.cooldown(new Date().getTime(), new Date().getTime(), aliceRawMessage)).toBeGreaterThan(0);
    expect(twitch2Ma.cooldown(new Date().getTime(), new Date().getTime(), ownerRawMessage)).toBeLessThanOrEqual(0);
    expect(twitch2Ma.cooldown(new Date().getTime(), new Date().getTime(), aliceRawMessage)).toBeGreaterThan(0);
    expect(twitch2Ma.cooldown(new Date().getTime(), 666, aliceRawMessage)).toBeLessThanOrEqual(0);
});

test("Cooldown active", async () => {

    let aliceRawMessage = new TwitchPrivateMessage("doesNotMatter", null, null, {nick: "Alice"});

    let twitch2Ma = getTwitch2MaInstanceAndEnableLogin(loadConfig());

    await twitch2Ma.start();

    twitch2Ma["lastCall"] = new Date().getTime();

    sendMessageToBotAndExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!red", aliceRawMessage, "@Alice, please wait \\d{1,2} seconds and try again!");
});

function sendMessageToBotAndExpectAnswer(twitch2Ma: Twitch2Ma,
                                         spyOnTwitchSay: SpyInstance,
                                         channel: string,
                                         user: string,
                                         message: string,
                                         rawMessage: TwitchPrivateMessage,
                                         answer: string) {

    sendMessageToBot(twitch2Ma, channel, user, message, rawMessage);
    expect(spyOnTwitchSay).toBeCalledWith(channel, expect.stringMatching(answer));
}

function sendMessageToBot(twitch2Ma: Twitch2Ma, channel: string, user: string, message: string, rawMessage: TwitchPrivateMessage) {
    // @ts-ignore
    twitch2Ma["chatClient"].onPrivmsgHandler(channel, user, message, rawMessage);
}

function getTwitch2MaInstanceAndEnableLogin(newConfig?: Config): Twitch2Ma {

    let twitch2Ma = newConfig ? new Twitch2Ma(newConfig) : new Twitch2Ma(config);

    jest.spyOn(twitch2Ma["telnet"], "exec")
        .mockResolvedValueOnce(`Logged in as User '${config.ma.user}'`);

    return twitch2Ma;
}

function loadConfig(): Config {
    return new Config(JSON.parse(Fs.readFileSync("config.json.sample", {encoding: "utf-8"})));
}
