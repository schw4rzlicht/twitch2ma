export enum UniverseStatus {
    NeverReceived,
    Valid,
    Expired
}

export class SACNUniverse {

    readonly universe: number;
    private _data: Array<number>;
    private _lastReceived: number;
    private _watchdogStatus: UniverseStatus;
    private _status: UniverseStatus;

    constructor(universe: number) {
        this.universe = universe;
        this._data = new Array<number>(512).fill(0);
        this._lastReceived = 0;
        this.watchdogStatus = UniverseStatus.NeverReceived;
    }

    get data(): Array<number> {
        return this._data;
    }

    set data(value: Array<number>) {
        this._data = value;
        this._lastReceived = new Date().getTime();
        this._status = UniverseStatus.Valid;
    }

    get lastReceived(): number {
        return this._lastReceived;
    }

    get watchdogStatus(): UniverseStatus {
        return this._watchdogStatus;
    }

    set watchdogStatus(value: UniverseStatus) {
        this._watchdogStatus = value;
        this._status = value;
    }

    get status(): UniverseStatus {
        return this._status;
    }
}
