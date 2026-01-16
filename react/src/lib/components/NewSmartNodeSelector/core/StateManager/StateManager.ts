import { PubSubDelegate, type PubSub } from "../PubSubDelegate";
import {
    evaluateQuery,
    type EvaluationResult,
} from "../query-language/evaluator/evaluateQuery";
import { parseQuery, type ParsedQuery } from "../query-language/parse";
import type { TreeAccessor } from "../query-language/types/tree";
import type { IndexedNode } from "../types";
import type { Range } from "../utils/range";
import { Cache } from "./Cache";
import { QueriesStoreDelegate } from "./QueriesStoreDelegate";
import {
    QuerySelectionDelegate,
    type QuerySelectionDelegateSnapshot,
} from "./QuerySelectionDelegate";
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
    Selection,
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
    DATA_REVISION = "dataRevision",
}

export type TopicPayloads = {
    [Topic.HAS_FOCUS]: boolean;
    [Topic.QUERY_ITEMS]: QueryItem[];
    [Topic.QUERY_TEXT_SELECTIONS]: QueryTextSelection[];
    [Topic.QUERY_SELECTION]: QuerySelection | null;
    [Topic.SEGMENT_TEXT_SELECTIONS]: SegmentTextSelection[];
    [Topic.FOCUSED_SEGMENT]: QuerySegment | null;
    [Topic.COMPLETION_CONTEXT]: CompletionContext | null;
    [Topic.DATA_REVISION]: number;
};

export type StateManagerOptions = {
    segmentDelimiter: string;
    queryDelimiter: string;
};

export class StateManager implements PubSub<TopicPayloads> {
    private _pubSubDelegate = new PubSubDelegate<TopicPayloads>();
    private _queryTextSelectionsDelegate = new QueryTextSelectionsDelegate();
    private _querySelectionDelegate = new QuerySelectionDelegate();

    // Settings
    private _options: StateManagerOptions;

    // State
    private _dataRevision: number = 0;
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
        this._options = options;
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

