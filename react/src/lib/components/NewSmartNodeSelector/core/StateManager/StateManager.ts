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
import {
    QueryTextSelectionsDelegate,
    type QueryTextSelectionsDelegateSnapshot,
} from "./QueryTextSelectionsDelegate";
import type {
    CompletionContext,
    QueryItem,
    QuerySegment,
    QuerySelection,
    QueryTextSelection,
    SegmentTextSelection,
    SelectionMode,
    StatePatch,
} from "./types";

export enum Topic {
    HAS_FOCUS = "hasFocus",
    QUERY_ITEMS = "queryItems",
    QUERY_TEXT_SELECTIONS = "queryTextSelections",
    QUERY_SELECTION = "querySelection",
    SEGMENT_TEXT_SELECTIONS = "segmentTextSelections",
    FOCUSED_SEGMENT = "focusedSegment",
    COMPLETION_CONTEXT = "completionContext",
}

export type TopicPayloads = {
    [Topic.HAS_FOCUS]: boolean;
    [Topic.QUERY_ITEMS]: QueryItem[];
    [Topic.QUERY_TEXT_SELECTIONS]: QueryTextSelection[];
    [Topic.QUERY_SELECTION]: QuerySelection | null;
    [Topic.SEGMENT_TEXT_SELECTIONS]: SegmentTextSelection[];
    [Topic.FOCUSED_SEGMENT]: QuerySegment | null;
    [Topic.COMPLETION_CONTEXT]: CompletionContext | null;
};

export type StateManagerOptions = {
    delimiter: string;
};

export class StateManager implements PubSub<TopicPayloads> {
    private _pubSubDelegate = new PubSubDelegate<TopicPayloads>();
    private _queryTextSelectionsDelegate = new QueryTextSelectionsDelegate();

    // Settings
    private _delimiter: string;

    // State
    private _queriesStoreDelegate = new QueriesStoreDelegate();
    private _queryTextSelections: QueryTextSelection[] = [];
    private _querySelection: QuerySelection | null = null;
    private _selectionMode: SelectionMode = "text";
    private _segmentTextSelections: SegmentTextSelection[] = [];
    private _focusedSegment: QuerySegment | null = null;
    private _treeAccessor: TreeAccessor<IndexedNode> | null = null;
    private _parseCache = new Cache<ParsedQuery>();
    private _treeMatchCache = new Cache<EvaluationResult<IndexedNode>>();
    private _completionContext: CompletionContext | null = null;

    constructor(options: StateManagerOptions) {
        this._delimiter = options.delimiter;
    }

    private makeTextSelectionsSnapshot(): QueryTextSelectionsDelegateSnapshot {
        return {
            queryTextSelections: this._queryTextSelections,
            getQueryLengthById: (queryId: string): number | null => {
                const queryItem =
                    this._queriesStoreDelegate.getItemById(queryId);
                return queryItem ? queryItem.query.length : null;
            },
            getQueryTextById: (queryId: string): string | null => {
                const queryItem =
                    this._queriesStoreDelegate.getItemById(queryId);
                return queryItem ? queryItem.query : null;
            },
            getSegmentForTextOffset: (queryId: string, offset: number) => {
                const text = this.getQueryItemText(queryId);
                if (!text) {
                    return null;
                }
                return this.getSegmentForTextOffset(queryId, offset);
            },
        };
    }

    private getQueryItemText(id: string): string | null {
        const queryItem = this._queriesStoreDelegate.getItemById(id);
        return queryItem ? queryItem.query : null;
    }

    private applyPatch(patch: StatePatch): void {
        if (patch.queryItemUpdates) {
            for (const update of patch.queryItemUpdates) {
                this._queriesStoreDelegate.updateItem(update.id, update.query);
            }
            this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
        }

        if (patch.textSelections !== undefined) {
            this.updateQueryTextSelections(patch.textSelections);
        }

        if (patch.querySelection !== undefined) {
            this._querySelection = patch.querySelection;
            this._pubSubDelegate.notifySubscribers(Topic.QUERY_SELECTION);
        }

        if (patch.selectionMode !== undefined) {
            this.setSelectionMode(patch.selectionMode);
        }
    }

