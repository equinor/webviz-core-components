import type { InputModifier } from "../../input-modifiers/interface";
import { PubSubDelegate, type PubSub } from "../PubSubDelegate";
import { filterPoolByTailSegments } from "../query-language/completion/filterPoolByTailSegments";
import {
    collectAllChildren,
    collectAllDescendants,
    collectCommonChildren,
} from "../query-language/evaluator/_utils";
import { evaluateExpression } from "../query-language/evaluator/evaluateExpression";
import { evaluatePrefix } from "../query-language/evaluator/evaluatePrefix";
import {
    evaluateQuery,
    type EvaluationResult,
} from "../query-language/evaluator/evaluateQuery";
import { matchName } from "../query-language/matcher/matchName";
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
import {
    SegmentSelectionDelegate,
    type SegmentSelectionDelegateSnapshot,
} from "./SegmentSelectionDelegate";
import type {
    CompletionContext,
    QueryItem,
    QuerySegment,
    QuerySelection,
    QueryTextSelection,
    SegmentSelection,
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
    SEGMENT_SELECTION = "segmentSelection",
    COMPLETIONS_POPOVER_FOCUSED = "completionsPopoverFocused",
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
    [Topic.SEGMENT_SELECTION]: SegmentSelection | null;
    [Topic.COMPLETIONS_POPOVER_FOCUSED]: boolean;
};

export type StateManagerOptions = {
    segmentDelimiter: string;
    queryDelimiter: string;
    inputModifier: InputModifier;
};

