import {TelnetError, ChannelError} from "../src/lib/Twitch2Ma";
import Twitch2Ma from "../src/lib/Twitch2Ma";
import {Config} from "../src/lib/Config";
import TwitchPrivateMessage from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";

import TwitchChatClient from "twitch-chat-client";
import Fs = require("fs");
import _ = require("lodash");

// Workaround, see https://github.com/evanw/node-source-map-support/issues/279
jest.mock("source-map-support");
////

jest.mock("twitch-chat-client");
jest.mock("telnet-client", require("./mocks/telnet-client"));

let config: Config;
let twitch2Ma: Twitch2Ma;

beforeEach(() => {
    config = loadConfig();
    twitch2Ma = getTwitch2MaInstanceAndEnableLogin();
});

afterEach(() => twitch2Ma.stop());

test("Connection chain", async () => {

    let spyOnTelnetLogin = jest.spyOn(twitch2Ma, "telnetLogin");
    let spyOnInitTwitch = jest.spyOn(twitch2Ma, "initTwitch");
    let spyOnOnError = jest.spyOn(twitch2Ma, "onError");

    let spyOnOnTelnetConnected = jest.fn();
    let spyOnOnTwitchConnected = jest.fn();

    twitch2Ma.onTelnetConnected(spyOnOnTelnetConnected);
    twitch2Ma.onTwitchConnected(spyOnOnTwitchConnected);

    await expect(twitch2Ma.start()).resolves.toBeUndefined();

    expect(twitch2Ma["telnet"].connect).toBeCalled();
    expect(spyOnTelnetLogin).toBeCalled();
    expect(spyOnInitTwitch).toBeCalled();
    expect(twitch2Ma["chatClient"].join).toBeCalled();

    expect(spyOnOnTelnetConnected).toBeCalledWith(config.ma.host, config.ma.user);
    expect(spyOnOnTwitchConnected).toBeCalledWith(config.twitch.channel);

    expect(spyOnOnError).not.toBeCalled();
});

test("Telnet connection failed", async () => {

    jest.spyOn(twitch2Ma["telnet"], "connect").mockRejectedValueOnce("Fooled!");

    let spyOnOnTelnetConnected = jest.fn();
    let spyOnOnTwitchConnected = jest.fn();

    twitch2Ma.onTelnetConnected(spyOnOnTelnetConnected);
    twitch2Ma.onTwitchConnected(spyOnOnTwitchConnected);

    await expect(twitch2Ma.start()).rejects.toThrow(new TelnetError("Could not connect to desk!"));

    expect(spyOnOnTelnetConnected).not.toBeCalled();
    expect(spyOnOnTwitchConnected).not.toBeCalled();
});

test("Telnet login failed", async () => {

    await twitch2Ma.stop();

    twitch2Ma = new Twitch2Ma(config);

    let spyOnOnTelnetConnected = jest.fn();
    let spyOnOnTwitchConnected = jest.fn();

    twitch2Ma.onTelnetConnected(spyOnOnTelnetConnected);
    twitch2Ma.onTwitchConnected(spyOnOnTwitchConnected);

    await expect(twitch2Ma.start()).rejects
        .toThrow(new TelnetError(`Could not log into the desk as user ${config.ma.user}!`));

    expect(spyOnOnTelnetConnected).not.toBeCalled();
    expect(spyOnOnTwitchConnected).not.toBeCalled();
});

test("Twitch connection failed", async () => {

    let spyOnOnTelnetConnected = jest.fn();
    let spyOnOnTwitchConnected = jest.fn();

    twitch2Ma.onTelnetConnected(spyOnOnTelnetConnected);
    twitch2Ma.onTwitchConnected(spyOnOnTwitchConnected);

    jest.spyOn(TwitchChatClient, "forTwitchClient")
        .mockImplementationOnce(() => {
            throw Error("Not this time!");
        });

    await expect(twitch2Ma.start()).rejects.toThrow(new Error("Not this time!"));

    expect(spyOnOnTelnetConnected).toBeCalledWith(config.ma.host, config.ma.user);
    expect(spyOnOnTwitchConnected).not.toBeCalled();
});

test("Twitch channel join failed", async () => {

    // @ts-ignore
    TwitchChatClient.joinImplementation.mockImplementationOnce(() => {
        return () => {
            return new Promise((resolve, reject) => reject());
        }
    });

    let errorHandler = jest.fn();

    let spyOnOnTelnetConnected = jest.fn();
    let spyOnOnTwitchConnected = jest.fn();

    twitch2Ma.onTelnetConnected(spyOnOnTelnetConnected);
    twitch2Ma.onTwitchConnected(spyOnOnTwitchConnected);

    twitch2Ma.onError(errorHandler);
    await twitch2Ma.start();

    expect(twitch2Ma["chatClient"].join).toBeCalled();
    expect(errorHandler).toBeCalledWith(new ChannelError());

    expect(spyOnOnTelnetConnected).toBeCalledWith(config.ma.host, config.ma.user);
    expect(spyOnOnTwitchConnected).not.toBeCalled();
})

