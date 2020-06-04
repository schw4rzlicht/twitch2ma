import {Config, MaConfig, TwitchConfig, Command} from "../lib/Config";

import Fs = require("fs");

test("Constructor", () => {

    let rawConfig = JSON.parse(Fs.readFileSync("config.json.sample", {encoding: "utf-8"}));
    let config = new Config(rawConfig);

    expect(config.timeout).toBe(rawConfig.timeout);

    expect(config.ma).toBeInstanceOf(MaConfig);
    expect(config.ma.host).toBe(rawConfig.ma.host);
    expect(config.ma.user).toBe(rawConfig.ma.user);
    expect(config.ma.password).toBe(rawConfig.ma.password);
    
    expect(config.twitch).toBeInstanceOf(TwitchConfig);
    expect(config.twitch.clientId).toBe(rawConfig.twitch.clientId);
    expect(config.twitch.accessToken).toBe(rawConfig.twitch.accessToken);
    expect(config.twitch.channel).toBe(rawConfig.twitch.channel);

    expect(config.commands).toBeInstanceOf(Array);
    expect(config.commands.length).toBeGreaterThan(0);

    config.commands.forEach((command, index) => {
        
        expect(command).toBeInstanceOf(Command);
        
        expect(command.chatCommand).toBeTruthy();
        expect(command.chatCommand).toBe(rawConfig.commands[index].chatCommand);

        expect(command.consoleCommand).toBe(rawConfig.commands[index].consoleCommand);
        
        expect(command.message).toBe(rawConfig.commands[index].message);
        expect(command.help).toBe(rawConfig.commands[index].help);

        command.parameters.forEach((parameter, pIndex) => {

            expect(parameter.parameter).toBeTruthy();
            expect(parameter.parameter).toBe(rawConfig.commands[index].parameters[pIndex].parameter);

            expect(parameter.consoleCommand).toBeTruthy();
            expect(parameter.consoleCommand).toBe(rawConfig.commands[index].parameters[pIndex].consoleCommand);

            expect(parameter.message).toBe(rawConfig.commands[index].parameters[pIndex].message);
        });
    });
});
