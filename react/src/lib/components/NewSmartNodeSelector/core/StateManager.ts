import { useSyncExternalStore } from "react";

export type QueryItem = {
    id: string;
    query: string;
};

export type CaretPosition = {
    queryId: string;
    offset: number;
};

export enum Topic {
    HAS_FOCUS = "hasFocus",
    QUERY_ITEMS = "queryItems",
    CARET_POSITIONS = "caretPositions",
    SUGGESTIONS_INDEX = "suggestionsIndex",
    FOCUSED_SEGMENT = "focusedSegment",
}

export type TopicPayloads = {
    [Topic.HAS_FOCUS]: boolean;
    [Topic.QUERY_ITEMS]: QueryItem[];
    [Topic.CARET_POSITIONS]: CaretPosition[];
    [Topic.SUGGESTIONS_INDEX]: number | null;
    [Topic.FOCUSED_SEGMENT]: string | null;
};

export type StateManagerOptions = {
    delimiter: string;
};

export class StateManager {
    // Internal
    private _subscribers: Map<Topic, Set<() => void>> = new Map();
    private _queryItemCounter: number = 0;

    // Settings
    private _delimiter: string;

    // State
    private _queryItems: QueryItem[] = [];
    private _caretPositions: CaretPosition[] = [];
    private _suggestionsIndex: number | null = null;

    constructor(options: StateManagerOptions) {
        this._delimiter = options.delimiter;
    }

    getQueryItems(): QueryItem[] {
        return this._queryItems;
    }

    getQueryItemById(id: string): QueryItem | null {
        return this._queryItems.find((item) => item.id === id) ?? null;
    }

    subscribe(topic: Topic, callback: () => void): () => void {
        const subscribers = this._subscribers.get(topic) ?? new Set();
        subscribers.add(callback);
        this._subscribers.set(topic, subscribers);

        return () => {
            subscribers.delete(callback);
        };
    }

    makeSubscriberFunction(
        topic: Topic
    ): (onStoreChangeCallback: () => void) => () => void {
        return (onStoreChangeCallback: () => void) => {
            return this.subscribe(topic, onStoreChangeCallback);
        };
    }

    notifySubscribers(topic: Topic): void {
        const subscribers = this._subscribers.get(topic);
        if (subscribers) {
            subscribers.forEach((callback) => callback());
        }
    }

    makeSnapshotGetter<T extends keyof TopicPayloads>(
        topic: T
    ): () => TopicPayloads[T] {
        switch (topic) {
            case Topic.QUERY_ITEMS:
                return () => this._queryItems as TopicPayloads[T];
            case Topic.CARET_POSITIONS:
                return () => this._caretPositions as TopicPayloads[T];
            case Topic.SUGGESTIONS_INDEX:
                return () => this._suggestionsIndex as TopicPayloads[T];
            case Topic.FOCUSED_SEGMENT:
                return () => null as TopicPayloads[T];
            case Topic.HAS_FOCUS:
                return () =>
                    (this._caretPositions.length > 0) as TopicPayloads[T];
        }
    }

    processInput(value: string): void {
        this.insertTextAtCaret(value);
    }

    processFocusChange(hasFocus: boolean): void {
        if (hasFocus) {
            this.setCaretPositionToEnd();
        } else {
            this.clearCaretPositions();
        }
    }

    processKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
        const { key, shiftKey: selecting } = event;

