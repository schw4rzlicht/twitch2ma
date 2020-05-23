import Twitch2Ma from "./Twitch2Ma";
import Fs from "fs";

if(process.argv[2] === null || process.argv[2] === undefined) {
    exitWithError(new Error("No config file specified!"));
}

let jsonObject;
try {
    jsonObject = Fs.readFileSync(process.argv[2], {encoding: "utf-8"});
} catch (ignored) {
    exitWithError(new Error(`Cannot read config file ${process.argv[2]}!`));
}

const twitch2ma = new Twitch2Ma(JSON.parse(jsonObject));

twitch2ma.onCommandExecuted((channel, user, chatCommand, consoleCommand) =>
    console.log(`${channel}: User ${user} executed !${chatCommand} ("${consoleCommand}") on the desk.`));
twitch2ma.onError(exitWithError);

twitch2ma.start()
    .then(() => console.log("Twitch2MA started!"))
    .catch(exitWithError);

function exitWithError(error: Error) {
    console.error(error.message);
    process.exit(1);
}
