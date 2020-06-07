import {PermissionCollector, PermissionController, PermissionInstance} from "../PermissionController";
import {RuntimeInformation} from "../RuntimeInformation";

export default class OwnerPermission implements PermissionInstance {

    check(permissionCollector: PermissionCollector, runtimeInformation: RuntimeInformation): void {
        if (runtimeInformation.rawMessage.userInfo.userName === runtimeInformation.config.twitch.channel.toLowerCase()) {
            permissionCollector.enableGodMode("user is channel owner");
        }
    }

    stop(): void {
    }
}