    private makeQuerySelectionSnapshot(): QuerySelectionDelegateSnapshot {
        return {
            querySelection: this._querySelection,
            getNumberOfQueries: (): number => {
                return this._queriesStoreDelegate.getNumItems();
            },
            getQueryItemByIndex: (index: number): QueryItem | null => {
                return this._queriesStoreDelegate.getItemByIndex(index);
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
                if (update.kind === "remove") {
                    this._queriesStoreDelegate.removeItem(update.item.id);
                    continue;
                }
                if (update.kind === "add") {
                    this._queriesStoreDelegate.addItem(update.item.query);
                    continue;
                }
                if (update.kind === "update") {
                    this._queriesStoreDelegate.updateItem(
                        update.item.id,
                        update.item.query
                    );
                    continue;
                }
                throw new Error(
                    `Unknown query item update kind: ${update.kind}`
                );
            }
            this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
            this.ensureAtLeastOneQueryItem();
            this.ensureValidSelection();
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

    getCurrentSelection(): string {
        if (this._selectionMode === "query") {
            if (!this._querySelection) {
                return "";
            }

            const range = selectionToRange(this._querySelection);
            const queryItems = this._queriesStoreDelegate.getItems();
            const selectedQueries = queryItems.slice(
                range.start,
                range.end + 1
            );

            return (
                selectedQueries
                    .map((item) => item.query)
                    .join(this._options.queryDelimiter) +
                this._options.queryDelimiter
            );
        }

        if (this._selectionMode === "text") {
            const selectedTexts: string[] = [];
            for (const sel of this._queryTextSelections) {
                const queryItem = this._queriesStoreDelegate.getItemById(
                    sel.queryId
                );

                if (!queryItem) {
                    continue;
                }

                const range = selectionToRange(sel);
                selectedTexts.push(
                    queryItem.query.slice(range.start, range.end)
                );
            }
            return selectedTexts.join("");
        }

        throw new Error("Invalid selection mode");
    }

    private ensureAtLeastOneQueryItem(): void {
        if (this._queriesStoreDelegate.getNumItems() === 0) {
            this.addQueryItem("");
        }
    }

    private ensureValidSelection(): void {
        if (this._selectionMode === "query") {
            if (!this._querySelection) {
                return;
            }

            // Check if selection is valid
            const numQueries = this._queriesStoreDelegate.getNumItems();
            const { focus: focusIndex, anchor: anchorIndex } =
                this._querySelection;
            const correctedFocusIndex = Math.max(
                0,
                Math.min(focusIndex, numQueries - 1)
            );
            const correctedAnchorIndex = Math.max(
                0,
                Math.min(anchorIndex, numQueries - 1)
            );

            if (this.hasSingleEmptyQueryItem()) {
                this.clearQuerySelection();
                this.setTextFocusOffsetToEndOfLastItem();
                return;
            }

            this.applyPatch({
                querySelection: {
                    focus: correctedFocusIndex,
                    anchor: correctedAnchorIndex,
                },
            });
            return;
        }
    }

    private hasSingleEmptyQueryItem(): boolean {
        if (this._queriesStoreDelegate.getNumItems() !== 1) {
            return false;
        }
        const firstItem = this._queriesStoreDelegate.getFirstItem();
        return firstItem?.query === "";
    }

    setSelectionMode(mode: SelectionMode): void {
        this._selectionMode = mode;
        if (mode === "query") {
            this.clearQueryTextSelections();
        } else {
            this.clearQuerySelection();
        }
    }

    clearQuerySelection(): void {
        this._querySelection = null;
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_SELECTION);
    }

    updateOptions(options: StateManagerOptions): void {
        this._parseCache.clear();
        this._options = options;
    }

    updateTreeAccessor(treeAccessor: TreeAccessor<IndexedNode>): void {
        this._treeMatchCache.clear();
        this._treeAccessor = treeAccessor;
        this.increaseRevisionNumber();
    }

    private increaseRevisionNumber(): void {
        this._dataRevision += 1;
        this._pubSubDelegate.notifySubscribers(Topic.DATA_REVISION);
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

        parsedQuery = parseQuery(query, {
            delimiter: this._options.segmentDelimiter,
        });
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
                    (this._queryTextSelections.length > 0 ||
                        this._querySelection !== null) as TopicPayloads[T];
            case Topic.COMPLETION_CONTEXT:
                return () => this._completionContext as TopicPayloads[T];
            case Topic.DATA_REVISION:
                return () => this._dataRevision as TopicPayloads[T];
        }
    }

    processFocusChange(hasFocus: boolean): void {
        const currentlyHasFocus = this._queryTextSelections.length > 0;

        if (hasFocus) {
            // Only set caret position if we don't already have focus
            if (!currentlyHasFocus) {
                this.setTextFocusOffsetToEndOfLastItem();
            }
        } else {
            // Only clear if we currently have focus
            if (currentlyHasFocus) {
                this.clearQueryTextSelections();
                this.clearQuerySelection();
            }
        }
    }

    private computeSegmentIndex(query: string, focusOffset: number): number {
        const segments = query.split(this._options.segmentDelimiter);
        let accumulatedLength = 0;

        for (let i = 0; i < segments.length; i++) {
            accumulatedLength += segments[i].length;
            if (focusOffset <= accumulatedLength) {
                return i;
            }
            // Account for delimiter length
            accumulatedLength += this._options.segmentDelimiter.length;
        }

        return segments.length - 1;
    }

