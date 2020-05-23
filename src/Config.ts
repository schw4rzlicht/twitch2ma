import Fs from "fs";

class MaConfig {
    public host: string;
    public user: string = "administrator";
    public password: string = "admin";
}

class TwitchConfig {
    public clientId: string;
    public accessToken: string;
    public channel: string;
}

class Command {
    public chatCommand: string;
    public consoleCommand: string;
    public message: string = null;
    public help: string = null;
}

export default class Config {
    public timeout: number;
    public ma: MaConfig;
    public twitch: TwitchConfig;
    public commands: Array<Command>;
}
