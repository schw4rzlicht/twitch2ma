import * as index from "../src/lib/index";

test("Update notification", () => {

    const packageInformation = require("../package.json");
    const higherVersion = require("semver/functions/inc")(packageInformation.version, "major");

    let consoleSpy = jest.spyOn(console, "log");

    index.notifyUpdate({version: higherVersion});

    expect(consoleSpy).toBeCalledWith(
        expect.stringMatching("A new version of \\w+ is available!"));
});
