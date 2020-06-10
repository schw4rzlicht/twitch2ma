import {EventEmitter} from "@d-fischer/typed-event-emitter";

import ipc = require("node-ipc");

export class CommandSocket extends EventEmitter {

    constructor() {
        super();

        ipc.config.appspace = "twitch2ma.";
        ipc.config.id = "main"
        ipc.config.silent = true;

        ipc.serve(() => {

            ipc.server.on("exit", (data, socket) => {
                this.emit(this.onExitCommand);
            });
        });

        ipc.server.start();
    }

    onExitCommand = this.registerEvent<() => any>();
}
