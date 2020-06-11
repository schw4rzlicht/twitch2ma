import {EventEmitter} from "@d-fischer/typed-event-emitter";

import ipc = require("node-ipc");

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
                    reject(new Error("Socket exists! Is twitch2ma already running?"));
                });

                ipc.of.main.on("error", () => {
                    ipc.disconnect("main");
                    resolve();
                });
            });
        });
    }

    onExitCommand = this.registerEvent<() => any>();
    onError = this.registerEvent<(error: Error) => any>();
}
