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

    private config: Config;
    private telnet: Telnet;
    private permissionController: PermissionController;
    private twitchClient: TwitchClient;
    private chatClient: TwitchChat;
    private initializing: boolean;

    constructor(config: Config) {
        super();
        this.config = config;
        this.telnet = new TelnetClient();
        this.initializing = false;

        this.permissionController = new PermissionController()
            .withPermissionInstance(new CooldownPermission())
            .withPermissionInstance(new OwnerPermission())
            .withPermissionInstance(new ModeratorPermission());
    }

    reloadConfig(config: Config) {

        if (this.initializing) {
            throw new Error("twitch2ma is initializing!");
        }

        let needsTelnetReload = !_.isEqual(this.config.ma, config.ma);
        let needsTwitchReload = !_.isEqual(this.config.twitch, config.twitch) || needsTelnetReload;

        this.initializing = true;

        let reloadChain = Promise.resolve();

        if (needsTwitchReload) {
            reloadChain = reloadChain
                .then(() => this.emit(this.onNotice, "Disconnecting Twitch..."))
                .then(() => this.chatClient.removeListener())
                .then(() => this.stopTwitch());
        }

        if (needsTelnetReload) {
            reloadChain = reloadChain
                .then(() => this.emit(this.onNotice, "Reconnecting telnet..."))
                .then(() => this.telnet.end())
                .then(() => this.startTelnet(config.ma.host, config.ma.user, config.ma.password));
        }

        if (needsTwitchReload) {
            reloadChain = reloadChain
                .then(() => this.emit(this.onNotice, "Connecting Twitch..."))
                .then(() => this.initTwitch(config));
        }

        return reloadChain
            .then(() => this.config = config)
            .then(() => this.initializing = false)
            .then(() => this.emit(this.onConfigReloaded))
            .catch(error => this.stopWithError(error));
    }

    private startTelnet(host: string, user: string, password: string) {
        return this.telnet
            .connect({
                host: host,
                port: 30000,
                shellPrompt: /\[.+]>.../,
                echoLines: 0,
                ors: "\r\n",
            })
            .catch(() => {
                throw new TelnetError("Could not connect to desk!")
            })
            .then(() => this.telnetLogin(host, user, password));
    }

    private stopTwitch() {

        let stopChain = Promise.resolve();

        if (_.isObject(this.chatClient)) {
            stopChain.then(() => this.chatClient.quit());
        }

        return stopChain;
    }

    start() {
        this.initializing = true;
        return this.startTelnet(this.config.ma.host, this.config.ma.user, this.config.ma.password)
            .then(() => this.initTwitch())
            .then(() => this.initializing = false);
    }

    stop() {
        return this.stopTwitch().finally(this.telnet.end);
    }

    stopWithError(error: Error) {
        this.emit(this.onError, error);
        return this.stop();
    }

    telnetLogin(host: string, user: string, password: string) {
        return this.telnet.exec(`Login ${user} ${password}`)
            .then((message: string) => {
                if (message.match(`Logged in as User '${user}'`)) {
                    this.emit(this.onTelnetConnected, host, user);
                } else {
                    throw new TelnetError(`Could not log into the desk as user ${user}!`);
                }
            });
    }

    initTwitch(config: Config = this.config) {

        return Promise.resolve()
            .then(() => {
                this.twitchClient = Twitch.withCredentials(config.twitch.clientId, config.twitch.accessToken);
                this.chatClient = TwitchChat.forTwitchClient(this.twitchClient);

                this.chatClient.onPrivmsg((channel, user, message, rawMessage) =>
                    this.handleMessage(channel, user, message, rawMessage));

            }).then(() => new Promise((resolve, reject) => {

                this.chatClient.onRegister(() => {
                    this.chatClient.join(config.twitch.channel)
                        .then(() => resolve())
                        .catch(() => reject(new ChannelError()));
                });

                this.chatClient.connect()
                    .catch(error => reject(error));

            })).then(() => this.emit(this.onTwitchConnected, config.twitch.channel));
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
                        .catch((error: PermissionError) => {
                            let reason = error.permissionCollector.permissionDeniedReasons.shift();
                            this.chatClient.say(channel, reason.viewerMessage);
                            this.emit(this.onPermissionDenied, channel, user, reason.name);
                        })
                        .catch(() => this.stopWithError(new TelnetError("Sending telnet command failed!")));
                }
            }
        }
    }

    async sendCommand(instructions: any, channel: string, user: string, rawMessage: TwitchPrivateMessage) {
        return this.permissionController.checkPermissions(new RuntimeInformation(this.config, user, rawMessage))
            .then((permissionCollector: PermissionCollector) => {
                if (permissionCollector.permissionDeniedReasons.length > 0 && permissionCollector.godMode) {
                    this.emit(this.onGodMode, channel, user, permissionCollector.godModeReasons.shift());
                }
            })
            .then(() => {
                if (_.isString(instructions.consoleCommand)) {
                    return this.telnet.send(instructions.consoleCommand)
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
            console.error(error);
        }
    }

    onTelnetConnected = this.registerEvent<(host: string, user: string) => any>();
    onTwitchConnected = this.registerEvent<(channel: string) => any>();
    onError = this.registerEvent<(error: Error) => any>();
    onCommandExecuted = this.registerEvent<(channel: string, user: string, chatCommand: string, parameter: string, consoleCommand: string) => any>();
    onHelpExecuted = this.registerEvent<(channel: string, user: string, helpCommand?: string) => any>();
    onPermissionDenied = this.registerEvent<(channel: string, user: string, reason: string) => any>();
    onGodMode = this.registerEvent<(channel: string, user: string, reason: string) => any>();
    onNotice = this.registerEvent<(message: string) => any>();
    onConfigReloaded = this.registerEvent<() => any>();
}