export class StateManager implements PubSub<TopicPayloads> {
    private _pubSubDelegate = new PubSubDelegate<TopicPayloads>();
    private _queryTextSelectionsDelegate = new QueryTextSelectionsDelegate();
    private _querySelectionDelegate = new QuerySelectionDelegate();
    private _segmentSelectionDelegate = new SegmentSelectionDelegate();

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
    private _segmentSelection: SegmentSelection | null = null;
    private _treeAccessor: TreeAccessor<IndexedNode> | null = null;
    private _parseCache = new Cache<ParsedQuery>();
    private _treeMatchCache = new Cache<EvaluationResult<IndexedNode>>();
    private _completionContext: CompletionContext | null = null;
    private _completionsPopoverFocused: boolean = false;
    private _hasFocus: boolean = false;

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
                return this.getSegmentForTextOffset(text, offset);
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
            this.ensureTrailingEmptyQuery();
            this.ensureValidSelection();
        }

        if (patch.textSelections !== undefined) {
            this.updateQueryTextSelections(patch.textSelections);
            this.setSelectionMode("text");
        }

        if (patch.querySelection !== undefined) {
            this._querySelection = patch.querySelection;
            this.setSelectionMode("query");
            this._pubSubDelegate.notifySubscribers(Topic.QUERY_SELECTION);
        }

        if (patch.segmentSelection !== undefined) {
            this._segmentSelection = patch.segmentSelection;
            if (patch.segmentSelection !== null) {
                this.setSelectionMode("segment");
                this._focusedSegment = {
                    queryId: patch.segmentSelection.queryId,
                    segmentIndex: patch.segmentSelection.focus,
                };
                this._pubSubDelegate.notifySubscribers(Topic.FOCUSED_SEGMENT);
                this._pubSubDelegate.notifySubscribers(Topic.SEGMENT_SELECTION);
                this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
            }
        }

        if (patch.selectionMode !== undefined) {
            this.setSelectionMode(patch.selectionMode);
        }

        this.updateCompletionsContext();
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

        if (this._selectionMode === "segment") {
            if (!this._segmentSelection) {
                return "";
            }
            const { queryId, anchor, focus } = this._segmentSelection;
            const queryItem = this._queriesStoreDelegate.getItemById(queryId);
            if (!queryItem) {
                return "";
            }
            const parsedQuery = this.getParsedQuery(queryItem.query);
            if (!parsedQuery) {
                return "";
            }
            const start = Math.min(anchor, focus);
            const end = Math.max(anchor, focus);
            const segments = parsedQuery.segments.slice(start, end + 1);
            if (segments.length === 0) {
                return "";
            }
            return queryItem.query.slice(
                segments[0].charRange.start,
                segments[segments.length - 1].charRange.end
            );
        }

        throw new Error("Invalid selection mode");
    }

    private ensureAtLeastOneQueryItem(): void {
        if (this._queriesStoreDelegate.getNumItems() === 0) {
            this.addQueryItem("");
        }
    }

    private ensureTrailingEmptyQuery(): void {
        const lastItem = this._queriesStoreDelegate.getLastItem();
        if (!lastItem || lastItem.query === "") {
            return;
        }
        const parsedQuery = this.getParsedQuery(lastItem.query);
        if (!parsedQuery || parsedQuery.segments.length <= 1) {
            return;
        }
        this._queriesStoreDelegate.addItem("");
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_ITEMS);
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
            this.clearSegmentSelection();
        } else if (mode === "segment") {
            this.clearQueryTextSelections();
            this.clearQuerySelection();
        } else {
            this.clearQuerySelection();
            this.clearSegmentSelection();
        }
        this.updateCompletionsContext();
    }

    private clearSegmentSelection(): void {
        if (this._segmentSelection === null) {
            return;
        }
        this._segmentSelection = null;
        this._pubSubDelegate.notifySubscribers(Topic.SEGMENT_SELECTION);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
    }

    clearQuerySelection(): void {
        this._querySelection = null;
        this._pubSubDelegate.notifySubscribers(Topic.QUERY_SELECTION);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
    }

    updateOptions(options: StateManagerOptions): void {
        this._parseCache.clear();
        this._treeMatchCache.clear();
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

    getQueryItemIndexById(id: string): number {
        return this._queriesStoreDelegate.getIndexById(id);
    }

    getQueryItemByIndex(index: number): QueryItem | null {
        return this._queriesStoreDelegate.getItemByIndex(index);
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

    getMatchedNodesForQuerySegment(
        queryId: string,
        segmentIndex: number
    ): EvaluationResult<IndexedNode> | null {
        const queryItem = this._queriesStoreDelegate.getItemById(queryId);
        if (!queryItem) {
            return null;
        }

        let matchedNodes = this._treeMatchCache.getItem(
            `${queryItem.query}::segment${segmentIndex}`
        );
        if (matchedNodes) {
            return matchedNodes;
        }

        const parsedQuery = this.getParsedQuery(queryItem.query);
        if (!parsedQuery || !this._treeAccessor) {
            return null;
        }

        const segment = parsedQuery.segments[segmentIndex];
        if (!segment) {
            return null;
        }

        const textUptoSegment = queryItem.query.slice(0, segment.charRange.end);

        const parsedSegment = parseQuery(textUptoSegment, {
            delimiter: this._options.segmentDelimiter,
        });

        matchedNodes = evaluateQuery(parsedSegment, this._treeAccessor);
        this._treeMatchCache.setItem(
            `${queryItem.query}::segment${segmentIndex}`,
            matchedNodes
        );
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
                        this._querySelection !== null ||
                        this._segmentSelection !== null) as TopicPayloads[T];
            case Topic.COMPLETION_CONTEXT:
                return () => this._completionContext as TopicPayloads[T];
            case Topic.DATA_REVISION:
                return () => this._dataRevision as TopicPayloads[T];
            case Topic.SEGMENT_SELECTION:
                return () => this._segmentSelection as TopicPayloads[T];
            case Topic.COMPLETIONS_POPOVER_FOCUSED:
                return () =>
                    this._completionsPopoverFocused as TopicPayloads[T];
        }
        throw new Error(`Unknown topic: ${topic}`);
    }

    processFocusChange(hasFocus: boolean): void {
        const currentlyHasFocus = this._hasFocus;
        this._hasFocus = hasFocus;

        if (hasFocus) {
            // Only fall back to last item if we don't already have focus AND
            // no selection was set by a prior mousedown handler (e.g. a click
            // on a segment or chip before the textarea received its focus event).
            if (!currentlyHasFocus) {
                const hasActiveSelection =
                    this._queryTextSelections.length > 0 ||
                    this._querySelection !== null ||
                    this._segmentSelection !== null;
                if (!hasActiveSelection) {
                    this.setSegmentFocusOffsetToLastItem();
                }
            }
        } else {
            // Clear all selection states when focus is lost, unless the
            // completions popover currently holds focus (e.g. a NewCompletionsAdapter
            // component with its own interactive input).
            if (currentlyHasFocus && !this._completionsPopoverFocused) {
                this.clearQueryTextSelections();
                this.clearQuerySelection();
                this.clearSegmentSelection();
            }
        }
    }

    setCompletionsPopoverFocused(hasFocus: boolean): void {
        if (this._completionsPopoverFocused === hasFocus) return;
        this._completionsPopoverFocused = hasFocus;
        this._pubSubDelegate.notifySubscribers(
            Topic.COMPLETIONS_POPOVER_FOCUSED
        );
        if (!hasFocus) {
            // Re-notify HAS_FOCUS so HiddenTextarea re-focuses the textarea
            // if we still have an active selection.
            this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
        }
    }

    private computeSegmentIndex(query: string, focusOffset: number): number {
        const parsedQuery = this.getParsedQuery(query);
        if (!parsedQuery || parsedQuery.segments.length === 0) {
            return 0;
        }

        const segments = parsedQuery.segments;
        for (let i = 0; i < segments.length; i++) {
            if (focusOffset <= segments[i].charRange.end) {
                return i;
            }
        }

        return segments.length - 1;
    }

    private convertToSegmentQueryTextSelection(
        textSelection: QueryTextSelection,
        query: string
    ): SegmentTextSelection {
        const parsedQuery = this.getParsedQuery(query);
        if (!parsedQuery || parsedQuery.segments.length === 0) {
            return {
                queryId: textSelection.queryId,
                focusSegmentIndex: 0,
                anchorSegmentIndex: 0,
                focus: textSelection.focus,
                anchor: textSelection.anchor,
            };
        }

        const segments = parsedQuery.segments;
        let focusSegmentIndex = 0;
        let anchorSegmentIndex = 0;
        let segmentFocusOffset = textSelection.focus;
        let segmentAnchorOffset = textSelection.anchor;

        // Find segment for focus offset
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (textSelection.focus <= segment.charRange.end) {
                focusSegmentIndex = i;
                segmentFocusOffset =
                    textSelection.focus - segment.charRange.start;
                break;
            }
        }

        // Find segment for anchor offset
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (textSelection.anchor <= segment.charRange.end) {
                anchorSegmentIndex = i;
                segmentAnchorOffset =
                    textSelection.anchor - segment.charRange.start;
                break;
            }
        }

        return {
            queryId: textSelection.queryId,
            focusSegmentIndex,
            anchorSegmentIndex,
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
                    focusSegmentIndex: 0,
                    anchorSegmentIndex: 0,
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
        let queryItem: QueryItem | null = null;
        let segmentIndex: number | null = null;

        if (this._selectionMode === "query") {
            this._completionContext = null;
            return;
        }

        if (this._selectionMode === "segment") {
            if (!this._segmentSelection) {
                this._completionContext = null;
                return;
            }
            queryItem = this._queriesStoreDelegate.getItemById(
                this._segmentSelection.queryId
            );
            segmentIndex = this._segmentSelection.focus;
        } else if (this._selectionMode === "text") {
            if (this._queryTextSelections.length === 0) {
                this._completionContext = null;
                return;
            }
            queryItem = this._queriesStoreDelegate.getItemById(
                this._queryTextSelections[0].queryId
            );
            segmentIndex = this.computeSegmentIndex(
                queryItem?.query ?? "",
                this._queryTextSelections[0].focus
            );
        }

        if (!queryItem || segmentIndex === null) {
            this._completionContext = null;
            return;
        }

        this._completionContext = {
            queryId: queryItem.id,
            queryItem,
            queryTextSelection: this._queryTextSelections[0],
            segmentIndex,
            selectionMode: this._selectionMode,
        };

        this._pubSubDelegate.notifySubscribers(Topic.COMPLETION_CONTEXT);
    }

    getSegmentForTextOffset(
        query: string,
        offset: number
    ): {
        index: number;
        startOffset: number;
        endOffset: number;
        length: number;
        text: string;
    } {
        const parsedQuery = this.getParsedQuery(query);
        if (!parsedQuery || parsedQuery.segments.length === 0) {
            return {
                index: 0,
                startOffset: 0,
                endOffset: query.length,
                length: query.length,
                text: query,
            };
        }

        const segments = parsedQuery.segments;
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (offset <= segment.charRange.end) {
                return {
                    index: i,
                    startOffset: segment.charRange.start,
                    endOffset: segment.charRange.end,
                    length: segment.charRange.end - segment.charRange.start,
                    text: query.slice(
                        segment.charRange.start,
                        segment.charRange.end
                    ),
                };
            }
        }

        const lastSegment = segments[segments.length - 1];
        return {
            index: segments.length - 1,
            startOffset: lastSegment.charRange.start,
            endOffset: lastSegment.charRange.end,
            length: lastSegment.charRange.end - lastSegment.charRange.start,
            text: query.slice(
                lastSegment.charRange.start,
                lastSegment.charRange.end
            ),
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

            const parsedQuery = this.getParsedQuery(queryItem.query);
            const lastSegmentIndex = Math.max(
                0,
                (parsedQuery?.segments.length ?? 1) - 1
            );
            this.enterSegmentSelection(queryItem.id, lastSegmentIndex);
            return;
        }

        if (this._selectionMode === "segment") {
            if (!this._segmentSelection) {
                return;
            }
            this.setTextFocusOffsetToEndOfSegment(
                this._segmentSelection.queryId,
                this._segmentSelection.focus
            );
            return;
        }

        if (this._selectionMode === "text") {
            const queryId = this._queryTextSelections[0]?.queryId;
            if (queryId === undefined) {
                return;
            }

            const queryItem = this._queriesStoreDelegate.getItemById(queryId);

            if (!queryItem) {
                return;
            }

            const matchedNodes =
                this.getMatchedNodesForQuery(queryItem.query)?.matches ?? [];
            const matchedLeafNodes = Array.from(matchedNodes).filter(
                (node) => node.isLeaf
            );

            if (matchedLeafNodes.length > 0) {
                this.setTextFocusOffsetToEndOfLastItem();
                return;
            }

            const segmentIndex = this.computeSegmentIndex(
                queryItem.query,
                this._queryTextSelections[0].focus
            );
            if (
                segmentIndex <
                queryItem.query.split(this._options.segmentDelimiter).length - 1
            ) {
                this.moveFocus(1, false, false);
                return;
            }

            this.insertText(this._options.segmentDelimiter, false);
            return;
        }

        throw new Error("Invalid selection mode");
    }

    exit() {
        if (this._selectionMode === "text") {
            if (this._queryTextSelections.length === 0) {
                this.clearQueryTextSelections();
                return;
            }

            // If there is a focused segment, go back to segment mode first
            if (this._focusedSegment) {
                this.enterSegmentSelection(
                    this._focusedSegment.queryId,
                    this._focusedSegment.segmentIndex
                );
                return;
            }

            const queryIndexRange: Range = {
                start: Number.MAX_SAFE_INTEGER,
                end: Number.MIN_SAFE_INTEGER,
            };

            for (const sel of this._queryTextSelections) {
                const queryIndex = this._queriesStoreDelegate.getIndexById(
                    sel.queryId
                );
                if (queryIndex === -1) {
                    continue;
                }
                if (queryIndex < queryIndexRange.start) {
                    queryIndexRange.start = queryIndex;
                }
                if (queryIndex > queryIndexRange.end) {
                    queryIndexRange.end = queryIndex;
                }
            }

            const patch: StatePatch = {
                selectionMode: "query",
                querySelection: {
                    anchor: queryIndexRange.start,
                    focus: queryIndexRange.end,
                },
            };
            this.applyPatch(patch);
            return;
        }

        if (this._selectionMode === "segment") {
            if (!this._segmentSelection) {
                this.clearSegmentSelection();
                return;
            }
            const queryIndex = this._queriesStoreDelegate.getIndexById(
                this._segmentSelection.queryId
            );
            if (queryIndex === -1) {
                this.clearSegmentSelection();
                return;
            }
            const numQueries = this._queriesStoreDelegate.getNumItems();
            if (queryIndex === numQueries - 1) {
                const lastItem =
                    this._queriesStoreDelegate.getItemByIndex(queryIndex);
                if (lastItem && lastItem.query === "") {
                    // The last placeholder query is not selectable in query mode;
                    // exit directly to unfocused state.
                    this.clearQuerySelection();
                    return;
                }
            }
            this.applyPatch({
                selectionMode: "query",
                querySelection: { anchor: queryIndex, focus: queryIndex },
            });
            return;
        }

        this.clearQuerySelection();
    }

    moveFocus(dx: number, selecting: boolean, keyHoldPressed: boolean): void {
        if (this._selectionMode === "query") {
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

        if (this._selectionMode === "segment") {
            const snapshot = this.makeSegmentSelectionSnapshot();
            const result = this._segmentSelectionDelegate.moveFocus(snapshot, {
                dx,
                selecting,
            });

            if (result.kind === "moved") {
                this.applyPatch(result.patch);
                return;
            }

            if (result.kind === "hitBoundary") {
                if (selecting || keyHoldPressed) {
                    return;
                }

                const queryId = result.queryId;
                const queryIndex =
                    this._queriesStoreDelegate.getIndexById(queryId);
                if (queryIndex === -1) {
                    return;
                }

                this.applyPatch({
                    selectionMode: "query",
                    querySelection: {
                        anchor: queryIndex,
                        focus: queryIndex,
                    },
                });
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
            if (selecting || keyHoldPressed) {
                return;
            }

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

            const parsedQuery = this.getParsedQuery(queryText);
            const numSegments = parsedQuery?.segments.length ?? 1;
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

        if (this._selectionMode === "segment") {
            if (!this._segmentSelection) {
                return;
            }
            const snapshot = this.makeSegmentSelectionSnapshot();
            const result = this._segmentSelectionDelegate.remove(snapshot, {
                direction: direction === "backward" ? -1 : 1,
            });

            if (result.kind === "moved") {
                this.applyPatch(result.patch);
                return;
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
                    this.moveFocus(-1, false, false);
                }
                if (result.boundary === "end" && direction === "forward") {
                    this.moveFocus(1, false, false);
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

        const queries = text
            .split("\n")
            .map((q) => q.trim())
            .filter((q) => q.length > 0);
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

        this.insertText(text, false);
    }

    applyFocusedCompletion(
        insertText: string,
        range: Range,
        moveFocus?: boolean
    ): boolean {
        if (this._selectionMode === "segment" && this._segmentSelection) {
            const { queryId, focus: segmentIndex } = this._segmentSelection;
            if (!this.updateQueryItem(queryId, insertText, range)) {
                return false;
            }
            if (moveFocus) {
                const queryItem =
                    this._queriesStoreDelegate.getItemById(queryId);
                const parsedQuery = queryItem
                    ? this.getParsedQuery(queryItem.query)
                    : null;
                const nextSegmentIndex = segmentIndex + 1;
                if (
                    parsedQuery &&
                    nextSegmentIndex < parsedQuery.segments.length
                ) {
                    this.enterSegmentSelection(queryId, nextSegmentIndex);
                } else {
                    const nextQuery =
                        this._queriesStoreDelegate.getNextItem(queryId);
                    if (nextQuery) {
                        this.enterSegmentSelection(nextQuery.id, 0);
                    } else {
                        this.updateCompletionsContext();
                    }
                }
            } else {
                this.updateCompletionsContext();
            }
            return true;
        }

        if (!this.updateFocusedQueryItem(insertText, range)) {
            return false;
        }

        if (moveFocus && this._queryTextSelections.length === 1) {
            const queryId = this._queryTextSelections[0].queryId;
            const caretOffset = this._queryTextSelections[0].focus;
            const queryItem = this._queriesStoreDelegate.getItemById(queryId);
            const parsedQuery = queryItem
                ? this.getParsedQuery(queryItem.query)
                : null;
            if (parsedQuery) {
                const segmentIndex = parsedQuery.segments.findIndex(
                    (s) =>
                        caretOffset >= s.charRange.start &&
                        caretOffset <= s.charRange.end
                );
                const nextIndex = segmentIndex + 1;
                if (
                    segmentIndex !== -1 &&
                    nextIndex < parsedQuery.segments.length
                ) {
                    this.setTextFocusOffsetToEndOfSegment(queryId, nextIndex);
                }
            }
        }

        return true;
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
        this.ensureTrailingEmptyQuery();
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

    selectAll(): void {
        if (this._selectionMode === "query") {
            const numQueries = this._queriesStoreDelegate.getNumItems();
            if (numQueries === 0) {
                return;
            }

            const selection: QuerySelection = {
                anchor: 0,
                focus: numQueries - 1,
            };

            this.applyPatch({ querySelection: selection });
            return;
        }

        if (this._queryTextSelections.length !== 1) {
            return;
        }

        const queryId = this._queryTextSelections[0].queryId;
        const queryItem = this._queriesStoreDelegate.getItemById(queryId);
        if (!queryItem) {
            return;
        }

        const selection: QueryTextSelection = {
            queryId: queryId,
            focus: queryItem.query.length,
            anchor: 0,
        };

        this.setSelectionMode("text");
        this.updateQueryTextSelections([selection]);
    }

    setQueryTextSelection(selection: QueryTextSelection): void {
        const patch = {
            textSelections: [selection],
        };
        this.applyPatch(patch);
    }

    insertText(text: string, allowModification: boolean = false): void {
        // If in segment mode, switch to text mode at end of current segment first
        if (this._selectionMode === "segment" && this._segmentSelection) {
            this.setTextFocusOffsetToEndOfSegment(
                this._segmentSelection.queryId,
                this._segmentSelection.focus
            );
        }

        const focusedSegment = this.getFocusedSegment();
        let modifiedText = text;
        if (focusedSegment && allowModification) {
            modifiedText = this._options.inputModifier(text, {
                segmentIndex: focusedSegment.segmentIndex,
                delimiter: this._options.segmentDelimiter,
            });
        }
        const snapshot = this.makeTextSelectionsSnapshot();
        const result = this._queryTextSelectionsDelegate.insertAtFocusOffset(
            snapshot,
            { text: modifiedText }
        );

        if (result.kind === "moved") {
            this.applyPatch(result.patch);
        }
    }

    setSegmentFocusOffsetToLastItem() {
        const lastItem = this._queriesStoreDelegate.getLastItem();
        if (!lastItem) {
            return;
        }

        const parsedQuery = this.getParsedQuery(lastItem.query);
        if (!parsedQuery || parsedQuery.segments.length === 0) {
            return;
        }

        const lastSegmentIndex = parsedQuery.segments.length - 1;

        this.setSelectionMode("segment");
        this.enterSegmentSelection(lastItem.id, lastSegmentIndex);
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

    // ── Segment selection ──────────────────────────────────────────────────

    getSelectionMode(): SelectionMode {
        return this._selectionMode;
    }

    getSegmentSelection(): SegmentSelection | null {
        return this._segmentSelection;
    }

    private makeSegmentSelectionSnapshot(): SegmentSelectionDelegateSnapshot {
        return {
            segmentSelection: this._segmentSelection,
            getQueryById: (id: string) =>
                this._queriesStoreDelegate.getItemById(id),
            getQueryIndexById: (id: string) =>
                this._queriesStoreDelegate.getIndexById(id),
            getParsedQuery: (query: string) => this.getParsedQuery(query),
            getSegmentSiblings: (queryId: string, segmentIndex: number) =>
                this.getSegmentSiblings(queryId, segmentIndex),
        };
    }

    enterQuerySelectionAtIndex(index: number): void {
        const numQueries = this._queriesStoreDelegate.getNumItems();
        let selectableIndex = index;
        if (index === numQueries - 1) {
            const lastItem = this._queriesStoreDelegate.getItemByIndex(index);
            if (lastItem && lastItem.query === "") {
                selectableIndex = index - 1;
            }
        }
        if (selectableIndex < 0) {
            return;
        }
        this.applyPatch({
            querySelection: {
                anchor: selectableIndex,
                focus: selectableIndex,
            },
        });
    }

    enterSegmentSelection(queryId: string, segmentIndex: number): void {
        this._segmentSelection = {
            queryId,
            anchor: segmentIndex,
            focus: segmentIndex,
        };
        this.setSelectionMode("segment");
        this._focusedSegment = { queryId, segmentIndex };
        this._pubSubDelegate.notifySubscribers(Topic.SEGMENT_SELECTION);
        this._pubSubDelegate.notifySubscribers(Topic.HAS_FOCUS);
        this._pubSubDelegate.notifySubscribers(Topic.FOCUSED_SEGMENT);
        this.updateCompletionsContext();
    }

    navigateSegment(direction: 1 | -1, keyHoldPressed: boolean): void {
        if (this._selectionMode !== "segment") {
            return;
        }
        const snapshot = this.makeSegmentSelectionSnapshot();
        const result = this._segmentSelectionDelegate.moveFocus(snapshot, {
            dx: direction,
        });

        if (result.kind === "moved") {
            this.applyPatch(result.patch);
        }
    }

    cycleSibling(direction: 1 | -1): void {
        if (this._selectionMode !== "segment") {
            return;
        }
        const snapshot = this.makeSegmentSelectionSnapshot();
        const result = this._segmentSelectionDelegate.cycleSibling(snapshot, {
            direction,
        });
        if (result.kind === "moved") {
            // Clear caches before applying the query-text patch
            this._parseCache.clear();
            this._treeMatchCache.clear();
            this.applyPatch(result.patch);
        }
    }

    getSegmentBrowserInfo(
        queryId: string,
        segmentIndex: number
    ): { siblings: string[]; currentIndex: number } | null {
        const queryItem = this._queriesStoreDelegate.getItemById(queryId);
        if (!queryItem) {
            return null;
        }
        const parsedQuery = this.getParsedQuery(queryItem.query);
        const segment = parsedQuery?.segments[segmentIndex];
        if (!segment) {
            return null;
        }
        const currentText = queryItem.query.slice(
            segment.charRange.start,
            segment.charRange.end
        );
        const siblings = this.getSegmentSiblings(queryId, segmentIndex);
        const currentIndex = siblings.indexOf(currentText);
        return { siblings, currentIndex };
    }

    private setTextFocusOffsetToEndOfSegment(
        queryId: string,
        segmentIndex: number
    ): void {
        const queryItem = this._queriesStoreDelegate.getItemById(queryId);
        if (!queryItem) {
            return;
        }
        const parsedQuery = this.getParsedQuery(queryItem.query);
        if (!parsedQuery) {
            return;
        }
        const segment = parsedQuery.segments[segmentIndex];
        if (!segment) {
            return;
        }
        const caretPosition: QueryTextSelection = {
            queryId,
            focus: segment.charRange.end,
            anchor: segment.charRange.end,
        };
        this.setSelectionMode("text");
        this.updateQueryTextSelections([caretPosition]);
    }

    private getSegmentSiblings(
        queryId: string,
        segmentIndex: number
    ): string[] {
        if (!this._treeAccessor) {
            return [];
        }
        const queryItem = this._queriesStoreDelegate.getItemById(queryId);
        if (!queryItem) {
            return [];
        }

        const parsedQuery = this.getParsedQuery(queryItem.query);
        if (!parsedQuery) {
            return [];
        }

        // Build the child pool exactly as getCompletions does: use evaluatePrefix
        // to get the same frontier + deepMode + unionMode, then apply the same
        // pool-collection strategy. This keeps the sibling set in sync with the
        // completions list (same intersection/union semantics).
        const { frontier, deepMode, unionMode } = evaluatePrefix(
            parsedQuery.ast,
            segmentIndex,
            this._treeAccessor,
            matchName,
            evaluateExpression
        );

        if (frontier.size === 0) {
            return [];
        }

        const childPool = deepMode
            ? collectAllDescendants(frontier, this._treeAccessor)
            : unionMode
              ? collectAllChildren(frontier, this._treeAccessor)
              : collectCommonChildren(frontier, this._treeAccessor);

        // Look-ahead: filter pool to only candidates that satisfy tail segments.
        // Trim trailing empty spans first — an empty last segment (e.g. after typing "Well1/")
        // has no text yet and would prune every candidate if included.
        const currentSegmentAst = parsedQuery.ast.segments[segmentIndex];
        const tailSegments = parsedQuery.ast.segments.slice(segmentIndex + 1);
        while (tailSegments.length > 0) {
            const spanIndex = segmentIndex + 1 + tailSegments.length - 1;
            const span = parsedQuery.segments[spanIndex];
            if (span && span.charRange.start === span.charRange.end) {
                tailSegments.pop();
            } else {
                break;
            }
        }
        const effectivePool =
            tailSegments.length > 0 && currentSegmentAst?.kind === "expr"
                ? filterPoolByTailSegments(
                      childPool,
                      tailSegments,
                      currentSegmentAst.unionMode,
                      this._treeAccessor,
                      matchName,
                      evaluateExpression
                  )
                : childPool;

        // Collect unique names and sort by (length, alpha) to match the order
        // that rankCompletions produces for segment-kind items (textPenalty ≈ length).
        const nameSet = new Set<string>();
        for (const node of effectivePool) {
            nameSet.add(this._treeAccessor.getName(node));
        }
        return [...nameSet].sort((a, b) => {
            if (a.length !== b.length) return a.length - b.length;
            return a < b ? -1 : a > b ? 1 : 0;
        });
    }
}

function selectionToRange(selection: Selection): Range {
    return {
        start: Math.min(selection.anchor, selection.focus),
        end: Math.max(selection.anchor, selection.focus),
    };
}
