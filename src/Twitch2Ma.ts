import {EventEmitter} from '@d-fischer/typed-event-emitter';
import Telnet from "telnet-client";
import Twitch from "twitch";
import TwitchChat from "twitch-chat-client";
import humanizeDuration from "humanize-duration";
import TwitchClient from "twitch";
import Config from "./Config";
import SourceMapSupport from "source-map-support";

SourceMapSupport.install();

enum State {
    Stopped,
    Starting,
    Started
}

export default class Twitch2Ma extends EventEmitter {

    private config: Config;
    private telnet: Telnet;
    private state: State;
    private twitchClient: TwitchClient;
    private chatClient: TwitchChat;

    constructor(config: Config) {
        super();
        this.config = config;
        this.telnet = new Telnet();
        this.state = State.Stopped;
    }

    start() {
        this.state = State.Starting;
        return this.telnet
            .connect({
                host: this.config.ma.host,
                port: 30000,
                shellPrompt: /\[Channel]>.../,
                echoLines: 0,
                ors: "\r\n",
            })
            .then(() => this.telnet.exec(`Login ${this.config.ma.user} ${this.config.ma.password}`))
            .then(() => this.initTwitch())
            .then(() => this.state = State.Started);
    }

    stop() {
        if (this.chatClient) {
            return this.chatClient.quit()
                .finally(this.telnet.end)
                .then(() => this.state = State.Stopped);
        }
        return this.telnet.end()
            .finally(() => this.state = State.Stopped);
    }

    stopWithError(error: string) {
        this.emit(this.onError, error);
        this.stop();
    }

    onError = this.registerEvent<(error: string) => any>();

    initTwitch() {

        let commandMap = new Map();
        for (const command of this.config.commands) {
            commandMap.set(command.chatCommand, command);
        }

        let lastCall: number;

        this.twitchClient = Twitch.withCredentials(this.config.twitch.clientId, this.config.twitch.accessToken);
        this.chatClient = TwitchChat.forTwitchClient(this.twitchClient);

        this.chatClient.onRegister(() => {
            this.chatClient.join(this.config.twitch.channel)
                .catch(() => this.stopWithError("Join to channel failed. Did you type the channel name correctly?"));
        });

        this.chatClient.onPrivmsg((channel, user, message, rawMessage) => {

            let now = new Date().getTime();

            let chatCommand = message.match(/!(\w+)/);
            if (chatCommand !== null) {

                let difference = lastCall === null ? -1 : lastCall + this.config.timeout * 1000 - now;

                if (difference < 0 || rawMessage.userInfo.isMod || user === this.config.twitch.channel) {
                    let command = commandMap.get(chatCommand[1]);
                    if (command !== null) {
                        this.telnet
                            .send(command.consoleCommand)
                            .then(() => lastCall = now)
                            .then(() => {
                                if (command.message !== null) {
                                    this.chatClient.say(channel, command.message.replace("{user}", user));
                                }
                            })
                            .catch(() => this.stopWithError("Sending telnet command failed!"));
                    }
                } else {
                    let differenceString = humanizeDuration(difference - difference % 1000);
                    this.chatClient.say(channel, `${user}, please wait ${differenceString} and try again!`);
                }
            }
        });

        return this.chatClient.connect();
    }
}
