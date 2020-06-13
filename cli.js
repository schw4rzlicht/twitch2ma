#!/usr/bin/env node

const sentry = require("./dist/lib/sentry");
const packageInformation = require("./package.json");

require("dotenv").config();

if(process.env.NODE_ENV === "production" && !packageInformation.version.match(/^\d+\.\d+.\d+$/)) {
    process.env.NODE_ENV = "staging";
}

sentry.init(packageInformation);

require("./dist/lib/index").main();
