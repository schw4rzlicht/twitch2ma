import Twitch2Ma from "./Twitch2Ma";
import {Config} from "./Config";

import Ajv = require("ajv");
import configSchema = require("../resources/config.schema.json");
import Fs = require("fs");
import _ = require("lodash");

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
    console.log(`${channel}: User ${user} executed !${chatCommand} ("${consoleCommand}") on the desk.`));

twitch2ma.onHelpExecuted(((channel, user, helpCommand) => {
    if(_.isString(helpCommand)) {
        console.log(`${channel}: User ${user} got help for !${helpCommand}.`);
    } else {
        console.log(`${channel}: User ${user} listed available commands.`);
    }
}));

twitch2ma.onError(exitWithError);

twitch2ma.start()
    .then(() => console.log("Twitch2MA started!"))
    .catch(exitWithError);

function failOnErrorOrReturnValue(value: any, overrideError?: Error) {
    if(_.isError(value)) {
        exitWithError(_.isError(overrideError) ? overrideError : value);
    } else {
        return value;
    }
}

function exitWithError(error: Error) {
    console.error(error.message);
    process.exit(1);
}
