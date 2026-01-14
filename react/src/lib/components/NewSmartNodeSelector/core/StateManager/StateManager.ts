import { PubSubDelegate, type PubSub } from "../PubSubDelegate";
import {
    evaluateQuery,
    type EvaluationResult,
} from "../query-language/evaluator/evaluateQuery";
import { parseQuery, type ParsedQuery } from "../query-language/parse";
import type { TreeAccessor } from "../query-language/types/tree";
import { makeIndexedNodeAccessor, type BuildResult } from "../TreeIndexBuilder";
import type { IndexedNode } from "../types";
import type { Range } from "../utils/range";
import { Cache } from "./Cache";
import { QueriesStoreDelegate } from "./QueriesStoreDelegate";
import type { QueryItem } from "./types";

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

export type CompletionContext = {
    queryId: string;
    queryItem: QueryItem;
    caretPosition: CaretPosition;
    segmentIndex: number;
};

export enum Topic {
    HAS_FOCUS = "hasFocus",
    QUERY_ITEMS = "queryItems",
    CARET_POSITIONS = "caretPositions",
    SEGMENT_CARET_POSITIONS = "segmentCaretPositions",
    FOCUSED_SEGMENT = "focusedSegment",
    COMPLETION_CONTEXT = "completionContext",
}

export type TopicPayloads = {
    [Topic.HAS_FOCUS]: boolean;
    [Topic.QUERY_ITEMS]: QueryItem[];
    [Topic.CARET_POSITIONS]: CaretPosition[];
    [Topic.SEGMENT_CARET_POSITIONS]: SegmentCaretPosition[];
    [Topic.FOCUSED_SEGMENT]: QuerySegment | null;
    [Topic.COMPLETION_CONTEXT]: CompletionContext | null;
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
    private _queriesStoreDelegate: QueriesStoreDelegate;
    private _caretPositions: CaretPosition[] = [];
    private _segmentCaretPositions: SegmentCaretPosition[] = [];
    private _focusedSegment: QuerySegment | null = null;
    private _treeAccessor: TreeAccessor<IndexedNode> | null = null;
    private _parseCache = new Cache<ParsedQuery>();
    private _treeMatchCache = new Cache<EvaluationResult<IndexedNode>>();
    private _completionContext: CompletionContext | null = null;

    constructor(options: StateManagerOptions) {
        this._delimiter = options.delimiter;
        this._queriesStoreDelegate = new QueriesStoreDelegate();
    }

    updateDelimiter(delimiter: string): void {
        this._parseCache.clear();
        this._delimiter = delimiter;
    }

    updateBuildResult(buildResult: BuildResult): void {
        this._treeMatchCache.clear();
        this._treeAccessor = makeIndexedNodeAccessor(buildResult);
    }

    getPubSubDelegate(): PubSubDelegate<TopicPayloads> {
        return this._pubSubDelegate;
    }

    getQueryItemById(id: string): QueryItem | null {
        const queryBaseItem = this._queriesStoreDelegate.getItemById(id);
        if (!queryBaseItem) {
            return null;
        }

        return queryBaseItem;
    }

    getParsedQuery(query: string): ParsedQuery | null {
        let parsedQuery = this._parseCache.getItem(query);
        if (parsedQuery) {
            return parsedQuery;
        }

        parsedQuery = parseQuery(query, { delimiter: this._delimiter });
        this._parseCache.setItem(query, parsedQuery);
        return parsedQuery;
    }

    getMatchedNodesForQuery(
        query: string
    ): EvaluationResult<IndexedNode> | null {
        const parsedQuery = this.getParsedQuery(query);
        if (!parsedQuery || !this._treeAccessor) {
            return null;
        }

        let matchedNodes = this._treeMatchCache.getItem(query);
        if (matchedNodes) {
            return matchedNodes;
        }

        matchedNodes = evaluateQuery(parsedQuery, this._treeAccessor);
        this._treeMatchCache.setItem(query, matchedNodes);
        return matchedNodes;
    }

    getFocusedSegment(): QuerySegment | null {
        return this._focusedSegment;
    }

    getCaretPositions(): CaretPosition[] {
        return this._caretPositions;
    }

    getCompletionContext(): CompletionContext | null {
        return this._completionContext;
    }

    makeSnapshotGetter<T extends keyof TopicPayloads>(
        topic: T
    ): () => TopicPayloads[T] {
        switch (topic) {
            case Topic.QUERY_ITEMS:
                return () =>
                    this._queriesStoreDelegate.getItems() as TopicPayloads[T];
            case Topic.CARET_POSITIONS:
                return () => this._caretPositions as TopicPayloads[T];
            case Topic.SEGMENT_CARET_POSITIONS:
                return () => this._segmentCaretPositions as TopicPayloads[T];
            case Topic.FOCUSED_SEGMENT:
                return () => this._focusedSegment as TopicPayloads[T];
            case Topic.HAS_FOCUS:
                return () =>
                    (this._caretPositions.length > 0) as TopicPayloads[T];
            case Topic.COMPLETION_CONTEXT:
                return () => this._completionContext as TopicPayloads[T];
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
            const queryItem = this._queriesStoreDelegate.getItemById(
                position.queryId
            );
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
            const queryItem = this._queriesStoreDelegate.getItemById(
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

        this.updateCompletionsContext();

        this._pubSubDelegate.notifySubscribers(Topic.CARET_POSITIONS);
        this._pubSubDelegate.notifySubscribers(Topic.SEGMENT_CARET_POSITIONS);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
        this._pubSubDelegate.notifySubscribers(Topic.FOCUSED_SEGMENT);
    }

    private updateCompletionsContext(): void {
        if (this._caretPositions.length !== 1) {
            this._completionContext = null;
            return;
        }

        const queryItem = this._queriesStoreDelegate.getItemById(
            this._caretPositions[0].queryId
        );

        if (!queryItem) {
            this._completionContext = null;
            return;
        }

        this._completionContext = {
            queryId: queryItem.id,
            queryItem,
            caretPosition: this._caretPositions[0],
            segmentIndex: this.computeSegmentIndex(
                queryItem.query,
                this._caretPositions[0].offset
            ),
        };

        this._pubSubDelegate.notifySubscribers(Topic.COMPLETION_CONTEXT);
    }

    private getSegmentForCaretOffset(
        query: string,
        offset: number
    ): {
        index: number;
        startOffset: number;
        endOffset: number;
        length: number;
    } {
        const segments = query.split(this._delimiter);
        let accumulatedLength = 0;
        for (let i = 0; i < segments.length; i++) {
            const segmentEnd = accumulatedLength + segments[i].length;
            if (offset <= segmentEnd) {
                return {
                    index: i,
                    startOffset: accumulatedLength,
                    endOffset: segmentEnd,
                    length: segments[i].length,
                };
            }
            accumulatedLength = segmentEnd + this._delimiter.length;
        }
        return {
            index: segments.length - 1,
            startOffset:
                accumulatedLength -
                segments[segments.length - 1].length -
                this._delimiter.length,
            endOffset: accumulatedLength - this._delimiter.length,
            length: segments[segments.length - 1].length,
        };
    }

    moveCaretToStartOrEndOfCurrentSegment(
        where: "start" | "end",
        selecting: boolean
    ): void {
        const newCaretPositions: CaretPosition[] = [];
        for (const caretPosition of this._caretPositions) {
            const queryItem = this._queriesStoreDelegate.getItemById(
                caretPosition.queryId
            );

            if (!queryItem) {
                newCaretPositions.push(caretPosition);
                continue;
            }

            const segment = this.getSegmentForCaretOffset(
                queryItem.query,
                caretPosition.offset
            );

            const newCaretOffset =
                where === "start" ? segment.startOffset : segment.endOffset;

            const newCaretPosition: CaretPosition = {
                queryId: caretPosition.queryId,
                offset: newCaretOffset,
                anchorOffset: selecting
                    ? caretPosition.anchorOffset
                    : newCaretOffset,
            };
            newCaretPositions.push(newCaretPosition);
        }

        this.updateCaretPositions(newCaretPositions);
    }

    private maybeCollapseSelection(
        caretPosition: CaretPosition,
        selecting: boolean
    ): { hasCollapsed: boolean; newCaretPosition: CaretPosition } {
        if (caretPosition.offset === caretPosition.anchorOffset || selecting) {
            return { hasCollapsed: false, newCaretPosition: caretPosition };
        }

        const newCaretPosition: CaretPosition = {
            queryId: caretPosition.queryId,
            offset: caretPosition.offset,
            anchorOffset: caretPosition.offset,
        };
        return { hasCollapsed: true, newCaretPosition };
    }

    private maybeChangeSelection(
        caretPosition: CaretPosition,
        dx: number,
        selecting: boolean
    ): { hasChanged: boolean; newCaretPosition: CaretPosition } {
        const queryItem = this._queriesStoreDelegate.getItemById(
            caretPosition.queryId
        );

        if (!selecting || !queryItem) {
            return { hasChanged: false, newCaretPosition: caretPosition };
        }

        const segment = this.getSegmentForCaretOffset(
            queryItem.query,
            caretPosition.offset
        );

        let newOffset = caretPosition.offset + dx;

        if (newOffset < segment.startOffset) {
            newOffset = segment.startOffset;
        } else if (newOffset > segment.endOffset) {
            newOffset = segment.endOffset;
        }
        const newCaretPosition: CaretPosition = {
            queryId: caretPosition.queryId,
            offset: newOffset,
            anchorOffset: caretPosition.anchorOffset,
        };
        return { hasChanged: true, newCaretPosition };
    }

    moveCaretRelative(dx: number, selecting: boolean): void {
        const newCaretPositions: CaretPosition[] = [];
        for (const caretPosition of this._caretPositions) {
            const queryItem = this._queriesStoreDelegate.getItemById(
                caretPosition.queryId
            );

            if (!queryItem) {
                newCaretPositions.push(caretPosition);
                continue;
            }

            const { hasCollapsed, newCaretPosition: collapsedCaretPosition } =
                this.maybeCollapseSelection(caretPosition, selecting);
            if (hasCollapsed) {
                newCaretPositions.push(collapsedCaretPosition);
                continue;
            }

            const { hasChanged, newCaretPosition } = this.maybeChangeSelection(
                caretPosition,
                dx,
                selecting
            );
            if (hasChanged) {
                newCaretPositions.push(newCaretPosition);
                continue;
            }

            let newQueryId = caretPosition.queryId;
            let newOffset = caretPosition.offset + dx;

            if (newOffset > queryItem.query.length) {
                if (caretPosition.anchorOffset === caretPosition.offset) {
                    const nextItem = this._queriesStoreDelegate.getNextItem(
                        queryItem.id
                    );
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
                    const previousItem =
                        this._queriesStoreDelegate.getPreviousItem(
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

    removeFromQueryAtCaret(direction: "backward" | "forward"): void {
        const newCaretPositions: CaretPosition[] = [];

        for (const caretPosition of this._caretPositions) {
            const queryItem = this._queriesStoreDelegate.getItemById(
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
                this._queriesStoreDelegate.updateItem(
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
                this._queriesStoreDelegate.updateItem(
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
            const before = queryItem.query.slice(
                0,
                caretPosition.offset + (direction === "backward" ? -1 : 0)
            );
            const after = queryItem.query.slice(
                caretPosition.offset + (direction === "forward" ? 1 : 0)
            );
            const newQuery = before + after;

            this._queriesStoreDelegate.updateItem(queryItem.id, newQuery);

            const newCaretPosition: CaretPosition = {
                queryId: caretPosition.queryId,
                offset:
                    caretPosition.offset - (direction === "backward" ? 1 : 0),
                anchorOffset:
                    caretPosition.offset - (direction === "backward" ? 1 : 0),
            };
            newCaretPositions.push(newCaretPosition);
        }

        this.updateCaretPositions(newCaretPositions);
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
    }

    addQueryItem(query: string): void {
        this._queriesStoreDelegate.addItem(query);
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
    }

    getFocusedQueryItem(): QueryItem | null {
        if (this._caretPositions.length !== 1) {
            return null;
        }

        const queryItem = this._queriesStoreDelegate.getItemById(
            this._caretPositions[0].queryId
        );
        if (!queryItem) {
            return null;
        }

        return queryItem;
    }

    updateFocusedQueryItem(insertText: string, range?: Range): boolean {
        if (this._caretPositions.length !== 1) {
            return false;
        }

        const queryId = this._caretPositions[0].queryId;
        const queryItem = this._queriesStoreDelegate.getItemById(queryId);
        if (!queryItem) {
            return false;
        }

        if (!this.updateQueryItem(queryId, insertText, range)) {
            return false;
        }

        const newOffset = range
            ? range.start + insertText.length
            : this._caretPositions[0].offset + insertText.length;
        const newCaretPosition: CaretPosition = {
            queryId: queryId,
            offset: newOffset,
            anchorOffset: newOffset,
        };
        this.updateCaretPositions([newCaretPosition]);
        return true;
    }

    updateQueryItem(id: string, insertText: string, range?: Range): boolean {
        const queryItem = this._queriesStoreDelegate.getItemById(id);
        if (!queryItem) {
            return false;
        }

        let newQuery: string = insertText;
        if (range) {
            const before = queryItem.query.slice(0, range.start);
            const after = queryItem.query.slice(range.end);
            newQuery = before + insertText + after;
        }

        this._queriesStoreDelegate.updateItem(id, newQuery);
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
        return true;
    }

    removeQueryItemById(id: string): void {
        this._queriesStoreDelegate.removeItem(id);
        if (this._queriesStoreDelegate.getItems().length === 0) {
            this._parseCache.clear();
            this._treeMatchCache.clear();

            const firstItem = this._queriesStoreDelegate.addItem("");
            const newCaretPosition: CaretPosition = {
                queryId: firstItem.id,
                offset: 0,
                anchorOffset: 0,
            };
            this.updateCaretPositions([newCaretPosition]);
        }
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
    }

    setCaretPositionToEndOfQueryItem(id: string): void {
        const queryItem = this._queriesStoreDelegate.getItemById(id);
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

    insertTextAtCaret(text: string): void {
        const newCaretPositions: CaretPosition[] = [];

        for (const caretPosition of this._caretPositions) {
            const queryItem = this._queriesStoreDelegate.getItemById(
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

            /*
            if (text === "(") {
                text = "()";
                start -= 1;
            }
            if (text === "{") {
                text = "{}";
                start -= 1;
            }
                */

            const newQuery = before + text + after;

            this._queriesStoreDelegate.updateItem(queryItem.id, newQuery);

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
        const lastItem = this._queriesStoreDelegate.getLastItem();
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
