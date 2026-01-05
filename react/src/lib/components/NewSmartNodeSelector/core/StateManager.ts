import { clamp } from "lodash";
import { PubSubDelegate, type PubSub } from "./PubSubDelegate";
import { QueryStore } from "./QueryStore";

export type QueryItem = {
    id: string;
    query: string;
};

export type CaretPosition = {
    queryId: string;
    offset: number;
    anchorOffset: number;
};

export type QuerySegment = {
    queryId: string;
    segmentIndex: number;
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
    [Topic.FOCUSED_SEGMENT]: QuerySegment | null;
};

export type StateManagerOptions = {
    delimiter: string;
};

export class StateManager implements PubSub<TopicPayloads> {
    private _pubSubDelegate = new PubSubDelegate<TopicPayloads>();

    // Settings
    private _delimiter: string;

    // State
    private _queryStore: QueryStore;
    private _caretPositions: CaretPosition[] = [];
    private _suggestionsIndex: number | null = null;
    private _focusedSegment: QuerySegment | null = null;

    constructor(options: StateManagerOptions) {
        this._delimiter = options.delimiter;
        this._queryStore = new QueryStore();
    }

    getPubSubDelegate(): PubSubDelegate<TopicPayloads> {
        return this._pubSubDelegate;
    }

    getQueryItemById(id: string): QueryItem | null {
        return this._queryStore.getItemById(id);
    }

    getFocusedSegment(): QuerySegment | null {
        return this._focusedSegment;
    }

    makeSnapshotGetter<T extends keyof TopicPayloads>(
        topic: T
    ): () => TopicPayloads[T] {
        switch (topic) {
            case Topic.QUERY_ITEMS:
                return () => this._queryStore.getItems() as TopicPayloads[T];
            case Topic.CARET_POSITIONS:
                return () => this._caretPositions as TopicPayloads[T];
            case Topic.SUGGESTIONS_INDEX:
                return () => this._suggestionsIndex as TopicPayloads[T];
            case Topic.FOCUSED_SEGMENT:
                return () => this._focusedSegment as TopicPayloads[T];
            case Topic.HAS_FOCUS:
                return () =>
                    (this._caretPositions.length > 0) as TopicPayloads[T];
        }
    }

    processFocusChange(hasFocus: boolean): void {
        const currentlyHasFocus = this._caretPositions.length > 0;

        if (hasFocus) {
            // Only set caret position if we don't already have focus
            if (!currentlyHasFocus) {
                this.setCaretPositionToEndOfLastItem();
            }
        } else {
            // Only clear if we currently have focus
            if (currentlyHasFocus) {
                this.clearCaretPositions();
            }
        }
    }

    private computeSegmentIndex(query: string, offset: number): number {
        const segments = query.split(this._delimiter);
        let accumulatedLength = 0;

        for (let i = 0; i < segments.length; i++) {
            accumulatedLength += segments[i].length;
            if (offset <= accumulatedLength) {
                return i;
            }
            // Account for delimiter length
            accumulatedLength += this._delimiter.length;
        }

        return segments.length - 1;
    }

    updateCaretPositions(positions: CaretPosition[]): void {
        this._caretPositions = positions;

        if (positions.length === 1) {
            const queryItem = this._queryStore.getItemById(
                positions[0].queryId
            );
            if (!queryItem) {
                throw new Error("Invalid query ID in caret position");
            }
            this._focusedSegment = {
                queryId: positions[0].queryId,
                segmentIndex: this.computeSegmentIndex(
                    queryItem.query,
                    positions[0].offset
                ),
            };
        } else {
            this._focusedSegment = null;
        }

        this._pubSubDelegate.notifySubscribers(Topic.CARET_POSITIONS);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
        this._pubSubDelegate.notifySubscribers(Topic.FOCUSED_SEGMENT);
    }

