import {PermissionCollector, PermissionInstance} from "../PermissionController";
import {RuntimeInformation} from "../RuntimeInformation";

import humanizeDuration = require("humanize-duration");
import _ = require("lodash");

export default class CooldownPermission implements PermissionInstance {

    check(permissionCollector: PermissionCollector,
          runtimeInformation: RuntimeInformation,
          additionalRuntimeInformation: Map<String, any>): void {

        let lastCall = additionalRuntimeInformation.get("lastCall");
        if (_.isInteger(lastCall)) {
            let cooldownTimer = lastCall + runtimeInformation.config.timeout * 1000 - new Date().getTime();
            if (cooldownTimer > 0) {
                let differenceString = humanizeDuration(cooldownTimer + (1000 - cooldownTimer % 1000));
                permissionCollector.denyPermission("cooldown",
                    `@${runtimeInformation.userName}, please wait ${differenceString} and try again!`);
            }
        }
    }

    stop(): void {
    }
}
