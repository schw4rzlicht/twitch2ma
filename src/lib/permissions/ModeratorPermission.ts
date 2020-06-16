import {PermissionCollector, PermissionInstance} from "../PermissionController";
import {RuntimeInformation} from "../RuntimeInformation";
import {Config} from "../Config";

export default class ModeratorPermission implements PermissionInstance {

    check(permissionCollector: PermissionCollector, runtimeInformation: RuntimeInformation): void {
        if (runtimeInformation.rawMessage.userInfo.isMod) {
            permissionCollector.enableGodMode("user is moderator");
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
