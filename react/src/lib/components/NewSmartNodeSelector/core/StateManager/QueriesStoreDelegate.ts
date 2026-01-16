import type { QueryItem } from "./types";

export class QueriesStoreDelegate {
    private _items: QueryItem[] = [];
    private _queryItemCounter: number = 0;

    constructor() {}

    getItems(): readonly QueryItem[] {
        return this._items;
    }

    getNumItems(): number {
        return this._items.length;
    }

    getFirstItem(): QueryItem | null {
        return this._items[0] ?? null;
    }

    getLastItem(): QueryItem | null {
        return this._items[this._items.length - 1] ?? null;
    }

    getItemById(id: string): QueryItem | null {
        return this._items.find((item) => item.id === id) ?? null;
    }

    getItemByIndex(index: number): QueryItem | null {
        return this._items[index] ?? null;
    }

    getIndexById(id: string): number {
        return this._items.findIndex((item) => item.id === id);
    }

    getNextItem(id: string): QueryItem | null {
        const index = this._items.findIndex((item) => item.id === id);
        if (index === -1 || index === this._items.length - 1) {
            return null;
        }
        return this._items[index + 1] ?? null;
    }

    getPreviousItem(id: string): QueryItem | null {
        const index = this._items.findIndex((item) => item.id === id);
        if (index <= 0) {
            return null;
        }
        return this._items[index - 1] ?? null;
    }

    addItem(query: string): QueryItem {
        const newItem: QueryItem = {
            id: this.makeKey(),
            query,
        };
        this._items = [...this._items, newItem];
        return newItem;
    }

    removeItem(id: string): void {
        this._items = this._items.filter((item) => item.id !== id);
    }

    updateItem(id: string, query: string): void {
        this._items = this._items.map((item) =>
            item.id === id
                ? {
                      ...item,
                      query,
                  }
                : item
        );
    }

    private makeKey(): string {
        return `query-item-${this._queryItemCounter++}`;
    }
}
