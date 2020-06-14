import {EventEmitter} from '@d-fischer/typed-event-emitter';
import {EventBinder} from "@d-fischer/typed-event-emitter/lib/EventEmitter";

import Twitch from "twitch";
import TwitchChat from "twitch-chat-client";
import TwitchClient from "twitch";
import TwitchPrivateMessage from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";

import {Config, Command, Parameter} from "./Config";
import {RuntimeInformation} from "./RuntimeInformation";

import {PermissionCollector, PermissionController, PermissionError} from "./PermissionController";
import CooldownPermission from "./permissions/CooldownPermission";
import OwnerPermission from "./permissions/OwnerPermission";
import ModeratorPermission from "./permissions/ModeratorPermission";
import SACNPermission from "./permissions/SACNPermission";

import sentry from "./sentry";

import * as Bluebird from "bluebird";
global.Promise = Bluebird as any;

import type Telnet from "telnet-client";

import SourceMapSupport = require("source-map-support");
import _ = require("lodash");

const TelnetClient = require("telnet-client");

SourceMapSupport.install();

export class TelnetError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, TelnetError.prototype);
        this.name = TelnetError.name;
    }
}

export class ChannelError extends Error {
    constructor() {
        super("Joining channel failed. Did you type the channel name correctly?");
        Object.setPrototypeOf(this, ChannelError.prototype);
        this.name = ChannelError.name;
    }
}

export default class Twitch2Ma extends EventEmitter {

    private readonly config: Config;
    private readonly telnet: Telnet;
    private readonly permissionController: PermissionController;
    private twitchClient: TwitchClient;
    private chatClient: TwitchChat;