        switch (key) {
            case "ArrowRight":
                this.moveCaretRelative(1, selecting);
                break;
            case "ArrowLeft":
                this.moveCaretRelative(-1, selecting);
                break;
            case "Backspace":
                this.backspaceAtCaret();
                break;
        }
    }

    moveCaretRelative(dx: number, selecting: boolean): void {
        const newCaretPositions: CaretPosition[] = [];
        for (const caretPosition of this._caretPositions) {
            const queryItem = this.getQueryItemById(caretPosition.queryId);
            if (!queryItem) {
                newCaretPositions.push(caretPosition);
                continue;
            }

            let newOffset = caretPosition.offset + dx;
            newOffset = Math.max(
                0,
                Math.min(newOffset, queryItem.query.length)
            );

            newCaretPositions.push({
                queryId: caretPosition.queryId,
                offset: newOffset,
            });
        }

        this._caretPositions = newCaretPositions;
        this.notifySubscribers(Topic.CARET_POSITIONS);
        this.notifySubscribers(Topic.HAS_FOCUS);
    }

    backspaceAtCaret(): void {
        const newQueryItems: QueryItem[] = [];
        const newCaretPositions: CaretPosition[] = [];

        for (const item of this._queryItems) {
            const caretPosition = this._caretPositions.find(
                (cp) => cp.queryId === item.id
            );

            if (!caretPosition) {
                newQueryItems.push(item);
                continue;
            }

            if (caretPosition.offset === 0) {
                newQueryItems.push(item);
                newCaretPositions.push(caretPosition);
                continue;
            }

            const before = item.query.slice(0, caretPosition.offset - 1);
            const after = item.query.slice(caretPosition.offset);
            const newQuery = before + after;

            newQueryItems.push({
                id: item.id,
                query: newQuery,
            });
        }

        for (const caretPosition of this._caretPositions) {
            const newCaretPosition: CaretPosition = {
                queryId: caretPosition.queryId,
                offset: caretPosition.offset - 1,
            };
            newCaretPositions.push(newCaretPosition);
        }

        this._queryItems = newQueryItems;
        this._caretPositions = newCaretPositions;

        this.notifySubscribers(Topic.QUERY_ITEMS);
        this.notifySubscribers(Topic.CARET_POSITIONS);
    }

    addQueryItem(query: string): void {
        const newQueryItem: QueryItem = {
            id: this.generateQueryItemId(),
            query: query,
        };
        this._queryItems = [...this._queryItems, newQueryItem];
        this.notifySubscribers(Topic.QUERY_ITEMS);
    }

    setCaretPosition(position: CaretPosition): void {
        this._caretPositions = [position];
        this.notifySubscribers(Topic.CARET_POSITIONS);
        this.notifySubscribers(Topic.HAS_FOCUS);
    }

    private generateQueryItemId(): string {
        this._queryItemCounter += 1;
        return `queryItem-${this._queryItemCounter}`;
    }

    private insertTextAtCaret(text: string): void {
        const newQueryItems: QueryItem[] = [];
        const newCaretPositions: CaretPosition[] = [];

        for (const item of this._queryItems) {
            const caretPosition = this._caretPositions.find(
                (cp) => cp.queryId === item.id
            );

            if (!caretPosition) {
                newQueryItems.push(item);
                continue;
            }

            const before = item.query.slice(0, caretPosition.offset);
            const after = item.query.slice(caretPosition.offset);
            const newQuery = before + text + after;

            newQueryItems.push({
                id: item.id,
                query: newQuery,
            });
        }

        this._queryItems = newQueryItems;

        for (const caretPosition of this._caretPositions) {
            const newCaretPosition: CaretPosition = {
                queryId: caretPosition.queryId,
                offset: caretPosition.offset + text.length,
            };
            newCaretPositions.push(newCaretPosition);
        }

        this._caretPositions = newCaretPositions;

        this.notifySubscribers(Topic.QUERY_ITEMS);
        this.notifySubscribers(Topic.CARET_POSITIONS);
    }

    private setCaretPositionToEnd() {
        const lastItem = this._queryItems[this._queryItems.length - 1];
        if (!lastItem) {
            return;
        }

        const offset = lastItem.query.length;
        const caretPosition: CaretPosition = {
            queryId: lastItem.id,
            offset: offset,
        };
        this._caretPositions = [caretPosition];
        this.notifySubscribers(Topic.CARET_POSITIONS);
        this.notifySubscribers(Topic.HAS_FOCUS);
        console.log("Caret position set to end:", caretPosition);
        console.log("Current caret positions:", this._caretPositions);
    }

    private clearCaretPositions() {
        this._caretPositions = [];
        this.notifySubscribers(Topic.CARET_POSITIONS);
        this.notifySubscribers(Topic.HAS_FOCUS);
    }
}

export function useSubscribeToStateManagerTopicValue<T extends Topic>(
    stateManager: StateManager,
    topic: T
): TopicPayloads[T] {
    return useSyncExternalStore(
        stateManager.makeSubscriberFunction(topic),
        stateManager.makeSnapshotGetter(topic)
    );
}
