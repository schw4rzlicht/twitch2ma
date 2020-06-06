import {Command} from "commander";
import Twitch2Ma from "./Twitch2Ma";
import {Config} from "./Config";

import Fs = require("fs");
import YAML = require("yaml");
import _ = require("lodash");
import chalk = require("chalk");

const packageInformation = require("../../package.json");

const program = new Command();

program
    .name("twitch2ma")
    .description(packageInformation.description)
    .version(packageInformation.version, "-v, --version", "output the current version")
    .arguments("[configFile]")
    .action(main)
    .parse(process.argv);

async function main(configFile: string) {

    const config = await loadConfig(configFile);
    const twitch2ma = new Twitch2Ma(config);

    twitch2ma.onCommandExecuted((channel, user, chatCommand, parameterName, consoleCommand) => {

        parameterName = _.isString(parameterName) ? ` ${parameterName}` : "";

        channelMessage(channel, `User {bold ${user}} executed {bold.blue !${chatCommand}${parameterName}}`
            + (_.isString(consoleCommand) ? ` ({magenta ${consoleCommand}}) on the desk.` : '.'));
    });

    twitch2ma.onHelpExecuted(((channel, user, helpCommand) => {
        if (_.isString(helpCommand)) {
            channelMessage(channel, `User {bold ${user}} got help for {bold.blue !${helpCommand}}.`);
        } else {
            channelMessage(channel, `User {bold ${user}} listed available commands.`);
        }
    }));

    twitch2ma.onError(exitWithError);

    twitch2ma.start()
        .then(() => {
            confirm(`Telnet connected to {bold ${config.ma.user}:***@${config.ma.host}:30000}`);
            confirm(`Twitch connected to {bold #${config.twitch.channel}}`);
            console.log();
        })
        .catch(exitWithError);
}

async function loadConfig(configFile: string): Promise<Config> {

    let configFileIsDefault = !_.isString(configFile);

    if (configFileIsDefault) {
        configFile = "config.json";
    }

    let rawConfigFile = failOnErrorOrReturnValue(_.attempt(() => Fs.readFileSync(configFile, {encoding: "utf-8"})),
        new Error(`Cannot open config file ${configFile}!`));

    let rawConfigObject = _.attempt(() => YAML.parse(rawConfigFile));

    if(rawConfigObject instanceof Error) {
        rawConfigObject = failOnErrorOrReturnValue(_.attempt(() => JSON.parse(rawConfigFile),
            new Error(`Config file ${configFile} is not a valid JSON or YAML file!`)));
    }

    return failOnErrorOrReturnValue(_.attempt(() => new Config(rawConfigObject)));
}

function failOnErrorOrReturnValue(value: any, overrideError?: Error) {
    if (_.isError(value)) {
        exitWithError(_.isError(overrideError) ? overrideError : value);
    } else {
        return value;
    }
}

function exitWithError(err: Error) {
    error(`${err.message} Exiting...}`);
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