    moveCaretRelative(dx: number, selecting: boolean): void {
        const newCaretPositions: CaretPosition[] = [];
        for (const caretPosition of this._caretPositions) {
            const queryItem = this._queryStore.getItemById(
                caretPosition.queryId
            );
            if (!queryItem) {
                newCaretPositions.push(caretPosition);
                continue;
            }

            let newOffset = caretPosition.offset + dx;
            let newQueryId = caretPosition.queryId;

            if (newOffset > queryItem.query.length) {
                if (caretPosition.anchorOffset === caretPosition.offset) {
                    const nextItem = this._queryStore.getNextItem(queryItem.id);
                    if (nextItem) {
                        newOffset = 0;
                        newQueryId = nextItem.id;
                    } else {
                        newOffset = queryItem.query.length;
                    }
                } else {
                    newOffset = queryItem.query.length;
                }
            }
            if (newOffset < 0) {
                if (caretPosition.anchorOffset === caretPosition.offset) {
                    const previousItem = this._queryStore.getPreviousItem(
                        queryItem.id
                    );
                    if (previousItem) {
                        newOffset = previousItem.query.length;
                        newQueryId = previousItem.id;
                    } else {
                        newOffset = 0;
                    }
                } else {
                    newOffset = 0;
                }
            }

            newCaretPositions.push({
                queryId: newQueryId,
                offset: newOffset,
                anchorOffset: selecting
                    ? caretPosition.anchorOffset
                    : newOffset,
            });
        }

        this.updateCaretPositions(newCaretPositions);
    }

    backspaceAtCaret(): void {
        const newQueryItems: QueryItem[] = [];
        const newCaretPositions: CaretPosition[] = [];

        for (const item of this._caretPositions) {
            const queryItem = this._queryStore.getItemById(item.queryId);
            if (!queryItem) {
                continue;
            }

            if (item.offset === 0 && item.anchorOffset === 0) {
                newCaretPositions.push(item);
                continue;
            }

            let start = Math.min(item.offset, item.anchorOffset);
            const end = Math.max(item.offset, item.anchorOffset);

            if (start === end) {
                start = start - 1;
            }

            const before = queryItem.query.slice(0, start);
            const after = queryItem.query.slice(end);
            const newQuery = before + after;

            this._queryStore.updateItem(queryItem.id, newQuery);

            const newCaretPosition: CaretPosition = {
                queryId: item.queryId,
                offset: start,
                anchorOffset: start,
            };
            newCaretPositions.push(newCaretPosition);
        }

        this.updateCaretPositions(newCaretPositions);
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
    }

    addQueryItem(query: string): void {
        this._queryStore.addItem(query);
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
    }

    updateQueryItem(id: string, newQuery: string): void {
        this._queryStore.updateItem(id, newQuery);
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
    }

    setCaretPositionToEndOfQueryItem(id: string): void {
        const queryItem = this._queryStore.getItemById(id);
        if (!queryItem) {
            return;
        }

        const offset = queryItem.query.length;
        const caretPosition: CaretPosition = {
            queryId: id,
            offset: offset,
            anchorOffset: offset,
        };

        this.updateCaretPositions([caretPosition]);
    }

    setCaretPosition(position: CaretPosition): void {
        this.updateCaretPositions([position]);
    }

    private updateCaretPosition(position: CaretPosition, index: number): void {
        if (index < 0 || index >= this._caretPositions.length) {
            return;
        }

        this._caretPositions = this._caretPositions.map((cp, i) =>
            i === index ? position : cp
        );
    }

    insertTextAtCaret(text: string): void {
        const newCaretPositions: CaretPosition[] = [];

        for (const caretPosition of this._caretPositions) {
            const queryItem = this._queryStore.getItemById(
                caretPosition.queryId
            );

            if (!queryItem) {
                continue;
            }

            const start = Math.min(
                caretPosition.offset,
                caretPosition.anchorOffset
            );
            const end = Math.max(
                caretPosition.offset,
                caretPosition.anchorOffset
            );

            const before = queryItem.query.slice(0, start);
            const after = queryItem.query.slice(end);
            const newQuery = before + text + after;

            this._queryStore.updateItem(queryItem.id, newQuery);

            const newCaretPosition: CaretPosition = {
                queryId: caretPosition.queryId,
                offset: start + text.length,
                anchorOffset: start + text.length,
            };
            newCaretPositions.push(newCaretPosition);
        }

        this.updateCaretPositions(newCaretPositions);
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
    }

    setCaretPositionToEndOfLastItem() {
        const lastItem = this._queryStore.getLastItem();
        if (!lastItem) {
            return;
        }

        const offset = lastItem.query.length;
        const caretPosition: CaretPosition = {
            queryId: lastItem.id,
            offset: offset,
            anchorOffset: offset,
        };

        this.updateCaretPositions([caretPosition]);
    }

    private clearCaretPositions() {
        this._caretPositions = [];
        this._focusedSegment = null;
        this._pubSubDelegate.notifySubscribers(Topic.CARET_POSITIONS);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
        this._pubSubDelegate.notifySubscribers(Topic.FOCUSED_SEGMENT);
    }
}
