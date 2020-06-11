import {Command} from "commander";
import Twitch2Ma from "./Twitch2Ma";
import {Config} from "./Config";
import {CommandSocket} from "./CommandSocket";

import Fs = require("fs");
import YAML = require("yaml");
import _ = require("lodash");
import chalk = require("chalk");
import ipc = require("node-ipc");
import childProcess = require("child_process");

const semverGt = require('semver/functions/gt')
const packageInformation = require("../../package.json");

let commandSocket: CommandSocket;

export async function main() {

    process.on("SIGINT", exit);

    return require("libnpm")
        .manifest(`${packageInformation.name}@latest`)
        .then(notifyUpdate)
        .catch(() => warning("Could not get update information!"))
        .then(init);
}

function init(): void {
    let program = new Command()
        .name(packageInformation.name)
        .description(packageInformation.description)
        .version(packageInformation.version, "-v, --version", "output the current version");

    program.command("start", {isDefault: true})
        .description("starts twitch2ma bot")
        .arguments("[configFile]")
        .option("-d, --detach", "detach the bot from the terminal and run as daemon")
        .action((configFile, cmd) => {

            loadConfig(configFile)
                .then(config => new Twitch2Ma(config))
                .then(twitch2Ma => {
                    if (cmd.detach) {
                        startChildProcess();
                    } else {
                        return attachEventHandlers(twitch2Ma)
                            .then(twitch2Ma => twitch2Ma.start())
                            .then(openCommandSocket);
                    }
                })
                .catch(exitWithError);
        });

    program.command("stop")
        .description("stops twitch2ma bot")
        .action(() => emitSocketEvent("exit"));

    program.parse(process.argv);
}

function startChildProcess() {

    for (let i = 0; i < process.argv.length; i++) {

        if (process.argv[i] === "-d" || process.argv[i] === "--detach") {
            process.argv[i] = "";
        }
    }

    process.argv[0] = "";

    let subProcess = childProcess.spawn(process.argv0, process.argv, {
        stdio: "ignore",
        shell: true,
        detached: true,
        windowsHide: true
    });

    subProcess.on("error", error => {
        console.error(error);
    })

    if (subProcess) {
        subProcess.unref();
        confirm("twitch2ma starting detached!");
    } else {
        throw new Error("twitch2ma could not start detached!");
    }
}

function exit() {
    console.log(chalk`\n{bold Thank you for using twitch2ma} ❤️`);
    process.exit(0);
}

function emitSocketEvent(event: string) {

    ipc.config.appspace = "twitch2ma.";
    ipc.config.silent = true;

    ipc.connectTo("main", () => {

        ipc.of.main.on("connect", () => {
            ipc.of.main.emit(event);
            ipc.disconnect("main");
        });

        ipc.of.main.on("error", () => {
            ipc.disconnect("main");
            error("Could not connect to socket: Is twitch2ma running?");
            process.exit(1);
        });
    });
}

function openCommandSocket() {
    commandSocket = new CommandSocket();
    commandSocket.onExitCommand(() => {
        socket("Exit command received!");
        exit();
    });
}

export function notifyUpdate(manifest: any) {
    if (semverGt(manifest.version, packageInformation.version)) {
        console.log(chalk`🔔 {blue A new version of ${packageInformation.name} is available!} ` +
            chalk`{blue (current: {bold ${packageInformation.version}}, new: {bold ${manifest.version}})}`);
    }
}

export async function attachEventHandlers(twitch2Ma: Twitch2Ma): Promise<Twitch2Ma> {

    twitch2Ma.onTelnetConnected((host, user) => confirm(chalk`Telnet connected to {bold ${user}:***@${host}:30000}.`));
    twitch2Ma.onTwitchConnected(channel => confirm(chalk`Twitch connected to {bold #${channel}}.`));

    twitch2Ma.onCommandExecuted((channel, user, chatCommand, parameterName, consoleCommand) => {

        parameterName = _.isString(parameterName) ? ` ${parameterName}` : "";

        channelMessage(channel, chalk`💡 User {bold ${user}} executed {bold.blue !${chatCommand}${parameterName}}`
            + (_.isString(consoleCommand) ? chalk` ({magenta ${consoleCommand}}) on the desk.` : '.'));
    });

    twitch2Ma.onHelpExecuted((channel, user, helpCommand) => {
        if (_.isString(helpCommand)) {
            channelMessage(channel, chalk`🤨 User {bold ${user}} got help for {bold.blue !${helpCommand}}.`);
        } else {
            channelMessage(channel, chalk`📖 User {bold ${user}} listed available commands.`);
        }
    });

    twitch2Ma.onGodMode((channel, user, reason) => channelMessage(channel,
        chalk`💪 User {bold ${user}} activated {bold.inverse  god mode } because: ${reason}.`));

    twitch2Ma.onPermissionDenied((channel, user, reason) => channelMessage(channel,
        chalk`✋ User {bold ${user}} tried to run a command but permissions were denied because of ${reason}.`))

    twitch2Ma.onError(exitWithError);

    return twitch2Ma;
}

export async function loadConfig(configFile: string): Promise<Config> {

    let configFileIsDefault = !_.isString(configFile);

    if (configFileIsDefault) {
        configFile = "config.json";
    }

    let rawConfigFile = Fs.readFileSync(configFile, {encoding: "utf-8"});
    let rawConfigObject = _.attempt(() => JSON.parse(rawConfigFile));

    if (rawConfigObject instanceof Error) {
        try {
            rawConfigObject = YAML.parse(rawConfigFile);
        } catch (ignored) {
            throw new Error(`Config file ${configFile} is not a valid JSON or YAML file!`);
        }
    }

    return new Config(rawConfigObject);
}

export function exitWithError(err: Error) {
    error((err.message.slice(-1) === "!" ? err.message : err.message + "!") + " Exiting...");
    process.exit(1);
}

function socket(message: string) {
    console.log(chalk`{inverse ${message}}`);
}

function channelMessage(channel: string, message: string): void {
    console.log(chalk`{bgGreen.black  ${channel} }: ${message}`);
}

function confirm(message: string): void {
    console.log(chalk`✅ {green ${message}}`);
}

function warning(message: string): void {
    console.warn(chalk`⚠️ {yellow ${message}}`)
}

function error(message: string): void {
    console.error(chalk`❌ {bold.red ${message}}`);
}
