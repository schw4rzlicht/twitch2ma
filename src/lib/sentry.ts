import Sentry = require("@sentry/node");

export function init(packageInformation: any) {
    try {
        const sentry = require("../../sentry.json");

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
    } catch (ignored) {
    }
}

export default function sentry(error: Error, messageHandler?: (error: Error) => any) {
    Sentry.captureException(error);
    return flushSentry()
        .then(() => {
            if (messageHandler) {
                messageHandler(error);
            }
        });
}

export function sentryMessage(message: string, severity?: Sentry.Severity) {
    Sentry.captureMessage(message, severity);
    return flushSentry();
}

function flushSentry() {
    return Sentry.flush().catch(() => Promise.resolve());
}
