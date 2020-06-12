#!/usr/bin/env node

const fs = require("fs");

try {
    const sentry = JSON.parse(fs.readFileSync("./sentry.json"));

    if (sentry) {

        const Sentry = require("@sentry/node");
        const os = require("os");
        const packageInformation = require("./package.json");

        Sentry.init({
            dsn: sentry.dsn,
            release: 'twitch2ma@' + packageInformation.version,
            integrations: [
                new Sentry.Integrations.OnUncaughtException(),
                new Sentry.Integrations.OnUnhandledRejection()
            ]
        });

        Sentry.setContext("os", {
            name: os.platform(),
            version: os.release()
        });

        Sentry.setContext("runtime", {
            name: process.release.name,
            version: process.version
        });
    }
} catch(ignored){
}

require("./dist/lib/index").main();
