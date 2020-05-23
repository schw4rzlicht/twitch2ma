import Twitch2Ma from "./Twitch2Ma";
import Fs from "fs";

if(process.argv[2] === null || process.argv[2] === undefined) {
    exitWithError("No config file specified!");
}

let jsonObject;
try {
    jsonObject = Fs.readFileSync(process.argv[2], {encoding: "utf-8"});
} catch (ignored) {
    exitWithError(`Cannot read config file ${process.argv[2]}!`);
}

const twitch2ma = new Twitch2Ma(JSON.parse(jsonObject));

twitch2ma.onCommandExecuted((channel, user, chatCommand, consoleCommand) =>
    console.log(`${channel}: User ${user} executed !${chatCommand} ("${consoleCommand}") on the desk.`));
twitch2ma.onError(console.error);
twitch2ma.start()
    .catch(exitWithError);

console.log("Twitch2MA started!");

function exitWithError(message: string) {
    console.error(message);
    process.exit(1);
}