test("Message handler set", async () => {

    await twitch2Ma.start();

    let spyOnMessageHandler = jest.spyOn(twitch2Ma, "handleMessage");

    await sendMessageToBot(twitch2Ma, "#mychannel", "myUser", "myMessage", null);

    expect(spyOnMessageHandler).toBeCalled();
});

test("Send help", async () => {

    let helpExecutedHandler = jest.fn();

    twitch2Ma.onHelpExecuted(helpExecutedHandler);

    await twitch2Ma.start();

    let spyOnTwitchSay = jest.spyOn(twitch2Ma["chatClient"], "say");

    await sendMessageToBotAndExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter", "Alice", "!lights", null,
        `Available commands are: ${config.availableCommands}. Type !lights !command for help.`);
    expect(helpExecutedHandler).toBeCalledWith("#doesNotMatter", "Alice");

    helpExecutedHandler.mockReset();

    await sendMessageToBotAndExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter", "Bob", "!lights !doesNotExist", null,
        "Command !doesNotExist does not exist! Type !lights for a list of available commands.");
    expect(helpExecutedHandler).not.toBeCalled();

    await sendMessageToBotAndExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter", "Celine", "!lights !red", null,
        "Help for !red: Sets the lights to red");
    expect(helpExecutedHandler).toBeCalledWith("#doesNotMatter", "Celine", "red");

    await sendMessageToBotAndExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter", "Celine", "!lights blue", null,
        "Help for !blue: Sets the lights to blue");
    expect(helpExecutedHandler).toBeCalledWith("#doesNotMatter", "Celine", "blue");

    await sendMessageToBotAndExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter", "Mary", "!lights !yellow", null,
        "No help for !yellow available!");
    expect(helpExecutedHandler).toBeCalledWith("#doesNotMatter", "Mary", "yellow");

    await sendMessageToBotAndExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter", "Noely", "!lights !gobo", null,
        "Help for !gobo: Gobo commands. Available parameters: niceGobo, evenNicerGobo");
    expect(helpExecutedHandler).toBeCalledWith("#doesNotMatter", "Noely", "gobo");
});

test("Send help w/o commands", async () => {

    let helpExecutedHandler = jest.fn();

    await twitch2Ma.stop();

    twitch2Ma = getTwitch2MaInstanceAndEnableLogin(loadConfig({commands: []}));
    twitch2Ma.onHelpExecuted(helpExecutedHandler);
    await twitch2Ma.start();

    await sendMessageToBotAndExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!lights", null, "There are no commands available.");
    expect(helpExecutedHandler).toBeCalledWith("#doesNotMatter", "Alice");
});

test("Command successful", async () => {

    let aliceRawMessage = new TwitchPrivateMessage("doesNotMatter", null, null, {nick: "Alice"});
    let commandExecutedHandler = jest.fn();

    twitch2Ma.onCommandExecuted(commandExecutedHandler);

    await twitch2Ma.start();

    await sendMessageToBotAndExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!red", aliceRawMessage, "@Alice set the lights to red!");

    expect(twitch2Ma["telnet"].send).toBeCalledWith("Macro 1");
    expect(commandExecutedHandler).toBeCalledWith("#doesNotMatter", "Alice", "red", undefined, "Macro 1");

    await sendMessageToBotAndExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!red", aliceRawMessage, "@Alice, please wait \\d{1,2} seconds and try again!");
});

test("Text only command successful", async () => {

    let aliceRawMessage = new TwitchPrivateMessage("doesNotMatter", null, null, {nick: "Alice"});
    let commandExecutedHandler = jest.fn();

    twitch2Ma.onCommandExecuted(commandExecutedHandler);

    await twitch2Ma.start();

    await sendMessageToBotAndExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!textOnly", aliceRawMessage, "Heyyy @Alice!");

    expect(twitch2Ma["telnet"].send).not.toBeCalled();
    expect(commandExecutedHandler).toBeCalledWith("#doesNotMatter", "Alice", "textOnly", undefined, undefined);
});

test("Parameter successful", async () => {

    let aliceRawMessage = new TwitchPrivateMessage("doesNotMatter", null, null, {nick: "Alice"});
    let commandExecutedHandler = jest.fn();

    twitch2Ma.onCommandExecuted(commandExecutedHandler);

    await twitch2Ma.start();

    await sendMessageToBotAndExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!gobo evenNicerGobo", aliceRawMessage, "@Alice wishes the 'evenNicerGobo'!");

    expect(twitch2Ma["telnet"].send).toBeCalledWith("Macro 5");
    expect(commandExecutedHandler).toBeCalledWith("#doesNotMatter", "Alice", "gobo", "evenNicerGobo", "Macro 5");
});

