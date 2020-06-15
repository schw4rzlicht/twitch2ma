import chalk = require("chalk");
import Fs = require("fs");

const stripAnsi = require("strip-ansi");

export class Logger {

    private logfile: Fs.WriteStream;

    setLogfile(logfile: string) {
        this.end();
        this.logfile = Fs.createWriteStream(logfile, {flags: "a"});
    }

    end() {
        if(this.logfile) {
            this.logfile.end();
        }
    }

    toLogfile(message: string) {
        if (this.logfile) {
            this.logfile.write(stripAnsi(`${new Date().toISOString()} ${message}\n`));
        }
    }

    error(message: string) {
        console.error(chalk`❌ {bold.red ${message}}`);
        this.toLogfile(`ERROR: ${message}`);
    }

    warning(message: string) {
        console.warn(chalk`⚠️ {yellow ${message}}`);
        this.toLogfile(`WARNING: ${message}`);
    }

    notice(message: string) {
        console.log(chalk`ℹ️ {blue ${message}}`);
        this.toLogfile(`NOTICE: ${message}`);
    }

    confirm(message: string) {
        console.log(chalk`✅ {green ${message}}`);
        this.toLogfile(`SUCCESS: ${message}`);
    }

    socketMessage(message: string) {
        console.log(chalk`{inverse ${message}}`);
        this.toLogfile(`=== ${message} ===`);
    }

    channelMessage(channel: string, message: string) {
        console.log(chalk`{bgGreen.black  ${channel} }: ${message}`);
        this.toLogfile(`${channel}: ${message}`);
    }
}
