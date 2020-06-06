import {Command} from "commander";
import Twitch2Ma from "./Twitch2Ma";
import {Config} from "./Config";

import Fs = require("fs");
import YAML = require("yaml");
import _ = require("lodash");
import chalk = require("chalk");

const packageInformation = require("../../package.json");

new Command()
    .name("twitch2ma")
    .description(packageInformation.description)
    .version(packageInformation.version, "-v, --version", "output the current version")
    .arguments("[configFile]")
    .action(configFile => {
        loadConfig(configFile)
            .then(config => new Twitch2Ma(config))
            .then(attachEventHandlers)
            .then(twitch2Ma => twitch2Ma.start())
            .catch(exitWithError);
    })
    .parse(process.argv);

async function attachEventHandlers(twitch2Ma: Twitch2Ma): Promise<Twitch2Ma> {

    twitch2Ma.onTelnetConnected((host, user) => confirm(`Telnet connected to {bold ${user}:***@${host}:30000}.`));
    twitch2Ma.onTwitchConnected(channel => confirm(`Twitch connected to {bold #${channel}}.`));

    twitch2Ma.onCommandExecuted((channel, user, chatCommand, parameterName, consoleCommand) => {

        parameterName = _.isString(parameterName) ? ` ${parameterName}` : "";

        channelMessage(channel, `User {bold ${user}} executed {bold.blue !${chatCommand}${parameterName}}`
            + (_.isString(consoleCommand) ? ` ({magenta ${consoleCommand}}) on the desk.` : '.'));
    });

    twitch2Ma.onHelpExecuted(((channel, user, helpCommand) => {
        if (_.isString(helpCommand)) {
            channelMessage(channel, `User {bold ${user}} got help for {bold.blue !${helpCommand}}.`);
        } else {
            channelMessage(channel, `User {bold ${user}} listed available commands.`);
        }
    }));

    twitch2Ma.onError(exitWithError);

    return twitch2Ma;
}

async function loadConfig(configFile: string): Promise<Config> {

    let configFileIsDefault = !_.isString(configFile);

    if (configFileIsDefault) {
        configFile = "config.json";
    }

    let rawConfigFile = Fs.readFileSync(configFile, {encoding: "utf-8"});

    let rawConfigObject = _.attempt(() => YAML.parse(rawConfigFile, {mapAsMap: true}));

    if (rawConfigObject instanceof Error) {
        try {
            rawConfigObject = JSON.parse(rawConfigFile);
        } catch (ignored) {
            throw new Error(`Config file ${configFile} is not a valid JSON or YAML file!`);
        }
    }

    return new Config(rawConfigObject);
}

function exitWithError(err: Error) {
    error((err.message.slice(-1) === "!" ? err.message : err.message + "!") + " Exiting...");
    process.exit(1);
}

function channelMessage(channel: string, message: string): void {
    console.log(chalk`{bgGreen.black  ${channel} }: ${message}`);
}

function confirm(message: string): void {
    console.log(chalk`✅ {green ${message}}`);
}

function error(message: string): void {
    console.error(chalk`❌ {bold.red ${message}}`);
}
