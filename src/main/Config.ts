class MaConfig {
    public host: string;
    public user: string;
    public password: string;
}

class TwitchConfig {
    public clientId: string;
    public accessToken: string;
    public channel: string;
}

class Command {
    public chatCommand: string;
    public consoleCommand: string;
    public message: string;
    public help: string;
}

export default class Config {
    public timeout: number;
    public ma: MaConfig;
    public twitch: TwitchConfig;
    public commands: Array<Command>;
}
