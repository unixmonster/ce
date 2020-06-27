
//
// This is the ES6 Map
//
// interface Map<K, V> {
//     clear(): void;
//     delete(key: K): boolean;
//     entries(): IterableIterator<[K, V]>;
//     forEach(callbackfn: (value: V, index: K, map: Map<K, V>) => void, thisArg?: any): void;
//     get(key: K): V;
//     has(key: K): boolean;
//     keys(): IterableIterator<K>;
//     set(key: K, value?: V): Map<K, V>;
//     size: number;
//     values(): IterableIterator<V>;
//     [Symbol.iterator](): IterableIterator<[K, V]>;
//     [Symbol.toStringTag]: string;
// }

// interface MapConstructor {
//     new <K, V>(): Map<K, V>;
//     new <K, V>(iterable: Iterable<[K, V]>): Map<K, V>;
//     prototype: Map<any, any>;
// }
// declare var Map: MapConstructor;


type BasicOption = { key: string, value: string }

class ConfigOption {

    private _array: any;
    private _key: string;
    private _value: any;

    public constructor(key: string, value: any) {
        this._array = [];
        this._key = null;
        this._value = null;

        this.set(key, value);
    }

    public get(): any {
        return this._array;
    }

    public set(key: string, value: any): any {
        this._key = key;
        this._value = value;
        this._array[key] = value;
        return this;
    }
}


export default ConfigOption;
