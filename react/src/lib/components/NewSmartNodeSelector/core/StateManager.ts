import { PubSubDelegate, type PubSub } from "./PubSubDelegate";
import { QueryStore } from "./QueryStore";

export type QueryItem = {
    id: string;
    query: string;
};

export type CaretPosition = {
    queryId: string;
    offset: number;
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
            newOffset = Math.max(
                0,
                Math.min(newOffset, queryItem.query.length)
            );

            newCaretPositions.push({
                queryId: caretPosition.queryId,
                offset: newOffset,
            });
        }

        this.updateCaretPositions(newCaretPositions);
        this._pubSubDelegate.notifySubscribers(Topic.CARET_POSITIONS);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
    }

    backspaceAtCaret(): void {
        const newQueryItems: QueryItem[] = [];
        const newCaretPositions: CaretPosition[] = [];

        for (const item of this._queryStore.getItems()) {
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

            this._queryStore.updateItem(item.id, newQuery);

            const newCaretPosition: CaretPosition = {
                queryId: caretPosition.queryId,
                offset: caretPosition.offset - 1,
            };
            newCaretPositions.push(newCaretPosition);
        }

        this.updateCaretPositions(newCaretPositions);

        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
        this._pubSubDelegate.notifySubscribers(Topic.CARET_POSITIONS);
    }

    addQueryItem(query: string): void {
        this._queryStore.addItem(query);
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
    }

    setCaretPosition(position: CaretPosition): void {
        this._caretPositions = [position];
        this._pubSubDelegate.notifySubscribers(Topic.CARET_POSITIONS);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
    }

    private updateCaretPosition(position: CaretPosition, index: number): void {
        if (index < 0 || index >= this._caretPositions.length) {
            return;
        }

        this._caretPositions = this._caretPositions.map((cp, i) =>
            i === index ? position : cp
        );
    }

    private insertTextAtCaret(text: string): void {
        const newCaretPositions: CaretPosition[] = [];

        for (const caretPosition of this._caretPositions) {
            const queryItem = this._queryStore.getItemById(
                caretPosition.queryId
            );
            if (!queryItem) {
                continue;
            }

            const before = queryItem.query.slice(0, caretPosition.offset);
            const after = queryItem.query.slice(caretPosition.offset);
            const newQuery = before + text + after;

            this._queryStore.updateItem(queryItem.id, newQuery);
            const newCaretPosition: CaretPosition = {
                queryId: caretPosition.queryId,
                offset: caretPosition.offset + text.length,
            };
            newCaretPositions.push(newCaretPosition);
        }

        this.updateCaretPositions(newCaretPositions);

        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
        this._pubSubDelegate.notifySubscribers(Topic.CARET_POSITIONS);
    }

    private setCaretPositionToEnd() {
        const lastItem = this._queryStore.getLastItem();
        if (!lastItem) {
            return;
        }

        const offset = lastItem.query.length;
        const caretPosition: CaretPosition = {
            queryId: lastItem.id,
            offset: offset,
        };
        this.updateCaretPositions([caretPosition]);

        this._pubSubDelegate.notifySubscribers(Topic.CARET_POSITIONS);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
        console.log("Caret position set to end:", caretPosition);
        console.log("Current caret positions:", this._caretPositions);
    }

    private clearCaretPositions() {
        this._caretPositions = [];
        this._pubSubDelegate.notifySubscribers(Topic.CARET_POSITIONS);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
    }
}
