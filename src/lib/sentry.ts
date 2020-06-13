import Sentry = require("@sentry/node");
import fs = require("fs");

export function init(packageInformation: any) {
    try {
        const sentry = JSON.parse(fs.readFileSync("./sentry.json", {encoding: "utf-8"}));

        if (sentry) {

            const os = require("os");

            Sentry.init({
                dsn: sentry.dsn,
                environment: process.env.NODE_ENV ? process.env.NODE_ENV : "development",
                release: 'twitch2ma@' + packageInformation.version,
                integrations: [
                    new Sentry.Integrations.OnUncaughtException(),
                    new Sentry.Integrations.OnUnhandledRejection()
                ],
                debug: process.env.NODE_ENV === "development"
            });

            Sentry.setContext("os", {
                name: os.platform(),
                version: os.release()
            });

            Sentry.setContext("runtime", {
                name: process.release.name,
                version: process.version
            });

            if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "staging") {
                Sentry.setUser({username: os.userInfo().username});
            }
        }
    } catch (ignored) {
    }
}

export default function sentry(error: Error, messageHandler?: (error: Error) => any) {
    Sentry.captureException(error);
    return Sentry.flush()
        .catch(() => Promise.resolve())
        .then(() => {
            if (messageHandler) {
                messageHandler(error);
            }
        });
}
