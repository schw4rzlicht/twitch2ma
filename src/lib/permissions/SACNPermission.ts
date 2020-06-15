import {PermissionCollector, PermissionInstance} from "../PermissionController";
import {RuntimeInformation} from "../RuntimeInformation";
import {Config} from "../Config";
import {Packet, Receiver} from "sacn";
import {EventEmitter} from "@d-fischer/typed-event-emitter";
import {EventBinder} from "@d-fischer/typed-event-emitter/lib/EventEmitter";
import {SACNUniverse, UniverseStatus} from "./SACNUniverse";
import sentry from "../sentry";

import _ = require("lodash");

export default class SACNPermission extends EventEmitter implements PermissionInstance {

    private readonly universes: Array<SACNUniverse>;
    private readonly config: Config;
    private sACNReceiver: Receiver;
    private watchdogTimeout: NodeJS.Timeout;
    private running: boolean;

    constructor(config: Config) {
        super();

        this.universes = [];
        this.config = config;
        this.running = false;

        for (const command of this.config.commands) {
            if (command.sacn) {
                this.universes[command.sacn.universe] = new SACNUniverse(command.sacn.universe);
            }
            for (const parameter of command.parameters) {
                if (parameter.sacn) {
                    this.universes[parameter.sacn.universe] = new SACNUniverse(parameter.sacn.universe);
                }
            }
        }
    }

    check(permissionCollector: PermissionCollector,
          runtimeInformation: RuntimeInformation,
          additionalRuntimeInformation: Map<String, any>): void {

        if (runtimeInformation.instructions) {

            let sacn = runtimeInformation.instructions.sacn;

            if (sacn) {
                let universe = this.universes[sacn.universe];
                if (universe && (universe.status !== UniverseStatus.Valid || universe.data[sacn.channel - 1] < 255)) {
                    permissionCollector.denyPermission("sacn",
                        `@${runtimeInformation.userName}, ${runtimeInformation.config.sacn.lockMessage}`);
                }
            }
        }
    }

    start(): void {

        if (this.universes.length > 0 && !this.running) {

            let universes = [];
            for (const universe of this.universes) {
                if (universe) {
                    universes.push(universe.universe);
                }
            }

            if (universes.length > 0) {

                let receiverOptions = {
                    universes: universes,
                    reuseAddr: true
                };

                if (this.config.sacn && _.isString(this.config.sacn.interface)) {
                    _.set(receiverOptions, "iface", this.config.sacn.interface);
                }

                this.sACNReceiver = new Receiver(receiverOptions);

                this.sACNReceiver.on("packet", (packet: Packet) => {

                    let universe = this.universes[packet.universe];

                    if (universe) {
                        let data = new Array(512).fill(0);
                        packet.slotsData.forEach((value, channel) => {
                            data[channel] = value;
                        });

                        universe.data = data;
                    }
                });

                this.sACNReceiver.on("PacketCorruption", error => {
                    this.emit(this.onError, new SACNCorruptError());
                    this.stop();
                    sentry(error);
                });

                this.sACNReceiver.on("error", (error: Error) => {
                    // @ts-ignore
                    if(error.code) {
                        // @ts-ignore
                        switch (error.code) {
                            case "EADDRNOTAVAIL":
                            case "ENODEV":
                                this.emit(this.onError, new SACNError(`sACN error: Have you configured the right interface IP?`));
                                break;
                            case "ERR_SOCKET_DGRAM_NOT_RUNNING":
                                this.emit(this.onError, new SACNError("sACN error: UDP subsystem not running!"));
                                break;
                            default:
                                this.emit(this.onError, error);
                                break;
                        }
                    } else {
                        this.emit(this.onError, error);
                    }
                    this.stop();
                });

                this.emit(this.onStatus, new SACNWaiting(universes));

                this.watchdogTimeout = setInterval(() => this.watchdog(), this.config.sacn.timeout);
                this.watchdogTimeout.unref();

                this.running = true;
            }
        }
    }

    stop(): void {
        if (this.sACNReceiver && this.running) {
            try {
                this.sACNReceiver.close();
            } catch (error) {
                sentry(error);
            }
            this.running = false;
            this.emit(this.onStatus, new SACNStopped());
        }
        _.attempt(() => clearInterval(this.watchdogTimeout));
    }

    private watchdog() {

        let lastValidTime = new Date().getTime() - this.config.sacn.timeout * 1000;

        let receiving = [];
        let lost = [];

        for (const universe of this.universes) {

            if (!universe) {
                continue;
            }

            if (lastValidTime <= universe.lastReceived &&
                (universe.watchdogStatus == UniverseStatus.NeverReceived || universe.watchdogStatus == UniverseStatus.Expired)) {

                receiving.push(universe.universe);
                universe.watchdogStatus = UniverseStatus.Valid;
            }

            if (lastValidTime > universe.lastReceived && universe.status == UniverseStatus.Valid) {
                lost.push(universe.universe);
                universe.watchdogStatus = UniverseStatus.Expired;
            }
        }

        if (receiving.length > 0) {
            this.emit(this.onStatus, new SACNReceiving(receiving));
        }

        if (lost.length > 0) {
            this.emit(this.onStatus, new SACNLost(lost));
        }
    }

    withOnStatusHandler(handler: (status: SACNStatus) => any) {
        this.onStatus(handler);
        return this;
    }

    withOnErrorHandler(handler: (error: Error) => any) {
        this.onError(handler);
        return this;
    }

    protected emit<Args extends any[]>(event: EventBinder<Args>, ...args: Args) {
        try {
            super.emit(event, ...args);
        } catch (error) {
            sentry(error);
        }
    }

    onStatus = this.registerEvent<(status: SACNStatus) => any>();
    onError = this.registerEvent<(error: SACNError) => any>();
}

export class SACNStatus {

    readonly universes: Array<number>;

    constructor(universes: Array<number>) {
        this.universes = universes;
    }
}

export class SACNWaiting extends SACNStatus {
}

export class SACNReceiving extends SACNStatus {
}

export class SACNLost extends SACNStatus {
}

export class SACNStopped extends SACNStatus {
    constructor() {
        super(null);
    }
}

export class SACNError extends Error {

    constructor(message?: string) {
        super(message);

        Object.setPrototypeOf(this, SACNError.prototype);
        this.name = SACNError.name;
    }
}

export class SACNCorruptError extends SACNError {
    constructor() {
        super("sACN error: Unexpected packet received. Are you using the \"final\" " +
            "protocol version in your MA sACN settings?");

        Object.setPrototypeOf(this, SACNCorruptError.prototype);
        this.name = SACNCorruptError.name;
    }
}
