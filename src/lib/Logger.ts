import chalk = require("chalk");
import Fs = require("fs");

const stripAnsiStream = require("strip-ansi-stream");

export class Logger {

    private logfile: Fs.WriteStream;
    private stripAnsiStream: any;

    setLogfile(logfile: string) {
        this.end();
        this.logfile = Fs.createWriteStream(logfile, {flags: "a"});
        this.stripAnsiStream = stripAnsiStream();
        this.stripAnsiStream.on("data", (data: string) => {
            this.logfile.write(data);
            this.logfile._final(() => {});
        });
    }

    end() {
        if(this.stripAnsiStream) {
            this.stripAnsiStream.end();
        }
        if (this.logfile) {
            this.logfile.end();
        }
    }

    toLogfile(message: string) {
        if (this.stripAnsiStream && this.stripAnsiStream.writable) {
            this.stripAnsiStream.write(message);
        }
    }

    error(message: string) {
        console.error(chalk`❌ {bold.red ${message}}`);
        this.toLogfile(`ERROR: ${message}\n`);
    }

    warning(message: string) {
        console.warn(chalk`⚠️ {yellow ${message}}`);
        this.toLogfile(`WARNING: ${message}\n`);
    }

    confirm(message: string): void {
        console.log(chalk`✅ {green ${message}}`);
        this.toLogfile(`SUCCESS: ${message}\n`);
    }

    socketMessage(message: string) {
        console.log(chalk`{inverse ${message}}`);
        this.toLogfile(`=== ${message} ===\n`);
    }

    channelMessage(channel: string, message: string) {
        console.log(chalk`{bgGreen.black  ${channel} }: ${message}`);
        this.toLogfile(`${channel}: ${message}\n`);
    }
}
