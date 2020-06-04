import Ajv = require("ajv");
import configSchema = require("../resources/config.schema.json");
import _ = require("lodash");

export class Config {
    public timeout: number;
    public ma: MaConfig;
    public twitch: TwitchConfig;
    public commands: Array<Command>;

    constructor(config: any) {

        let ajv = new Ajv({
            allErrors: true,
            useDefaults: true
        });
        ajv.validate(configSchema, config);

        if(_.isArray(ajv.errors)) {
            throw new Error(`Config file is invalid: ${ajv.errorsText(ajv.errors, {dataVar: "config"})}!`);
        }

        this.timeout = config.timeout;
        this.ma = new MaConfig(config.ma);
        this.twitch = new TwitchConfig(config.twitch);
        this.commands = new Array<Command>();

        for (const command of config.commands) {
            this.commands.push(new Command(command));
        }
    }
}

export class MaConfig {
    public host: string;
    public user: string;
    public password: string;

    constructor(maConfig: any) {
        this.host = maConfig.host;
        this.user = maConfig.user;
        this.password = maConfig.password;
    }
}

export class TwitchConfig {
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
    public parameters: Array<Parameter>;

    constructor(command: any) {
        this.chatCommand = command.chatCommand;
        this.consoleCommand = command.consoleCommand;
        this.message = command.message;
        this.help = command.help;
        this.parameters = new Array<Parameter>();

        if(_.isArray(command.parameters)) {
            for (const parameter of command.parameters) {
                this.parameters.push(new Parameter(parameter));
            }
        }
    }
}

export class Parameter {
    public parameter: string;
    public consoleCommand: string;
    public message: string;

    constructor(parameter: any) {
        this.parameter = parameter.parameter;
        this.consoleCommand = parameter.consoleCommand;
        this.message = parameter.message;
    }
}