    private convertToSegmentQueryTextSelection(
        textSelection: QueryTextSelection,
        query: string
    ): SegmentTextSelection {
        const segments = query.split(this._options.segmentDelimiter);
        let accumulatedLength = 0;
        let segmentIndex = 0;
        let segmentFocusOffset = textSelection.focus;
        let segmentAnchorOffset = textSelection.anchor;

        // Find segment for caret offset
        for (let i = 0; i < segments.length; i++) {
            const segmentEnd = accumulatedLength + segments[i].length;
            if (textSelection.focus <= segmentEnd) {
                segmentIndex = i;
                segmentFocusOffset = textSelection.focus - accumulatedLength;
                break;
            }
            accumulatedLength =
                segmentEnd + this._options.segmentDelimiter.length;
        }

        // Find anchor offset relative to the same segment
        accumulatedLength = 0;
        for (let i = 0; i < segments.length; i++) {
            const segmentEnd = accumulatedLength + segments[i].length;
            if (textSelection.anchor <= segmentEnd) {
                if (i === segmentIndex) {
                    // Anchor is in the same segment
                    segmentAnchorOffset =
                        textSelection.anchor - accumulatedLength;
                } else {
                    // Anchor is in a different segment - collapse to caret position
                    segmentAnchorOffset = segmentFocusOffset;
                }
                break;
            }
            accumulatedLength =
                segmentEnd + this._options.segmentDelimiter.length;
        }

        return {
            queryId: textSelection.queryId,
            segmentIndex,
            focus: segmentFocusOffset,
            anchor: segmentAnchorOffset,
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
                    focus: selection.focus,
                    anchor: selection.anchor,
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
                    textSelections[0].focus
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
                this._queryTextSelections[0].focus
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
        const segments = query.split(this._options.segmentDelimiter);
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
            accumulatedLength =
                segmentEnd + this._options.segmentDelimiter.length;
        }
        return {
            index: segments.length - 1,
            startOffset:
                accumulatedLength -
                segments[segments.length - 1].length -
                this._options.segmentDelimiter.length,
            endOffset:
                accumulatedLength - this._options.segmentDelimiter.length,
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

    confirm(): void {
        if (this._selectionMode === "query") {
            const queryIndex = this._querySelection?.focus;
            if (queryIndex === undefined) {
                return;
            }
            const queryItem =
                this._queriesStoreDelegate.getItemByIndex(queryIndex);
            if (!queryItem) {
                return;
            }
            this.setTextFocusOffsetToEndOfQueryItem(queryItem.id);
            return;
        }

        if (this._selectionMode === "text") {
            this.addQueryItem("");
            this.setTextFocusOffsetToEndOfLastItem();
            return;
        }

        throw new Error("Invalid selection mode");
    }

    moveFocus(dx: number, selecting: boolean): void {
        if (this._selectionMode !== "text") {
            const snapshot = this.makeQuerySelectionSnapshot();
            const result = this._querySelectionDelegate.moveFocus(snapshot, {
                dx,
                selecting,
            });

            const numQueries = this._queriesStoreDelegate.getNumItems();

            if (result.kind === "moved") {
                // If we moved to the last query item and the query is empty, change to text mode
                if (result.patch.querySelection?.focus === numQueries - 1) {
                    const lastQueryItem =
                        this._queriesStoreDelegate.getLastItem();
                    if (lastQueryItem && lastQueryItem.query === "") {
                        this.setTextFocusOffsetToEndOfLastItem();
                        return;
                    }
                }
                this.applyPatch(result.patch);
                return;
            }

            if (result.kind === "hitBoundary") {
                return;
            }
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
            if (queryText === null) {
                return;
            }

            const numItems = this._queriesStoreDelegate.getNumItems();

            // If last query item is empty and moving forward, stay in place
            if (
                result.boundary === "end" &&
                queryText === "" &&
                queryIndex === numItems - 1
            ) {
                return;
            }

            // If only query item is empty and moving backward, stay in place
            if (
                result.boundary === "start" &&
                queryText === "" &&
                numItems === 1
            ) {
                return;
            }

            const numSegments = getNumberOfSegments(
                queryText,
                this._options.segmentDelimiter
            );
            if (
                result.boundary === "start" &&
                numSegments <= 1 &&
                queryIndex === numItems - 1 &&
                queryIndex > 0
            ) {
                queryIndex--;
            }

            this.applyPatch({
                selectionMode: "query",
                querySelection: {
                    anchor: queryIndex,
                    focus: queryIndex,
                },
            });
        }
    }

    removeCurrentSelection(direction: "backward" | "forward"): void {
        if (this._selectionMode === "query") {
            const snapshot = this.makeQuerySelectionSnapshot();
            const result = this._querySelectionDelegate.remove(snapshot);

            if (result.kind === "moved") {
                this.applyPatch(result.patch);
            }
            return;
        }

        if (this._selectionMode === "text") {
            const snapshot = this.makeTextSelectionsSnapshot();
            const result =
                this._queryTextSelectionsDelegate.removeAtFocusOffset(
                    snapshot,
                    { direction }
                );

            if (result.kind === "moved") {
                this.applyPatch(result.patch);
                return;
            }

            if (result.kind === "hitBoundary") {
                if (result.boundary === "start" && direction === "backward") {
                    this.moveFocus(-1, false);
                }
                if (result.boundary === "end" && direction === "forward") {
                    this.moveFocus(1, false);
                }
                return;
            }

            return;
        }

        throw new Error("Invalid selection mode");
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
                focus: offset,
                anchor: offset,
            };
        }

        this.updateQueryTextSelections([newCaretPosition]);
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
        return true;
    }