test("Parameter does not exist", async () => {

    let aliceRawMessage = new TwitchPrivateMessage("doesNotMatter", null, null, {nick: "Alice"});
    let commandExecutedHandler = jest.fn();

    twitch2Ma.onCommandExecuted(commandExecutedHandler);

    await twitch2Ma.start();

    await sendMessageToBotAndExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!gobo doesNotExist", aliceRawMessage, "Parameter doesNotExist does not exist! Type !lights !gobo for help!");

    expect(twitch2Ma["telnet"].send).not.toBeCalled();
});

test("Telnet command failed", async () => {

    let aliceRawMessage = new TwitchPrivateMessage("doesNotMatter", null, null, {nick: "Alice"});

    let commandExecutedHandler = jest.fn();
    let errorHandler = jest.fn();

    twitch2Ma.onCommandExecuted(commandExecutedHandler);
    twitch2Ma.onError(errorHandler);

    jest.spyOn(twitch2Ma["telnet"], "send").mockRejectedValueOnce(new Error());

    await twitch2Ma.start();

    await sendMessageToBotAndDontExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!red", aliceRawMessage);

    expect(twitch2Ma["telnet"].send).toBeCalledWith("Macro 1");
    expect(errorHandler).toBeCalledWith(new TelnetError("Sending telnet command failed!"));
    expect(commandExecutedHandler).not.toBeCalled();
});

test("Command permissions denied", async () => {

    let aliceRawMessage = new TwitchPrivateMessage("doesNotMatter", null, null, {nick: "Alice"});
    let permissionDeniedHandler = jest.fn();

    twitch2Ma.onPermissionDenied(permissionDeniedHandler);

    await twitch2Ma.start();

    await sendMessageToBotAndExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!red", aliceRawMessage, "@Alice set the lights to red!");

    await sendMessageToBotAndExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!red", aliceRawMessage, "@Alice, please wait \\d{1,2} seconds and try again!");

    return expect(permissionDeniedHandler).toBeCalledWith("#doesNotMatter", "Alice", "!red", "cooldown");
});

test("Command permissions denied but godMode enabled", async () => {

    let aliceRawMessage = new TwitchPrivateMessage("doesNotMatter", null, new Map([["badges", "moderator"]]), {nick: "Alice"});
    let godModeHandler = jest.fn();

    twitch2Ma.onGodMode(godModeHandler);

    await twitch2Ma.start();

    await sendMessageToBotAndExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!red", aliceRawMessage, "@Alice set the lights to red!");

    await sendMessageToBotAndExpectAnswer(twitch2Ma, jest.spyOn(twitch2Ma["chatClient"], "say"), "#doesNotMatter",
        "Alice", "!red", aliceRawMessage, "@Alice set the lights to red!");

    return expect(godModeHandler).toBeCalledWith("#doesNotMatter", "Alice", "user is moderator");
})

test("Message not involving the bot", async () => {

    await twitch2Ma.start();

    let spyOnTwitchSay = jest.spyOn(twitch2Ma["chatClient"], "say");

    await sendMessageToBotAndDontExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter",
        "Alice", "Hello world!", null);

    await sendMessageToBotAndDontExpectAnswer(twitch2Ma, spyOnTwitchSay, "#doesNotMatter",
        "Alice", "!command", null);
});

async function sendMessageToBotAndExpectAnswer(twitch2Ma: Twitch2Ma,
                                         spyOnTwitchSay: jest.SpyInstance,
                                         channel: string,
                                         user: string,
                                         message: string,
                                         rawMessage: TwitchPrivateMessage,
                                         answer: string) {

    await sendMessageToBot(twitch2Ma, channel, user, message, rawMessage);
    expect(spyOnTwitchSay).toBeCalledWith(channel, expect.stringMatching(answer));
}

async function sendMessageToBotAndDontExpectAnswer(twitch2Ma: Twitch2Ma,
                                                   spyOnTwitchSay: jest.SpyInstance,
                                                   channel: string,
                                                   user: string,
                                                   message: string,
                                                   rawMessage: TwitchPrivateMessage) {

    await sendMessageToBot(twitch2Ma, channel, user, message, rawMessage);
    expect(spyOnTwitchSay).not.toBeCalled();
}

async function sendMessageToBot(twitch2Ma: Twitch2Ma, channel: string, user: string, message: string, rawMessage: TwitchPrivateMessage) {
    // @ts-ignore
    await twitch2Ma["chatClient"].onPrivmsgHandler(channel, user, message, rawMessage);
}

function getTwitch2MaInstanceAndEnableLogin(newConfig?: Config): Twitch2Ma {

    let twitch2Ma = new Twitch2Ma(newConfig || config);

    jest.spyOn(twitch2Ma["telnet"], "exec")
        .mockResolvedValueOnce(`Logged in as User '${config.ma.user}'`);

    return twitch2Ma;
}

function loadConfig(overrideConfigValues?: any): Config {
    return new Config(_.assign({}, JSON.parse(Fs.readFileSync("config.json.sample", {encoding: "utf-8"})), overrideConfigValues));
}
