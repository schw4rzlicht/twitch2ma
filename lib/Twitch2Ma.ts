import {EventEmitter} from '@d-fischer/typed-event-emitter';
import Twitch from "twitch";
import TwitchChat from "twitch-chat-client";
import TwitchClient from "twitch";
import {Config, Command, Parameter} from "./Config";
import type Telnet from "telnet-client";

import humanizeDuration = require("humanize-duration");
import SourceMapSupport = require("source-map-support");
import _ = require("lodash");
import TwitchPrivateMessage from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";

const TelnetClient = require("telnet-client");

SourceMapSupport.install();

export class TelnetError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, TelnetError.prototype);
    }
}

export class ChannelError extends Error {
    constructor() {
        super("Joining channel failed. Did you type the channel name correctly?");
        Object.setPrototypeOf(this, ChannelError.prototype);
    }
}

export default class Twitch2Ma extends EventEmitter {

    private config: Config;
    private telnet: Telnet;
    private twitchClient: TwitchClient;
    private chatClient: TwitchChat;
    private lastCall: number;

    constructor(config: Config) {
        super();
        this.config = config;
        this.telnet = new TelnetClient();
    }

    start(): Promise<void> {
        return this.telnet
            .connect({
                host: this.config.ma.host,
                port: 30000,
                shellPrompt: /\[.+]>.../,
                echoLines: 0,
                ors: "\r\n",
            })
            .catch(() => {
                throw new TelnetError("Could not connect to desk!")
            })
            .then(() => this.telnetLogin())
            .then(() => this.initTwitch());
    }

    stop(): Promise<void> {
        if (_.isObject(this.chatClient)) {
            return this.chatClient.quit()
                .finally(this.telnet.end);
        }
        return this.telnet.end();
    }

    stopWithError(error: Error): Promise<void> {
        this.emit(this.onError, error);
        return this.stop();
    }

    telnetLogin(): Promise<void> {
        return this.telnet.exec(`Login ${this.config.ma.user} ${this.config.ma.password}`)
            .then((message: string) => {
                if (!message.match(`Logged in as User '${this.config.ma.user}'`)) {
                    throw new TelnetError(`Could not log into the desk as user ${this.config.ma.user}!`);
                }
            });
    }

    initTwitch(): Promise<void> {

        this.twitchClient = Twitch.withCredentials(this.config.twitch.clientId, this.config.twitch.accessToken);
        this.chatClient = TwitchChat.forTwitchClient(this.twitchClient);

        this.chatClient.onRegister(() => {
            this.chatClient.join(this.config.twitch.channel)
                .catch(() => this.stopWithError(new ChannelError()));
        });

        this.chatClient.onPrivmsg((channel, user, message, rawMessage) =>
            this.handleMessage(channel, user, message, rawMessage));

        return this.chatClient.connect();
    }

    async handleMessage(channel: string, user: string, message: string, rawMessage: TwitchPrivateMessage) {

        let now = new Date().getTime();

        let raw = message.match(/!([a-zA-Z0-9]+)( !?([a-zA-Z0-9]+))?/);
        if (_.isArray(raw)) {

            let chatCommand = raw[1];
            let parameterName = raw[3];

            if (chatCommand === "lights") {
                this.sendHelp(channel, user, parameterName);
            } else {

                let command = this.config.getCommand(chatCommand);
                if (command instanceof Command) {

                    let instructions: any = command;
                    if (_.isString(parameterName)) {
                        let parameter = command.getParameter(parameterName);
                        if (parameter instanceof Parameter) {
                            instructions = parameter
                        } else {
                            this.chatClient.say(channel, `Parameter ${parameterName} does not exist! Type !lights !${chatCommand} for help!`);
                            return;
                        }
                    }

                    let cooldown = this.cooldown(now, this.lastCall, rawMessage);
                    if (cooldown <= 0) {
                        return (_.isString(instructions.consoleCommand)
                            ? this.telnet.send(instructions.consoleCommand)
                            : new Promise(resolve => resolve()))
                            .then(() => this.lastCall = now)
                            .then(() => {
                                if (_.isString(instructions.message)) {
                                    this.chatClient.say(channel, instructions.message.replace("{user}", `@${user}`));
                                }
                            })
                            .then(() => this.emit(this.onCommandExecuted, channel, user, chatCommand, parameterName, instructions.consoleCommand))
                            .catch(() => this.stopWithError(new TelnetError("Sending telnet command failed!")));
                    } else {
                        let differenceString = humanizeDuration(cooldown + (1000 - cooldown % 1000));
                        this.chatClient.say(channel, `@${user}, please wait ${differenceString} and try again!`);
                    }
                }
            }
        }
    }

    cooldown(now: number, lastCall: number, rawMessage: TwitchPrivateMessage): number {

        if (rawMessage.userInfo.isMod || rawMessage.userInfo.userName === this.config.twitch.channel.toLowerCase()) {
            return 0;
        }

        return _.isInteger(lastCall) ? lastCall + this.config.timeout * 1000 - now : 0;
    }

    sendHelp(channel: string, user: string, helpCommand: string) {
        let message: string;
        if (_.isString(helpCommand)) {

            let command = this.config.getCommand(helpCommand);

            if (command instanceof Command) {
                if (_.isString(command.help)) {
                    let parametersHelp = _.isString(command.availableParameters) ? `Available parameters: ${command.availableParameters}` : "";
                    message = `Help for !${helpCommand}: ${command.help.replace("{parameterList}", parametersHelp).trim()}`;
                } else {
                    message = `No help for !${helpCommand} available!`;
                }
                this.emit(this.onHelpExecuted, channel, user, command.chatCommand);
            } else {
                message = `Command !${helpCommand} does not exist! Type !lights for a list of available commands.`;
            }
        } else {
            if (_.size(this.config.commands)) {
                message = "Available commands are: " + this.config.availableCommands + ". Type !lights !command for help.";
            } else {
                message = "There are no commands available.";
            }
            this.emit(this.onHelpExecuted, channel, user);
        }
        this.chatClient.say(channel, message);
    }

    onError = this.registerEvent<(error: Error) => any>();
    onCommandExecuted = this.registerEvent<(channel: string, user: string, chatCommand: string, parameter: string, consoleCommand: string) => any>();
    onHelpExecuted = this.registerEvent<(channel: string, user: string, helpCommand?: string) => any>();
}
