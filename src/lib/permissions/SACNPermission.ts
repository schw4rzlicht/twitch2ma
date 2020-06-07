import {PermissionCollector, PermissionInstance} from "../PermissionController";
import {RuntimeInformation} from "../RuntimeInformation";
import {Config} from "../Config";
import {Receiver, Packet} from "sacn";

export default class SACNPermission implements PermissionInstance {

    private readonly universeData: Map<number, Array<number>>;

    constructor(config: Config) {
        this.universeData = new Map();

        for (const command of config.commands) {
            if(command.sacn) {
                this.universeData.set(command.sacn.universe, null);
            }
            for (const parameter of command.parameters) {
                if(parameter.sacn) {
                    this.universeData.set(parameter.sacn.universe, null);
                }
            }
        }

        if(this.universeData.size > 0) {
            let receiver = new Receiver({
                universes: Array.from(this.universeData.keys()),
                reuseAddr: true
            });

            receiver.on("packet", (packet: Packet) => {
                let i = 0;
                // this.universeData.set(packet.universe, packet.slotsData)
            });
        }
    }

    check(permissionCollector: PermissionCollector,
          runtimeInformation: RuntimeInformation,
          additionalRuntimeInformation: Map<String, any>): void {

        let sacn = runtimeInformation.instructions.sacn;

        if(sacn) {
            let universeData = this.universeData.get(sacn.universe);
            // if(universeData && universeData[sacn.channel] < 100) {
            if(true) {
                permissionCollector.denyPermission("sacn",
                    `@${runtimeInformation.userName}, ${runtimeInformation.config.lockMessage}`);
            }
        }
    }
}
