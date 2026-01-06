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

export type SegmentCaretPosition = {
    queryId: string;
    segmentIndex: number;
    offset: number; // Relative to segment start
    anchorOffset: number; // Relative to segment start
};

export type QuerySegment = {
    queryId: string;
    segmentIndex: number;
};

export enum Topic {
    HAS_FOCUS = "hasFocus",
    QUERY_ITEMS = "queryItems",
    CARET_POSITIONS = "caretPositions",
    SEGMENT_CARET_POSITIONS = "segmentCaretPositions",
    SUGGESTIONS_INDEX = "suggestionsIndex",
    FOCUSED_SEGMENT = "focusedSegment",
}

export type TopicPayloads = {
    [Topic.HAS_FOCUS]: boolean;
    [Topic.QUERY_ITEMS]: QueryItem[];
    [Topic.CARET_POSITIONS]: CaretPosition[];
    [Topic.SEGMENT_CARET_POSITIONS]: SegmentCaretPosition[];
    [Topic.SUGGESTIONS_INDEX]: number | null;
    [Topic.FOCUSED_SEGMENT]: QuerySegment | null;
};

export type StateManagerOptions = {
    delimiter: string;
};

const BRACKET_PAIRS = [
    { open: "(", close: ")" },
    { open: "{", close: "}" },
] as const;

export class StateManager implements PubSub<TopicPayloads> {
    private _pubSubDelegate = new PubSubDelegate<TopicPayloads>();

    // Settings
    private _delimiter: string;

    // State
    private _queryStore: QueryStore;
    private _caretPositions: CaretPosition[] = [];
    private _segmentCaretPositions: SegmentCaretPosition[] = [];
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

    getCaretPositions(): CaretPosition[] {
        return this._caretPositions;
    }

