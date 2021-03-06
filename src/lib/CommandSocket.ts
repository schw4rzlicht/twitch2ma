import {EventEmitter} from "@d-fischer/typed-event-emitter";

import ipc = require("node-ipc");

export class SocketError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, SocketError.prototype);
        this.name = SocketError.name;
    }
}

export class CommandSocket extends EventEmitter {

    constructor() {
        super();

        ipc.config.appspace = "twitch2ma.";
        ipc.config.id = "main"
        ipc.config.silent = true;
    }

    start() {
        return this.checkSocketExists()
            .then(() => {
                ipc.serve(() => {

                    ipc.server.on("error", error => {
                        this.emit(this.onError, error);
                    })

                    ipc.server.on("exit", () => {
                        this.emit(this.onExitCommand);
                    });

                    ipc.server.on("reloadConfig", newConfigFile => {
                        this.emit(this.onReloadConfigCommand, newConfigFile);
                    })
                });

                ipc.server.start();
            });
    }

    stop() {
        if(ipc.server && ipc.server.stop) {
            ipc.server.stop();
        }
    }

    checkSocketExists() {
        return new Promise((resolve, reject) => {

            ipc.connectTo("main", () => {

                ipc.of.main.on("connect", () => {
                    ipc.disconnect("main");
                    reject(new SocketError("Socket exists! Is twitch2ma already running?"));
                });

                ipc.of.main.on("error", () => {
                    ipc.disconnect("main");
                    resolve();
                });
            });
        });
    }

    onExitCommand = this.registerEvent<() => any>();
    onReloadConfigCommand = this.registerEvent<(newConfigFile: string) => any>();
    onError = this.registerEvent<(error: Error) => any>();
}
