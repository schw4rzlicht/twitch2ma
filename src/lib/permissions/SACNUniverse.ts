export enum UniverseStatus {
    NeverReceived,
    Valid,
    Expired
}

export class SACNUniverse {

    readonly universe: number;
    private _data: Array<number>;
    private _lastReceived: number;
    status: UniverseStatus;

    constructor(universe: number) {
        this.universe = universe;
        this._data = new Array<number>(512).fill(0);
        this._lastReceived = 0;
        this.status = UniverseStatus.NeverReceived;
    }

    get data(): Array<number> {
        return this._data;
    }

    set data(value: Array<number>) {
        this._data = value;
        this._lastReceived = new Date().getTime();
    }

    get lastReceived(): number {
        return this._lastReceived;
    }
}
