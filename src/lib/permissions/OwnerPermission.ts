import {PermissionCollector, PermissionInstance} from "../PermissionController";
import {RuntimeInformation} from "../RuntimeInformation";
import {Config} from "../Config";

export default class OwnerPermission implements PermissionInstance {

    check(permissionCollector: PermissionCollector, runtimeInformation: RuntimeInformation): void {
        if (runtimeInformation.rawMessage.userInfo.userName === runtimeInformation.config.twitch.channel.toLowerCase()) {
            permissionCollector.enableGodMode("user is channel owner");
        }
    }

    start(): Promise<void> {
        return Promise.resolve();
    }

    stop(): Promise<any> {
        return Promise.resolve();
    }

    reloadConfig(config: Config): Promise<void> {
        return Promise.resolve();
    }
}
