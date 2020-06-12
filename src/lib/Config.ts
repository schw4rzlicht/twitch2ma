import Ajv = require("ajv");
import configSchema = require("../resources/config.schema.json");
import _ = require("lodash");

export class Config {

    public readonly timeout: number;
    public readonly ma: MaConfig;
    public readonly twitch: TwitchConfig;
    public readonly sacn: SACNConfig;
    public readonly commands: Array<Command>;
    public readonly availableCommands: string;

    private readonly commandMap: _.Dictionary<Command>;

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
        this.sacn = config.sacn ? config.sacn : null;
        this.commands = new Array<Command>();

        for (const command of config.commands) {
            this.commands.push(new Command(command));
        }

        this.availableCommands = _.map(this.commands, command => `!${command.chatCommand}`).join(", ");
        this.commandMap = _.zipObject(_.map(this.commands, command => command.chatCommand), this.commands);
    }

    getCommand(chatCommand: string): Command {
        return _.get(this.commandMap, chatCommand);
    }
}

export class MaConfig {

    public readonly host: string;
    public readonly user: string;
    public readonly password: string;

    constructor(maConfig: any) {
        this.host = maConfig.host;
        this.user = maConfig.user;
        this.password = maConfig.password;
    }
}

export class TwitchConfig {

    public readonly clientId: string;
    public readonly accessToken: string;
    public readonly channel: string;

    constructor(twitchConfig: any) {
        this.clientId = twitchConfig.clientId;
        this.accessToken = twitchConfig.accessToken;
        this.channel = twitchConfig.channel;
    }
}

export interface Instructions {
    getChatCommand(): string;
    readonly consoleCommand: string;
    readonly message: string;
    readonly sacn: SACNLock;
}

export class Command implements Instructions {

    public readonly chatCommand: string;
    public readonly consoleCommand: string;
    public readonly message: string;
    public readonly help: string;
    public readonly sacn: SACNLock;
    public readonly parameters: Array<Parameter>;
    public readonly availableParameters: string;

    private readonly parameterMap: _.Dictionary<Parameter>;

    constructor(command: any) {
        this.chatCommand = command.chatCommand;
        this.consoleCommand = command.consoleCommand;
        this.message = command.message;
        this.help = command.help;

        if(command.sacn) {
            this.sacn = new SACNLock(command.sacn);
        }

        this.parameters = new Array<Parameter>();

        if(_.isArray(command.parameters)) {
            for (const parameter of command.parameters) {
                this.parameters.push(new Parameter(parameter));
            }
            this.parameterMap = _.zipObject(_.map(this.parameters, parameter => parameter.parameter), this.parameters);
            this.availableParameters = _.map(this.parameters, parameter => parameter.parameter).join(", ");
        } else {
            this.parameterMap = {};
        }
    }

    getChatCommand(): string {
        return this.chatCommand;
    }

    getParameter(parameter: string): Parameter {
        return _.get(this.parameterMap, parameter);
    }
}

export class Parameter implements Instructions {

    public readonly parameter: string;
    public readonly consoleCommand: string;
    public readonly message: string;
    public readonly sacn: SACNLock;

    constructor(parameter: any) {
        this.parameter = parameter.parameter;
        this.consoleCommand = parameter.consoleCommand;
        this.message = parameter.message;

        if(parameter.sacn) {
            this.sacn = new SACNLock(parameter.sacn);
        }
    }

    getChatCommand(): string {
        return this.parameter;
    }
}

export class SACNLock {

    public readonly universe: number;
    public readonly channel: number;

    constructor(sacn: any) {
        this.universe = sacn.universe;
        this.channel = sacn.channel;
    }
}

export class SACNConfig {

    public readonly lockMessage: string;
    public readonly interface: string;

    constructor(sacn: any) {
        this.lockMessage = sacn.lockMessage;
        this.interface = sacn.interface;
    }
}