    constructor(config: Config) {
        super();
        this.config = config;
        this.telnet = new TelnetClient();

        this.permissionController = new PermissionController()
            .withPermissionInstance(new SACNPermission(config))
            .withPermissionInstance(new CooldownPermission())
            .withPermissionInstance(new OwnerPermission())
            .withPermissionInstance(new ModeratorPermission());
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
                throw new TelnetError("Could not connect to desk! Check Telnet enabled, MA IP address and firewall " +
                    "settings if using onPC!");
            })
            .then(() => this.telnetLogin())
            .then(() => this.initTwitch());
    }

    async stop() {

        let promises: Array<Promise<any>> = [];

        if (this.chatClient) {
            promises.push(this.chatClient.quit());
        }

        if (this.telnet) {
            promises.push(this.telnet.end());
        }

        this.permissionController.stop();

        return Promise.all(promises);
    }

    stopWithError(error: Error): Promise<any> {
        this.emit(this.onError, error);
        return this.stop();
    }

    telnetLogin(): Promise<void> {
        return this.telnet.exec(`Login ${this.config.ma.user} ${this.config.ma.password}`)
            .then((message: string) => {
                if (message.match(`Logged in as User '${this.config.ma.user}'`)) {
                    this.emit(this.onTelnetConnected, this.config.ma.host, this.config.ma.user);
                } else {
                    throw new TelnetError(`Could not log into the desk as user ${this.config.ma.user}! Check password!`);
                }
            });
    }

    initTwitch(): Promise<void> {

        this.twitchClient = Twitch.withCredentials(this.config.twitch.clientId, this.config.twitch.accessToken);
        this.chatClient = TwitchChat.forTwitchClient(this.twitchClient);

        this.chatClient.onRegister(() => {
            this.chatClient.join(this.config.twitch.channel)
                .then(() => this.emit(this.onTwitchConnected, this.config.twitch.channel))
                .catch(() => this.stopWithError(new ChannelError()));
        });

        this.chatClient.onPrivmsg((channel, user, message, rawMessage) =>
            this.handleMessage(channel, user, message, rawMessage));

        return this.chatClient.connect();
    }

    async handleMessage(channel: string, user: string, message: string, rawMessage: TwitchPrivateMessage) {

        let raw = message.match(/!([a-zA-Z0-9-]+)( !?([a-zA-Z0-9-]+))?/);
        if (_.isArray(raw)) {

            let chatCommand = raw[1];
            let parameterName = raw[3];

            if (chatCommand === "lights") {
                this.sendHelp(channel, user, parameterName);
            } else {

                let command = this.config.getCommand(chatCommand);
                if (command instanceof Command) {

                    let instructions: Command | Parameter = command;
                    if (_.isString(parameterName)) {
                        let parameter = command.getParameter(parameterName);
                        if (parameter instanceof Parameter) {
                            instructions = parameter;
                        } else {
                            this.chatClient.say(channel, `Parameter ${parameterName} does not exist! Type !lights !${chatCommand} for help!`);
                            return;
                        }
                    }

                    return this.sendCommand(instructions, channel, user, rawMessage)
                        .then(() => {
                            if (_.isString(instructions.message)) {
                                this.chatClient.say(channel, instructions.message
                                    .replace("{user}", `@${user}`)
                                    .replace("{parameterList}", this.getParametersHelp(command))
                                    .trim());
                            }
                        })
                        .then(() => this.emit(this.onCommandExecuted, channel, user, chatCommand, parameterName, instructions.consoleCommand))
                        .catch(PermissionError, error => {
                            let command = _.isString(parameterName) ? `!${chatCommand} ${parameterName}` : `!${chatCommand}`;
                            let reason = error.permissionCollector.permissionDeniedReasons.shift();
                            this.chatClient.say(channel, reason.viewerMessage.replace("{command}", command));
                            this.emit(this.onPermissionDenied, channel, user, command, reason.name);
                        })
                        .catch(TelnetError, error => this.stopWithError(error))
                        .catch(error => sentry(error, error => this.stopWithError(error)));
                }
            }
        }
    }

    async sendCommand(instructions: any, channel: string, user: string, rawMessage: TwitchPrivateMessage) {
        return this.permissionController.checkPermissions(new RuntimeInformation(this.config, user, rawMessage, instructions))
            .then((permissionCollector: PermissionCollector) => {
                if (permissionCollector.permissionDeniedReasons.length > 0 && permissionCollector.godMode) {
                    this.emit(this.onGodMode, channel, user, permissionCollector.godModeReasons.shift());
                }
            })
            .then(() => {
                if (_.isString(instructions.consoleCommand)) {
                    return this.telnet.send(instructions.consoleCommand)
                        .catch(() => {
                            throw new TelnetError("Sending telnet command failed! Is MA still running?");
                        })
                        .then(() => this.permissionController.setAdditionalRuntimeInformation("lastCall", new Date().getTime()));
                }
            });
    }

    sendHelp(channel: string, user: string, helpCommand: string) {
        let message: string;
        if (_.isString(helpCommand)) {

            let command = this.config.getCommand(helpCommand);

            if (command instanceof Command) {
                if (_.isString(command.help)) {
                    message = `Help for !${helpCommand}: ${command.help.replace("{parameterList}", this.getParametersHelp(command)).trim()}`;
                } else {
                    message = `No help for !${helpCommand} available!`;
                }
                this.emit(this.onHelpExecuted, channel, user, command.chatCommand);
            } else {
                message = `Command !${helpCommand} does not exist! Type !lights for a list of available commands.`;
            }
        } else {
            if (_.size(this.config.commands)) {
                message = "Available commands are: " + this.config.availableCommands + ". Type !lights !command for help.";
            } else {
                message = "There are no commands available.";
            }
            this.emit(this.onHelpExecuted, channel, user);
        }
        this.chatClient.say(channel, message);
    }

    getParametersHelp(command: Command) {
        return _.isString(command.availableParameters) ? `Available parameters: ${command.availableParameters}` : "";
    }

    protected emit<Args extends any[]>(event: EventBinder<Args>, ...args: Args) {
        try {
            super.emit(event, ...args);
        } catch (error) {
            sentry(error);
        }
    }

    onTelnetConnected = this.registerEvent<(host: string, user: string) => any>();
    onTwitchConnected = this.registerEvent<(channel: string) => any>();
    onError = this.registerEvent<(error: Error) => any>();
    onCommandExecuted = this.registerEvent<(channel: string, user: string, chatCommand: string, parameter: string, consoleCommand: string) => any>();
    onHelpExecuted = this.registerEvent<(channel: string, user: string, helpCommand?: string) => any>();
    onPermissionDenied = this.registerEvent<(channel: string, user: string, command: string, reason: string) => any>();
    onGodMode = this.registerEvent<(channel: string, user: string, reason: string) => any>();
}
