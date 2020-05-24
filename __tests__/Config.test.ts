import Twitch2Ma from "../lib/Twitch2Ma";
import {Config} from "../lib/Config";
import Fs from "fs";

jest.mock("telnet-client");

let config = new Config(JSON.parse(Fs.readFileSync("config.json.sample", {encoding: "utf-8"})));

test("Test connection", () => {

    let twitch2Ma = new Twitch2Ma(config);
    let spyOnTelnetLogin = jest.spyOn(twitch2Ma, "telnetLogin");

    expect(twitch2Ma.start()).resolves.toBeTruthy();

    // expect(twitch2Ma["telnet"].connect).toBeCalled();
    expect(spyOnTelnetLogin).toBeCalled();
    // expect(twitch2Ma.initTwitch).toBeCalled();
    //
    // expect(twitch2Ma.onError).not.toBeCalled();
});
