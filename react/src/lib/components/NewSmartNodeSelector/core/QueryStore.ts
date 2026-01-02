import { PubSubDelegate, type PubSub } from "./PubSubDelegate";

export type QueryItem = {
    id: string;
    query: string;
};

export enum QueryStoreTopic {
    QUERY_ITEMS = "queryItems",
}

export type QueryStoreTopicPayloads = {
    [QueryStoreTopic.QUERY_ITEMS]: QueryItem[];
};

export class QueryStore {
    private _queryItems: QueryItem[] = [];
    private _queryItemCounter: number = 0;

    getItems(): QueryItem[] {
        return this._queryItems;
    }

    getFirstItem(): QueryItem | null {
        return this._queryItems[0] ?? null;
    }

    getLastItem(): QueryItem | null {
        return this._queryItems[this._queryItems.length - 1] ?? null;
    }

    getItemById(id: string): QueryItem | null {
        return this._queryItems.find((item) => item.id === id) ?? null;
    }

    addItem(query: string): QueryItem {
        const newItem: QueryItem = {
            id: `query-item-${this._queryItemCounter++}`,
            query,
        };
        this._queryItems = [...this._queryItems, newItem];
        return newItem;
    }

    removeItem(id: string): void {
        this._queryItems = this._queryItems.filter((item) => item.id !== id);
    }

    updateItem(id: string, newQuery: string): void {
        this._queryItems = this._queryItems.map((item) =>
            item.id === id ? { ...item, query: newQuery } : item
        );
    }
}