    setSelectionMode(mode: SelectionMode): void {
        this._selectionMode = mode;
        if (mode === "query") {
            this.clearCaretPositions();
        } else {
            this.clearQuerySelection();
        }
    }

    clearQuerySelection(): void {
        this._querySelection = null;
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_SELECTION);
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

    getQueryTextSelections(): QueryTextSelection[] {
        return this._queryTextSelections;
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
            case Topic.QUERY_TEXT_SELECTIONS:
                return () => this._queryTextSelections as TopicPayloads[T];
            case Topic.QUERY_SELECTION:
                return () => this._querySelection as TopicPayloads[T];
            case Topic.SEGMENT_TEXT_SELECTIONS:
                return () => this._segmentTextSelections as TopicPayloads[T];
            case Topic.FOCUSED_SEGMENT:
                return () => this._focusedSegment as TopicPayloads[T];
            case Topic.HAS_FOCUS:
                return () =>
                    (this._queryTextSelections.length > 0) as TopicPayloads[T];
            case Topic.COMPLETION_CONTEXT:
                return () => this._completionContext as TopicPayloads[T];
        }
    }

    processFocusChange(hasFocus: boolean): void {
        const currentlyHasFocus = this._queryTextSelections.length > 0;

        if (hasFocus) {
            // Only set caret position if we don't already have focus
            if (!currentlyHasFocus) {
                this.setCaretPositionToEndOfLastItem();
            }
        } else {
            // Only clear if we currently have focus
            if (currentlyHasFocus) {
                this.clearCaretPositions();
                this.clearQuerySelection();
            }
        }
    }

    private computeSegmentIndex(query: string, focusOffset: number): number {
        const segments = query.split(this._delimiter);
        let accumulatedLength = 0;

        for (let i = 0; i < segments.length; i++) {
            accumulatedLength += segments[i].length;
            if (focusOffset <= accumulatedLength) {
                return i;
            }
            // Account for delimiter length
            accumulatedLength += this._delimiter.length;
        }

        return segments.length - 1;
    }

    private convertToSegmentQueryTextSelection(
        textSelection: QueryTextSelection,
        query: string
    ): SegmentTextSelection {
        const segments = query.split(this._delimiter);
        let accumulatedLength = 0;
        let segmentIndex = 0;
        let segmentFocusOffset = textSelection.focusOffset;
        let segmentAnchorOffset = textSelection.anchorOffset;

        // Find segment for caret offset
        for (let i = 0; i < segments.length; i++) {
            const segmentEnd = accumulatedLength + segments[i].length;
            if (textSelection.focusOffset <= segmentEnd) {
                segmentIndex = i;
                segmentFocusOffset =
                    textSelection.focusOffset - accumulatedLength;
                break;
            }
            accumulatedLength = segmentEnd + this._delimiter.length;
        }

        // Find anchor offset relative to the same segment
        accumulatedLength = 0;
        for (let i = 0; i < segments.length; i++) {
            const segmentEnd = accumulatedLength + segments[i].length;
            if (textSelection.anchorOffset <= segmentEnd) {
                if (i === segmentIndex) {
                    // Anchor is in the same segment
                    segmentAnchorOffset =
                        textSelection.anchorOffset - accumulatedLength;
                } else {
                    // Anchor is in a different segment - collapse to caret position
                    segmentAnchorOffset = segmentFocusOffset;
                }
                break;
            }
            accumulatedLength = segmentEnd + this._delimiter.length;
        }

        return {
            queryId: textSelection.queryId,
            segmentIndex,
            focusOffset: segmentFocusOffset,
            anchorOffset: segmentAnchorOffset,
        };
    }

    updateQueryTextSelections(textSelections: QueryTextSelection[]): void {
        this._queryTextSelections = textSelections;

        // Compute segment-relative positions
        this._segmentTextSelections = textSelections.map((selection) => {
            const queryItem = this._queriesStoreDelegate.getItemById(
                selection.queryId
            );
            if (!queryItem) {
                // Fallback for invalid query ID
                return {
                    queryId: selection.queryId,
                    segmentIndex: 0,
                    focusOffset: selection.focusOffset,
                    anchorOffset: selection.anchorOffset,
                };
            }
            return this.convertToSegmentQueryTextSelection(
                selection,
                queryItem.query
            );
        });

        if (textSelections.length === 1) {
            const queryItem = this._queriesStoreDelegate.getItemById(
                textSelections[0].queryId
            );
            if (!queryItem) {
                throw new Error("Invalid query ID in caret position");
            }
            this._focusedSegment = {
                queryId: textSelections[0].queryId,
                segmentIndex: this.computeSegmentIndex(
                    queryItem.query,
                    textSelections[0].focusOffset
                ),
            };
        } else {
            this._focusedSegment = null;
        }

        this._pubSubDelegate.notifySubscribers(Topic.QUERY_TEXT_SELECTIONS);
        this._pubSubDelegate.notifySubscribers(Topic.SEGMENT_TEXT_SELECTIONS);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
        this._pubSubDelegate.notifySubscribers(Topic.FOCUSED_SEGMENT);
        this.updateCompletionsContext();
    }

    private updateCompletionsContext(): void {
        if (this._queryTextSelections.length !== 1) {
            this._completionContext = null;
            return;
        }

        const queryItem = this._queriesStoreDelegate.getItemById(
            this._queryTextSelections[0].queryId
        );

        if (!queryItem) {
            this._completionContext = null;
            return;
        }

        this._completionContext = {
            queryId: queryItem.id,
            queryItem,
            queryTextSelection: this._queryTextSelections[0],
            segmentIndex: this.computeSegmentIndex(
                queryItem.query,
                this._queryTextSelections[0].focusOffset
            ),
        };

        this._pubSubDelegate.notifySubscribers(Topic.COMPLETION_CONTEXT);
    }

    private getSegmentForTextOffset(
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

    moveFocusToStartOrEnd(where: "start" | "end", selecting: boolean): void {
        if (this._selectionMode !== "text") {
            return;
        }

        const snapshot = this.makeTextSelectionsSnapshot();
        const result =
            this._queryTextSelectionsDelegate.setFocusOffsetToBoundaryOfSegment(
                snapshot,
                { where, selecting }
            );

        if (result.kind === "moved") {
            this.applyPatch(result.patch);
        }
    }

    confirm(): void {}

    moveFocus(dx: number, selecting: boolean): void {
        if (this._selectionMode !== "text") {
            return;
        }

        const snapshot = this.makeTextSelectionsSnapshot();
        const result = this._queryTextSelectionsDelegate.moveFocusOffset(
            snapshot,
            { dx, selecting }
        );

        if (result.kind === "moved") {
            this.applyPatch(result.patch);
            return;
        }

        if (result.kind === "hitBoundary") {
            let queryIndex = this._queriesStoreDelegate.getIndexById(
                result.queryId
            );
            if (queryIndex === -1) {
                return;
            }

            const queryText = this.getQueryItemText(result.queryId);
            if (
                queryText?.split(this._delimiter).length! <= 1 &&
                queryIndex === this._queriesStoreDelegate.getNumItems() - 1 &&
                queryIndex > 0
            ) {
                queryIndex--;
            }

            this.applyPatch({
                selectionMode: "query",
                querySelection: {
                    anchorIndex: queryIndex,
                    focusIndex: queryIndex,
                },
            });
        }
    }

    removeFromQueryAtCaret(direction: "backward" | "forward"): void {
        const snapshot = this.makeTextSelectionsSnapshot();
        const result = this._queryTextSelectionsDelegate.removeAtFocusOffset(
            snapshot,
            { direction }
        );

        if (result.kind === "moved") {
            this.applyPatch(result.patch);
        }
    }

    addQueryItem(query: string): void {
        this._queriesStoreDelegate.addItem(query);
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
    }

    getFocusedQueryItem(): QueryItem | null {
        if (this._queryTextSelections.length !== 1) {
            return null;
        }

        const queryItem = this._queriesStoreDelegate.getItemById(
            this._queryTextSelections[0].queryId
        );
        if (!queryItem) {
            return null;
        }

        return queryItem;
    }

    private maybeParsePastingTextToNewQueries(text: string): boolean {
        if (this._queryTextSelections.length !== 1) {
            return false;
        }

        const caretPosition = this._queryTextSelections[0];
        const queryItem = this._queriesStoreDelegate.getItemById(
            caretPosition.queryId
        );

        if (!queryItem) {
            return false;
        }

        if (queryItem.query.length > 0) {
            return false;
        }

        if (this._queriesStoreDelegate.getLastItem()?.id !== queryItem.id) {
            return false;
        }

        const queries = text.split("\n");
        if (queries.length < 1) {
            return false;
        }

        this._queriesStoreDelegate.removeItem(queryItem.id);

        let newCaretPosition: QueryTextSelection = {
            ...caretPosition,
        };

        for (let i = 0; i < queries.length; i++) {
            const newItem = this._queriesStoreDelegate.addItem(
                queries[i].trim()
            );
            const offset = queries[i].length;
            newCaretPosition = {
                queryId: newItem.id,
                focusOffset: offset,
                anchorOffset: offset,
            };
        }

        this.updateQueryTextSelections([newCaretPosition]);
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
        return true;
    }

    pasteAtCaret(text: string): void {
        if (this.maybeParsePastingTextToNewQueries(text)) {
            return;
        }

        this.insertTextAtCaret(text);
    }

    updateFocusedQueryItem(insertText: string, range?: Range): boolean {
        if (this._queryTextSelections.length !== 1) {
            return false;
        }

        const queryId = this._queryTextSelections[0].queryId;
        const queryItem = this._queriesStoreDelegate.getItemById(queryId);
        if (!queryItem) {
            return false;
        }

        if (!this.updateQueryItem(queryId, insertText, range)) {
            return false;
        }

        const newOffset = range
            ? range.start + insertText.length
            : this._queryTextSelections[0].focusOffset + insertText.length;
        const newCaretPosition: QueryTextSelection = {
            queryId: queryId,
            focusOffset: newOffset,
            anchorOffset: newOffset,
        };
        this.updateQueryTextSelections([newCaretPosition]);
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
            const newCaretPosition: QueryTextSelection = {
                queryId: firstItem.id,
                focusOffset: 0,
                anchorOffset: 0,
            };
            this.updateQueryTextSelections([newCaretPosition]);
        }
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
    }

    setCaretPositionToEndOfQueryItem(id: string): void {
        const queryItem = this._queriesStoreDelegate.getItemById(id);
        if (!queryItem) {
            return;
        }

        const offset = queryItem.query.length;
        const caretPosition: QueryTextSelection = {
            queryId: id,
            focusOffset: offset,
            anchorOffset: offset,
        };

        this.updateQueryTextSelections([caretPosition]);
    }

    setCaretPosition(position: QueryTextSelection): void {
        this.updateQueryTextSelections([position]);
    }

    insertTextAtCaret(text: string): void {
        const snapshot = this.makeTextSelectionsSnapshot();
        const result = this._queryTextSelectionsDelegate.insertAtFocusOffset(
            snapshot,
            { text }
        );

        if (result.kind === "moved") {
            this.applyPatch(result.patch);
        }
    }

    setCaretPositionToEndOfLastItem() {
        const lastItem = this._queriesStoreDelegate.getLastItem();
        if (!lastItem) {
            return;
        }

        const offset = lastItem.query.length;
        const caretPosition: QueryTextSelection = {
            queryId: lastItem.id,
            focusOffset: offset,
            anchorOffset: offset,
        };

        this.setSelectionMode("text");
        this.updateQueryTextSelections([caretPosition]);
    }

    private clearCaretPositions() {
        this._queryTextSelections = [];
        this._segmentTextSelections = [];
        this._focusedSegment = null;
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_TEXT_SELECTIONS);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
        this._pubSubDelegate.notifySubscribers(Topic.FOCUSED_SEGMENT);
    }
}
