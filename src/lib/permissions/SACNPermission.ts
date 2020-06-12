import {PermissionCollector, PermissionInstance} from "../PermissionController";
import {RuntimeInformation} from "../RuntimeInformation";
import {Config} from "../Config";
import {Receiver, Packet} from "sacn";

import _ = require("lodash");

export default class SACNPermission implements PermissionInstance {

    private readonly universeData: Map<number, Array<number>>;
    private readonly sACNReceiver: Receiver;

    constructor(config: Config) {
        this.universeData = new Map();

        for (const command of config.commands) {
            if (command.sacn) {
                this.universeData.set(command.sacn.universe, null);
            }
            for (const parameter of command.parameters) {
                if (parameter.sacn) {
                    this.universeData.set(parameter.sacn.universe, null);
                }
            }
        }

        if (this.universeData.size > 0) {

            let receiverOptions = {
                universes: Array.from(this.universeData.keys()),
                reuseAddr: true
            };

            if(_.isString(config.sacn.interface)) {
                _.set(receiverOptions, "iface", config.sacn.interface);
            }

            this.sACNReceiver = new Receiver(receiverOptions);

            this.sACNReceiver.on("packet", (packet: Packet) => {

                let data = new Array(512).fill(0);
                packet.slotsData.forEach((value, channel) => {
                    data[channel] = value;
                });

                this.universeData.set(packet.universe, data);
            });
        }
    }

    check(permissionCollector: PermissionCollector,
          runtimeInformation: RuntimeInformation,
          additionalRuntimeInformation: Map<String, any>): void {

        if(runtimeInformation.instructions) {

            let sacn = runtimeInformation.instructions.sacn;

            if (sacn) {
                let universeData = this.universeData.get(sacn.universe);
                if (_.isInteger(universeData[sacn.channel - 1]) && universeData[sacn.channel - 1] < 255) {
                    permissionCollector.denyPermission("sacn",
                        `@${runtimeInformation.userName}, ${runtimeInformation.config.sacn.lockMessage}`);
                }
            }
        }
    }

    stop(): void {
        if (this.sACNReceiver) {
            try {
                this.sACNReceiver.close();
            } catch (ignored) {
            }
        }
    }
}