    makeSnapshotGetter<T extends keyof TopicPayloads>(
        topic: T
    ): () => TopicPayloads[T] {
        switch (topic) {
            case Topic.QUERY_ITEMS:
                return () => this._queryStore.getItems() as TopicPayloads[T];
            case Topic.CARET_POSITIONS:
                return () => this._caretPositions as TopicPayloads[T];
            case Topic.SEGMENT_CARET_POSITIONS:
                return () => this._segmentCaretPositions as TopicPayloads[T];
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

    private convertToSegmentCaretPosition(
        position: CaretPosition,
        query: string
    ): SegmentCaretPosition {
        const segments = query.split(this._delimiter);
        let accumulatedLength = 0;
        let segmentIndex = 0;
        let segmentOffset = position.offset;
        let anchorSegmentOffset = position.anchorOffset;

        // Find segment for caret offset
        for (let i = 0; i < segments.length; i++) {
            const segmentEnd = accumulatedLength + segments[i].length;
            if (position.offset <= segmentEnd) {
                segmentIndex = i;
                segmentOffset = position.offset - accumulatedLength;
                break;
            }
            accumulatedLength = segmentEnd + this._delimiter.length;
        }

        // Find anchor offset relative to the same segment
        accumulatedLength = 0;
        for (let i = 0; i < segments.length; i++) {
            const segmentEnd = accumulatedLength + segments[i].length;
            if (position.anchorOffset <= segmentEnd) {
                if (i === segmentIndex) {
                    // Anchor is in the same segment
                    anchorSegmentOffset =
                        position.anchorOffset - accumulatedLength;
                } else {
                    // Anchor is in a different segment - collapse to caret position
                    anchorSegmentOffset = segmentOffset;
                }
                break;
            }
            accumulatedLength = segmentEnd + this._delimiter.length;
        }

        return {
            queryId: position.queryId,
            segmentIndex,
            offset: segmentOffset,
            anchorOffset: anchorSegmentOffset,
        };
    }

    updateCaretPositions(positions: CaretPosition[]): void {
        this._caretPositions = positions;

        // Compute segment-relative positions
        this._segmentCaretPositions = positions.map((position) => {
            const queryItem = this._queryStore.getItemById(position.queryId);
            if (!queryItem) {
                // Fallback for invalid query ID
                return {
                    queryId: position.queryId,
                    segmentIndex: 0,
                    offset: position.offset,
                    anchorOffset: position.anchorOffset,
                };
            }
            return this.convertToSegmentCaretPosition(
                position,
                queryItem.query
            );
        });

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
        this._pubSubDelegate.notifySubscribers(Topic.SEGMENT_CARET_POSITIONS);
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

            if (
                caretPosition.offset !== caretPosition.anchorOffset &&
                !selecting
            ) {
                // Collapse selection to the end we're moving towards
                const newCaretPosition: CaretPosition = {
                    queryId: caretPosition.queryId,
                    offset: caretPosition.offset,
                    anchorOffset: caretPosition.offset,
                };
                newCaretPositions.push(newCaretPosition);
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

    private maybeDeleteSelection(
        value: string,
        caretOffset: number,
        anchorOffset: number
    ): {
        newValue: string;
        newCaretOffset: number;
        newAnchorOffset: number;
        deleted: boolean;
    } {
        if (caretOffset === anchorOffset) {
            return {
                newValue: value,
                newCaretOffset: caretOffset,
                newAnchorOffset: anchorOffset,
                deleted: false,
            };
        }

        const start = Math.min(caretOffset, anchorOffset);
        const end = Math.max(caretOffset, anchorOffset);

        const newValue = value.slice(0, start) + value.slice(end);
        return {
            newValue,
            newCaretOffset: start,
            newAnchorOffset: start,
            deleted: true,
        };
    }

    private findNextCharacterIndex(
        value: string,
        startIndex: number,
        char: string,
        reverse: boolean
    ): number {
        for (
            let i = startIndex;
            reverse ? i >= 0 : i < value.length;
            reverse ? i-- : i++
        ) {
            if (value.charAt(i) === char) {
                return i;
            }
        }
        return -1;
    }

    private maybeUnwrapGrouping(
        value: string,
        caretOffset: number
    ): {
        newValue: string;
        newCaretOffset: number;
        newAnchorOffset: number;
        unwrapped: boolean;
    } {
        if (caretOffset === 0) {
            return {
                newValue: value,
                newCaretOffset: caretOffset,
                newAnchorOffset: caretOffset,
                unwrapped: false,
            };
        }

        const charBefore = value.charAt(caretOffset - 1);

        for (const pair of BRACKET_PAIRS) {
            if (charBefore === pair.close) {
                // Find matching opening bracket
                const openIndex = this.findNextCharacterIndex(
                    value,
                    caretOffset - 2,
                    pair.open,
                    true
                );
                if (openIndex === -1) {
                    return {
                        newValue: value,
                        newCaretOffset: caretOffset,
                        newAnchorOffset: caretOffset,
                        unwrapped: false,
                    };
                }

                return {
                    newValue: value,
                    newCaretOffset: openIndex,
                    newAnchorOffset: caretOffset,
                    unwrapped: true,
                };
            }

            if (charBefore === pair.open) {
                const closeIndex = this.findNextCharacterIndex(
                    value,
                    caretOffset,
                    pair.close,
                    false
                );
                if (closeIndex === -1) {
                    return {
                        newValue: value,
                        newCaretOffset: caretOffset,
                        newAnchorOffset: caretOffset,
                        unwrapped: false,
                    };
                }

                const before = value.slice(0, caretOffset - 1);
                const middle = value.slice(caretOffset, closeIndex);
                const after = value.slice(closeIndex + 1);
                const newValue = before + middle + after;

                return {
                    newValue,
                    newCaretOffset: caretOffset - 1,
                    newAnchorOffset: caretOffset - 1,
                    unwrapped: true,
                };
            }
        }

        return {
            newValue: value,
            newCaretOffset: caretOffset,
            newAnchorOffset: caretOffset,
            unwrapped: false,
        };
    }

    backspaceAtCaret(): void {
        const newCaretPositions: CaretPosition[] = [];

        for (const caretPosition of this._caretPositions) {
            const queryItem = this._queryStore.getItemById(
                caretPosition.queryId
            );
            if (!queryItem) {
                continue;
            }

            if (
                caretPosition.offset === 0 &&
                caretPosition.anchorOffset === 0
            ) {
                newCaretPositions.push(caretPosition);
                continue;
            }

            const deleteSelectionResult = this.maybeDeleteSelection(
                queryItem.query,
                caretPosition.offset,
                caretPosition.anchorOffset
            );

            if (deleteSelectionResult.deleted) {
                this._queryStore.updateItem(
                    queryItem.id,
                    deleteSelectionResult.newValue
                );

                const newCaretPosition: CaretPosition = {
                    queryId: caretPosition.queryId,
                    offset: deleteSelectionResult.newCaretOffset,
                    anchorOffset: deleteSelectionResult.newAnchorOffset,
                };
                newCaretPositions.push(newCaretPosition);
                continue;
            }

            const unwrapResult = this.maybeUnwrapGrouping(
                queryItem.query,
                caretPosition.offset
            );

            if (unwrapResult.unwrapped) {
                this._queryStore.updateItem(
                    queryItem.id,
                    unwrapResult.newValue
                );

                const newCaretPosition: CaretPosition = {
                    queryId: caretPosition.queryId,
                    offset: unwrapResult.newCaretOffset,
                    anchorOffset: unwrapResult.newAnchorOffset,
                };
                newCaretPositions.push(newCaretPosition);
                continue;
            }

            const before = queryItem.query.slice(0, caretPosition.offset - 1);
            const after = queryItem.query.slice(caretPosition.offset);
            const newQuery = before + after;

            this._queryStore.updateItem(queryItem.id, newQuery);

            const newCaretPosition: CaretPosition = {
                queryId: caretPosition.queryId,
                offset: caretPosition.offset - 1,
                anchorOffset: caretPosition.offset - 1,
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

            let start = Math.min(
                caretPosition.offset,
                caretPosition.anchorOffset
            );
            const end = Math.max(
                caretPosition.offset,
                caretPosition.anchorOffset
            );

            const before = queryItem.query.slice(0, start);
            const after = queryItem.query.slice(end);

            if (text === "(") {
                text = "()";
                start -= 1;
            }
            if (text === "{") {
                text = "{}";
                start -= 1;
            }

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
        this._segmentCaretPositions = [];
        this._focusedSegment = null;
        this._pubSubDelegate.notifySubscribers(Topic.CARET_POSITIONS);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
        this._pubSubDelegate.notifySubscribers(Topic.FOCUSED_SEGMENT);
    }
}
