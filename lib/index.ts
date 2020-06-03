import Twitch2Ma from "./Twitch2Ma";
import {Config} from "./Config";

import Ajv = require("ajv");
import configSchema = require("../resources/config.schema.json");
import Fs = require("fs");
import _ = require("lodash");
import chalk = require("chalk");

if(!_.isString(process.argv[2])) {
    exitWithError(new Error("No config file specified!"));
}

let jsonObject = failOnErrorOrReturnValue(_.attempt(() => JSON.parse(Fs.readFileSync(process.argv[2], {encoding: "utf-8"}))),
    new Error(`Cannot read config file ${process.argv[2]}!`));

let ajv = new Ajv({
    allErrors: true,
    useDefaults: true
});

ajv.validate(configSchema, jsonObject);

if(_.isArray(ajv.errors)) {
    exitWithError(new Error(`Config file is invalid: ${ajv.errorsText()}`));
}

const twitch2ma = new Twitch2Ma(new Config(jsonObject));

twitch2ma.onCommandExecuted((channel, user, chatCommand, consoleCommand) =>
    console.log(chalk`{bgGreen.black  ${channel} }: User {bold ${user}} executed {bold.blue !${chatCommand}} ({magenta ${consoleCommand}}) on the desk.`));

twitch2ma.onHelpExecuted(((channel, user, helpCommand) => {
    if(_.isString(helpCommand)) {
        console.log(chalk`{bgGreen.black  ${channel} }: User {bold ${user}} got help for {bold.blue !${helpCommand}}.`);
    } else {
        console.log(chalk`{bgGreen.black  ${channel} }: User {bold ${user}} listed available commands.`);
    }
}));

twitch2ma.onError(exitWithError);

twitch2ma.start()
    .then(() => console.log(chalk.green("Twitch2MA started!")))
    .catch(exitWithError);

function failOnErrorOrReturnValue(value: any, overrideError?: Error) {
    if(_.isError(value)) {
        exitWithError(_.isError(overrideError) ? overrideError : value);
    } else {
        return value;
    }
}

function exitWithError(error: Error) {
    console.error(chalk.bold.redBright(error.message));
    process.exit(1);
}
