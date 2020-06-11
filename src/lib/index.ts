import {Command} from "commander";
import Twitch2Ma from "./Twitch2Ma";
import {Config} from "./Config";
import {CommandSocket} from "./CommandSocket";
import {Logger} from "./Logger";

import Fs = require("fs");
import YAML = require("yaml");
import _ = require("lodash");
import chalk = require("chalk");
import ipc = require("node-ipc");
import childProcess = require("child_process");

const semverGt = require('semver/functions/gt')
const packageInformation = require("../../package.json");

let logger = new Logger();
let commandSocket: CommandSocket = new CommandSocket();

export async function main() {

    process.on("SIGINT", exit);

    return require("libnpm")
        .manifest(`${packageInformation.name}@latest`)
        .then(notifyUpdate)
        .catch(() => logger.warning("Could not get update information!"))
        .then(init);
}

function init(): void {
    let program = new Command()
        .name(packageInformation.name)
        .description(packageInformation.description)
        .version(packageInformation.version, "-v, --version", "output the current version");

    program.command("start", {isDefault: true})
        .description("start twitch2ma bot")
        .arguments("[configFile]")
        .option("-d, --detach", "detach the bot from the terminal and run as daemon")
        .option("-l, --logfile <logfile>", "log to logfile")
        .action((configFile, cmd) => {

            loadConfig(configFile)
                .then(config => new Twitch2Ma(config))
                .then(twitch2Ma => {

                    if (cmd.detach) {
                        return commandSocket.checkSocketExists().then(startChildProcess);
                    } else {

                        if (cmd.logfile) {
                            logger.setLogfile(cmd.logfile);
                        }

                        return attachEventHandlers(twitch2Ma)
                            .then(twitch2Ma => twitch2Ma.start())
                            .then(openCommandSocket);
                    }
                })
                .catch(exitWithError);
        });

    program.command("stop")
        .description("stop twitch2ma bot")
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

    if (subProcess) {
        subProcess.unref();
        logger.confirm("twitch2ma starting detached!");
    } else {
        throw new Error("twitch2ma could not start detached!");
    }
}

function exit() {

    console.log(chalk`\n{bold Thank you for using twitch2ma} ❤️`);
    logger.end();

    if(commandSocket) {
        commandSocket.stop();
    }

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
            logger.error("Could not connect to socket: Is twitch2ma running?");
            process.exit(1);
        });
    });
}

function openCommandSocket() {
    commandSocket.onError(exitWithError);
    commandSocket.onExitCommand(() => {
        logger.socketMessage("Exit command received!");
        exit();
    });
    return commandSocket.start();
}

export function notifyUpdate(manifest: any) {
    if (semverGt(manifest.version, packageInformation.version)) {
        console.log(chalk`🔔 {blue A new version of ${packageInformation.name} is available!} ` +
            chalk`{blue (current: {bold ${packageInformation.version}}, new: {bold ${manifest.version}})}`);
    }
}

export async function attachEventHandlers(twitch2Ma: Twitch2Ma): Promise<Twitch2Ma> {

    twitch2Ma.onTelnetConnected((host, user) => logger.confirm(chalk`Telnet connected to {bold ${user}:***@${host}:30000}.`));
    twitch2Ma.onTwitchConnected(channel => logger.confirm(chalk`Twitch connected to {bold #${channel}}.`));

    twitch2Ma.onCommandExecuted((channel, user, chatCommand, parameterName, consoleCommand) => {

        parameterName = _.isString(parameterName) ? ` ${parameterName}` : "";

        logger.channelMessage(channel, chalk`💡 User {bold ${user}} executed {bold.blue !${chatCommand}${parameterName}}`
            + (_.isString(consoleCommand) ? chalk` ({magenta ${consoleCommand}}) on the desk.` : '.'));
    });

    twitch2Ma.onHelpExecuted((channel, user, helpCommand) => {
        if (_.isString(helpCommand)) {
            logger.channelMessage(channel, chalk`🤨 User {bold ${user}} got help for {bold.blue !${helpCommand}}.`);
        } else {
            logger.channelMessage(channel, chalk`📖 User {bold ${user}} listed available commands.`);
        }
    });

    twitch2Ma.onGodMode((channel, user, reason) => logger.channelMessage(channel,
        chalk`💪 User {bold ${user}} activated {bold.inverse  god mode } because: ${reason}.`));

    twitch2Ma.onPermissionDenied((channel, user, reason) => logger.channelMessage(channel,
        chalk`✋ User {bold ${user}} tried to run a command but permissions were denied because of ${reason}.`))

    twitch2Ma.onError(error => exitWithError(new Error("SOCKET ERROR: " + error.message)));

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

    logger.error((err.message.slice(-1) === "!" ? err.message : err.message + "!") + " Exiting...");
    logger.end();

    if(commandSocket) {
        commandSocket.stop();
    }

    process.exit(1);
}
