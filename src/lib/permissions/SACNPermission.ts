import {PermissionCollector, PermissionInstance} from "../PermissionController";
import {RuntimeInformation} from "../RuntimeInformation";
import {Config} from "../Config";
import {Receiver, Packet} from "sacn";
import {EventEmitter} from "@d-fischer/typed-event-emitter";

import _ = require("lodash");
import {EventBinder} from "@d-fischer/typed-event-emitter/lib/EventEmitter";

export default class SACNPermission extends EventEmitter implements PermissionInstance {

    private readonly watchUniverses: Array<number>;
    private readonly universeData: Map<number, Array<number>>;
    private readonly lastData: Map<number, number>;
    private readonly config: Config;
    private sACNReceiver: Receiver;
    private status: SACNStatus;

    constructor(config: Config) {
        super();

        this.universeData = new Map();
        this.lastData = new Map();
        this.config = config;

        for (const command of this.config.commands) {
            if (command.sacn) {
                this.universeData.set(command.sacn.universe, null);
                this.lastData.set(command.sacn.universe, 0);
            }
            for (const parameter of command.parameters) {
                if (parameter.sacn) {
                    this.universeData.set(parameter.sacn.universe, null);
                    this.lastData.set(parameter.sacn.universe, 0);
                }
            }
        }

        this.universeData.size > 0 ? this.watchUniverses = Array.from(this.universeData.keys()) : [];
    }

    check(permissionCollector: PermissionCollector,
          runtimeInformation: RuntimeInformation,
          additionalRuntimeInformation: Map<String, any>): void {

        if (this.status instanceof SACNReceiving && runtimeInformation.instructions) {

            let sacn = runtimeInformation.instructions.sacn;

            if (sacn) {
                let universeData = this.universeData.get(sacn.universe);
                if (universeData && _.isInteger(universeData[sacn.channel - 1]) && universeData[sacn.channel - 1] < 255) {
                    permissionCollector.denyPermission("sacn",
                        `@${runtimeInformation.userName}, ${runtimeInformation.config.sacn.lockMessage}`);
                }
            }
        }
    }

    start(): void {

        if (this.watchUniverses.length > 0) {

            let receiverOptions = {
                universes: this.watchUniverses,
                reuseAddr: true
            };

            if (this.config.sacn && _.isString(this.config.sacn.interface)) {
                _.set(receiverOptions, "iface", this.config.sacn.interface);
            }

            // FIXME Throws when interface does not exist, see https://github.com/k-yle/sACN/issues/19
            this.sACNReceiver = new Receiver(receiverOptions);

            this.sACNReceiver.on("packet", (packet: Packet) => {

                if(_.includes(this.watchUniverses, packet.universe)) {
                    let data = new Array(512).fill(0);
                    packet.slotsData.forEach((value, channel) => {
                        data[channel] = value;
                    });

                    this.universeData.set(packet.universe, data);
                    this.lastData.set(packet.universe, new Date().getTime());
                }
            });

            setTimeout(this.watchdog, this.config.sacn.timeout);
            this.setStatus(new SACNWaiting(this.watchUniverses));
        }
    }

    stop(): void {
        if (this.sACNReceiver) {
            try {
                this.sACNReceiver.close();
            } catch (ignored) {
                // TODO sentry
            }
        }
        this.setStatus(new SACNStopped());
    }

    private watchdog() {

        /************************
        ** TODO status changes **
        ************************/

        setTimeout(this.watchdog, this.config.sacn.timeout);
    }

    private setStatus(status: SACNStatus) {
        this.status = status;
        this.emit(this.onStatus, status);
    }

    protected emit<Args extends any[]>(event: EventBinder<Args>, ...args: Args) {
        try {
            super.emit(event, ...args);
        } catch (error) {
            console.error(error); // TODO sentry
        }
    }

    onStatus = this.registerEvent<(status: SACNStatus) => any>();
}

export interface SACNStatus {
}

export class SACNWaiting implements SACNStatus {

    readonly universes: Array<number>;

    constructor(universes: Array<number>) {
        this.universes = universes;
    }
}

export class SACNReceiving implements SACNStatus {
}

export class SACNLost implements SACNStatus {
}

export class SACNStopped implements SACNStatus {
}