    pasteText(text: string): void {
        if (this.maybeParsePastingTextToNewQueries(text)) {
            return;
        }

        this.insertText(text);
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
            : this._queryTextSelections[0].focus + insertText.length;
        const newCaretPosition: QueryTextSelection = {
            queryId: queryId,
            focus: newOffset,
            anchor: newOffset,
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
                focus: 0,
                anchor: 0,
            };
            this.updateQueryTextSelections([newCaretPosition]);
        }
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
    }

    setTextFocusOffsetToEndOfQueryItem(id: string): void {
        const queryItem = this._queriesStoreDelegate.getItemById(id);
        if (!queryItem) {
            return;
        }

        const offset = queryItem.query.length;
        const caretPosition: QueryTextSelection = {
            queryId: id,
            focus: offset,
            anchor: offset,
        };

        this.setSelectionMode("text");
        this.updateQueryTextSelections([caretPosition]);
    }

    setQueryTextSelection(selection: QueryTextSelection): void {
        this.updateQueryTextSelections([selection]);
    }

    insertText(text: string): void {
        const snapshot = this.makeTextSelectionsSnapshot();
        const result = this._queryTextSelectionsDelegate.insertAtFocusOffset(
            snapshot,
            { text }
        );

        if (result.kind === "moved") {
            this.applyPatch(result.patch);
        }
    }

    setTextFocusOffsetToEndOfLastItem() {
        const lastItem = this._queriesStoreDelegate.getLastItem();
        if (!lastItem) {
            return;
        }

        const offset = lastItem.query.length;
        const caretPosition: QueryTextSelection = {
            queryId: lastItem.id,
            focus: offset,
            anchor: offset,
        };

        this.setSelectionMode("text");
        this.updateQueryTextSelections([caretPosition]);
    }

    private clearQueryTextSelections() {
        this._queryTextSelections = [];
        this._segmentTextSelections = [];
        this._focusedSegment = null;
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_TEXT_SELECTIONS);
        this._pubSubDelegate.notifySubscribers(Topic.SEGMENT_TEXT_SELECTIONS);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
        this._pubSubDelegate.notifySubscribers(Topic.FOCUSED_SEGMENT);
    }
}

function getNumberOfSegments(query: string, delimiter: string): number {
    return query.split(delimiter).length;
}

function selectionToRange(selection: Selection): Range {
    return {
        start: Math.min(selection.anchor, selection.focus),
        end: Math.max(selection.anchor, selection.focus),
    };
}
