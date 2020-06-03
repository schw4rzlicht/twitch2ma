import {EventEmitter} from '@d-fischer/typed-event-emitter';
import Twitch from "twitch";
import TwitchChat from "twitch-chat-client";
import TwitchClient from "twitch";
import {Config, Command} from "./Config";
import type Telnet from "telnet-client";

import humanizeDuration = require("humanize-duration");
import SourceMapSupport = require("source-map-support");
import _ = require("lodash");

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

        let commands = _.zipObject(_.map(this.config.commands, command => command.chatCommand), this.config.commands);
        let lastCall: number;

        this.twitchClient = Twitch.withCredentials(this.config.twitch.clientId, this.config.twitch.accessToken);
        this.chatClient = TwitchChat.forTwitchClient(this.twitchClient);

        this.chatClient.onRegister(() => {
            this.chatClient.join(this.config.twitch.channel)
                .catch(() => this.stopWithError(new ChannelError()));
        });

        this.chatClient.onPrivmsg((channel, user, message, rawMessage) => {

            let now = new Date().getTime();

            let chatCommand = message.match(/!(\w+)( !?\w+)?/);
            if (_.isArray(chatCommand)) {

                if (chatCommand[1] === "lights") {
                    let message: string;
                    if (_.isString(chatCommand[2])) {

                        let helpCommand = chatCommand[2].match(/ !?(\w+)/)[1];
                        let command = _.get(commands, helpCommand);

                        if (command instanceof Command) {
                            if (_.isString(command.help)) {
                                message = `Help for !${helpCommand}: ${command.help}`;
                            } else {
                                message = `No help for !${helpCommand} available!`;
                            }
                            this.emit(this.onHelpExecuted, channel, user, command.chatCommand);
                        } else {
                            message = `Command !${helpCommand} does not exist! Type !lights for a list of available commands.`;
                        }
                    } else {
                        if (_.size(this.config.commands)) {
                            let commands = _.map(this.config.commands, command => `!${command.chatCommand}`);
                            message = "Available commands are: " + commands.join(", ") + ". Type !lights !command for help.";
                        } else {
                            message = "There are no commands available.";
                        }
                        this.emit(this.onHelpExecuted, channel, user);
                    }
                    this.chatClient.say(channel, message);

                } else {

                    let command = _.get(commands, chatCommand[1])
                    if (command instanceof Command) {

                        let difference = _.isInteger(lastCall) ? lastCall + this.config.timeout * 1000 - now : -1;
                        if (difference < 0 || rawMessage.userInfo.isMod || user === this.config.twitch.channel) {
                            this.telnet
                                .send(command.consoleCommand)
                                .then(() => lastCall = now)
                                .then(() => {
                                    if (_.isString(command.message)) {
                                        this.chatClient.say(channel, command.message.replace("{user}", `@${user}`));
                                    }
                                })
                                .then(() => this.emit(this.onCommandExecuted, channel, user, chatCommand[1], command.consoleCommand))
                                .catch(() => this.stopWithError(new TelnetError("Sending telnet command failed!")));
                        } else {
                            let differenceString = humanizeDuration(difference + (1000 - difference % 1000));
                            this.chatClient.say(channel, `@${user}, please wait ${differenceString} and try again!`);
                        }
                    }
                }
            }
        });

        return this.chatClient.connect();
    }

    onError = this.registerEvent<(error: Error) => any>();
    onCommandExecuted = this.registerEvent<(channel: string, user: string, chatCommand: string, consoleCommand: string) => any>();
    onHelpExecuted = this.registerEvent<(channel: string, user: string, helpCommand?: string) => any>();
}
