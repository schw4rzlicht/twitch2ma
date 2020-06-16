#!/usr/bin/env node

const sentry = require("./dist/lib/sentry");
const packageInformation = require("./package.json");
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, ".env")
});

if(process.env.NODE_ENV === undefined) {
    process.env.NODE_ENV = "development";
}

sentry.init(packageInformation);

require("./dist/lib/index").main();
