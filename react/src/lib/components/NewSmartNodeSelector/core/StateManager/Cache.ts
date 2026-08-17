export class Cache<TItem> {
    private _cache: Map<string, TItem> = new Map();
    private _maxSize: number;

    constructor(maxSize: number = 100) {
        this._maxSize = maxSize;
    }

    getItem(key: string): TItem | null {
        const item = this._cache.get(key);
        if (!item) {
            return null;
        }

        // LRU
        this._cache.delete(key);
        this._cache.set(key, item);

        return item;
    }

    setItem(key: string, item: TItem): void {
        // If item already exists, delete it to update its position
        if (this._cache.has(key)) {
            this._cache.delete(key);
        }

        this._cache.set(key, item);

        // LRU eviction
        while (this._cache.size > this._maxSize) {
            const oldestKey = this._cache.keys().next().value;
            if (oldestKey === undefined) {
                break;
            }
            this._cache.delete(oldestKey);
        }
    }

    clear(): void {
        this._cache.clear();
    }
}
