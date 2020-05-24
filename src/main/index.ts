import Twitch2Ma from "./Twitch2Ma";
import Fs from "fs";
import Ajv from "ajv";
import configSchema from "../resources/config.schema.json";

if(process.argv[2] === null || process.argv[2] === undefined) {
    exitWithError(new Error("No config file specified!"));
}

let jsonObject;
try {
    jsonObject = JSON.parse(Fs.readFileSync(process.argv[2], {encoding: "utf-8"}));
} catch (ignored) {
    exitWithError(new Error(`Cannot read config file ${process.argv[2]}!`));
}

let ajv = new Ajv({
    allErrors: true,
    useDefaults: true
});

ajv.validate(configSchema, jsonObject);

if(ajv.errors !== null) {
    exitWithError(new Error("Config file is invalid: " + ajv.errorsText()));
}

const twitch2ma = new Twitch2Ma(jsonObject);

twitch2ma.onCommandExecuted((channel, user, chatCommand, consoleCommand) =>
    console.log(`${channel}: User ${user} executed !${chatCommand} ("${consoleCommand}") on the desk.`));

twitch2ma.onHelpExecuted(((channel, user, helpCommand) => {
    if(helpCommand === undefined) {
        console.log(`${channel}: User ${user} listed available commands.`);
    } else {
        console.log(`${channel}: User ${user} got help for !${helpCommand}.`);
    }
}));

twitch2ma.onError(exitWithError);

twitch2ma.start()
    .then(() => console.log("Twitch2MA started!"))
    .catch(exitWithError);

function exitWithError(error: Error) {
    console.error(error.message);
    process.exit(1);
}
