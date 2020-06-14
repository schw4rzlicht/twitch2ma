import {RuntimeInformation} from "./RuntimeInformation";

export interface PermissionInstance {

    check(permissionCollector: PermissionCollector,
          runtimeInformation: RuntimeInformation,
          additionalRuntimeInformation: Map<String, any>): void;

    start(): void;
    stop(): void;
}

export class PermissionError extends Error {

    readonly permissionCollector: PermissionCollector;

    constructor(permissionCollector: PermissionCollector) {
        super();
        this.permissionCollector = permissionCollector;
        Object.setPrototypeOf(this, PermissionError.prototype);
        this.name = PermissionError.name;
    }
}

export class Reason {
    public readonly name: string;
    public readonly viewerMessage: string;

    constructor(name: string, viewerMessage: string) {
        this.name = name;
        this.viewerMessage = viewerMessage;
    }
}

export class PermissionController {

    private readonly permissionInstances: Array<PermissionInstance>;
    private readonly additionalRuntimeInformation: Map<String, any>;

    constructor() {
        this.permissionInstances = [];
        this.additionalRuntimeInformation = new Map();
    }

    withPermissionInstance(instance: PermissionInstance): PermissionController {
        this.permissionInstances.push(instance);
        return this;
    }

    async checkPermissions(runtimeInformation: RuntimeInformation) {

        let permissionCollector = new PermissionCollector();
        for (const permissionInstance of this.permissionInstances) {
            permissionInstance.check(permissionCollector, runtimeInformation, this.additionalRuntimeInformation);
        }

        if (permissionCollector.permissionDenied) {
            throw new PermissionError(permissionCollector);
        }

        return permissionCollector;
    }

    setAdditionalRuntimeInformation(name: string, value: any) {
        this.additionalRuntimeInformation.set(name, value);
    }

    start() {
        for (const permissionInstance of this.permissionInstances) {
            permissionInstance.start();
        }
        return this;
    }

    stop() {
        for (const permissionInstance of this.permissionInstances) {
            permissionInstance.stop();
        }
    }
}

export class PermissionCollector {

    private _permissionDenied: boolean;
    private _godMode: boolean;

    private readonly _godModeReasons: Array<String>;
    private readonly _permissionDeniedReasons: Array<Reason>;

    constructor() {
        this._permissionDenied = false;
        this._godMode = false;
        this._godModeReasons = [];
        this._permissionDeniedReasons = [];
    }

    denyPermission(reason: string, message: string) {
        this._permissionDenied = !this._godMode;
        this._permissionDeniedReasons.push(new Reason(reason, message));
    }

    enableGodMode(reason: string) {
        this._permissionDenied = false;
        this._godMode = true;
        this._godModeReasons.push(reason);
    }

    get permissionDenied(): boolean {
        return this._permissionDenied;
    }

    get permissionDeniedReasons(): Array<Reason> {
        return this._permissionDeniedReasons;
    }

    get godMode(): boolean {
        return this._godMode;
    }

    get godModeReasons(): Array<String> {
        return this._godModeReasons;
    }
}
