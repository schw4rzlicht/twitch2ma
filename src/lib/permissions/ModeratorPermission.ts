import {PermissionCollector, PermissionInstance} from "../PermissionController";
import {RuntimeInformation} from "../RuntimeInformation";

export default class ModeratorPermission implements PermissionInstance {

    check(permissionCollector: PermissionCollector, runtimeInformation: RuntimeInformation): void {
        if (runtimeInformation.rawMessage.userInfo.isMod) {
            permissionCollector.enableGodMode("user is moderator");
        }
    }

    stop(): void {
    }
}
