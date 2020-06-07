import {Command, Config, Parameter} from "./Config";
import TwitchPrivateMessage from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";

export class RuntimeInformation {

    public readonly config: Config;
    public readonly userName: string;
    public readonly rawMessage: TwitchPrivateMessage;
    public readonly instructions: Command | Parameter;

    constructor(config: Config, userName: string, rawMessage: TwitchPrivateMessage, instructions: Command | Parameter) {
        this.config = config;
        this.userName = userName;
        this.rawMessage = rawMessage;
        this.instructions = instructions;
    }
}
