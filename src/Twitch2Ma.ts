import {EventEmitter} from '@d-fischer/typed-event-emitter';
import Telnet from "telnet-client";
import Twitch from "twitch";
import TwitchChat from "twitch-chat-client";
import humanizeDuration from "humanize-duration";
import TwitchClient from "twitch";
import Config from "./Config";
import SourceMapSupport from "source-map-support";

SourceMapSupport.install();

class TelnetError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, TelnetError.prototype);
    }
}

class ChannelError extends Error {
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
        this.telnet = new Telnet();
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
        if (this.chatClient) {
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
            .then(message => {
                if (!message.match(`Logged in as User '${this.config.ma.user}'`)) {
                    throw new TelnetError(`Could not log in as user ${this.config.ma.user}!`);
                }
            });
    }

    initTwitch(): Promise<void> {

        let commandMap = new Map();
        for (const command of this.config.commands) {
            commandMap.set(command.chatCommand, command);
        }

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
            if (chatCommand !== null) {

                if (chatCommand[1] === "ma") {
                    let message: string;
                    if (chatCommand[2] !== undefined) {

                        let maCommand = chatCommand[2].match(/ !?(\w+)/)[1];
                        let command = commandMap.get(maCommand);

                        if (command === undefined) {
                            message = `Command !${maCommand} does not exist! Type !ma for a list of available commands.`;
                        } else {
                            if (command.help !== undefined) {
                                message = `Help for !${maCommand}: ${command.help}`;
                            } else {
                                message = `No help for !${maCommand} available!`;
                            }
                            this.emit(this.onHelpExecuted, channel, user, command.chatCommand);
                        }
                    } else {
                        if (this.config.commands.length > 0) {
                            let commands: string[] = [];
                            for (const command of this.config.commands) {
                                commands.push(`!${command.chatCommand}`);
                            }

                            message = "Available commands are: " + commands.join(", ") + ". Type !ma !command for help.";
                        } else {
                            message = "There are no commands available.";
                        }
                        this.emit(this.onHelpExecuted, channel, user);
                    }
                    this.chatClient.say(channel, message);

                } else {

                    let difference = lastCall === null ? -1 : lastCall + this.config.timeout * 1000 - now;

                    if (difference < 0 || rawMessage.userInfo.isMod || user === this.config.twitch.channel) {
                        let command = commandMap.get(chatCommand[1]);
                        if (command !== undefined) {
                            this.telnet
                                .send(command.consoleCommand)
                                .then(() => lastCall = now)
                                .then(() => {
                                    if (command.message !== undefined) {
                                        this.chatClient.say(channel, command.message.replace("{user}", user));
                                    }
                                })
                                .then(() => this.emit(this.onCommandExecuted, channel, user, chatCommand[1], command.consoleCommand))
                                .catch(() => this.stopWithError(new TelnetError("Sending telnet command failed!")));
                        }
                    } else {
                        let differenceString = humanizeDuration(difference - difference % 1000);
                        this.chatClient.say(channel, `${user}, please wait ${differenceString} and try again!`);
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
