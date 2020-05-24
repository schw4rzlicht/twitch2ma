class MaConfig {
    public host: string;
    public user: string;
    public password: string;

    constructor(maConfig: any) {
        this.host = maConfig.host;
        this.user = maConfig.user;
        this.password = maConfig.password;
    }
}

class TwitchConfig {
    public clientId: string;
    public accessToken: string;
    public channel: string;

    constructor(twitchConfig: any) {
        this.clientId = twitchConfig.clientId;
        this.accessToken = twitchConfig.accessToken;
        this.channel = twitchConfig.channel;
    }
}

export class Command {
    public chatCommand: string;
    public consoleCommand: string;
    public message: string;
    public help: string;

    constructor(command: any) {
        this.chatCommand = command.chatCommand;
        this.consoleCommand = command.consoleCommand;
        this.message = command.message;
        this.help = command.help;
    }
}

export class Config {
    public timeout: number;
    public ma: MaConfig;
    public twitch: TwitchConfig;
    public commands: Array<Command>;

    constructor(config: any) {
        this.timeout = config.timeout;
        this.ma = new MaConfig(config.ma);
        this.twitch = new TwitchConfig(config.twitch);
        this.commands = new Array<Command>();

        for (const command of config.commands) {
            this.commands.push(new Command(command));
        }
    }
}
