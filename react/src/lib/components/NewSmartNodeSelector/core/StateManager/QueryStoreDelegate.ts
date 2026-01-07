import { parseQuery } from "../query-language/parse";
import type { QueryItem } from "./types";

export enum QueryStoreTopic {
    QUERY_ITEMS = "queryItems",
}

export type QueryStoreTopicPayloads = {
    [QueryStoreTopic.QUERY_ITEMS]: QueryItem[];
};

export class QueryStoreDelegate {
    private _queryItems: QueryItem[] = [];
    private _queryItemCounter: number = 0;
    private _delimiter: string;

    constructor(delimiter: string) {
        this._delimiter = delimiter;
    }

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

    getNextItem(id: string): QueryItem | null {
        const index = this._queryItems.findIndex((item) => item.id === id);
        if (index === -1 || index === this._queryItems.length - 1) {
            return null;
        }
        return this._queryItems[index + 1] ?? null;
    }

    getPreviousItem(id: string): QueryItem | null {
        const index = this._queryItems.findIndex((item) => item.id === id);
        if (index <= 0) {
            return null;
        }
        return this._queryItems[index - 1] ?? null;
    }

    addItem(query: string): QueryItem {
        const newItem: QueryItem = {
            id: `query-item-${this._queryItemCounter++}`,
            query,
            parsedQuery: parseQuery(query, { delimiter: this._delimiter }),
        };
        this._queryItems = [...this._queryItems, newItem];
        return newItem;
    }

    removeItem(id: string): void {
        this._queryItems = this._queryItems.filter((item) => item.id !== id);
    }

    updateItem(id: string, newQuery: string): void {
        this._queryItems = this._queryItems.map((item) =>
            item.id === id
                ? {
                      ...item,
                      query: newQuery,
                      parsedQuery: parseQuery(newQuery, {
                          delimiter: this._delimiter,
                      }),
                  }
                : item
        );
    }
}
