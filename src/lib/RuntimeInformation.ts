import {Config} from "./Config";
import TwitchPrivateMessage from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";

export class RuntimeInformation {

    public readonly config: Config;
    public readonly userName: string;
    public readonly rawMessage: TwitchPrivateMessage;

    constructor(config: Config, userName: string, rawMessage: TwitchPrivateMessage) {
        this.config = config;
        this.userName = userName;
        this.rawMessage = rawMessage;
    }
}
