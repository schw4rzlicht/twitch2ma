#!/usr/bin/env node

const fs = require("fs");

try {
    const sentry = JSON.parse(fs.readFileSync("./sentry.json"));

    if (sentry) {
        const Sentry = require("@sentry/node");
        const packageInformation = require("./package.json");
        Sentry.init({
            dsn: sentry.dsn,
            release: 'twitch2ma@' + packageInformation.version
        });
    }
} catch(ignored){
}

require("./dist/lib/index").main();
