import { PubSubDelegate, type PubSub } from "./PubSubDelegate";
import type { CaretContext } from "./query-language/completion/caretContext";
import { getCompletions } from "./query-language/completion/completion";
import { evaluateExpression } from "./query-language/evaluator/evaluateExpression";
import { matchName } from "./query-language/matcher/matchName";
import type { MatchOptions } from "./query-language/matcher/matchesName";
import type { ParsedQuery } from "./query-language/parse";
import type { CompletionItem } from "./query-language/types/completion";
import type { TreeAccessor } from "./query-language/types/tree";
import type {
    CompletionStrategy,
    QueryContext,
    SelectedCompletion,
} from "../completions-strategies/interface";
import type { SelectionMode } from "./StateManager/types";

export type CompletionsSelectionMode = Exclude<SelectionMode, "query">;

export enum CompletionsTopic {
    COMPLETIONS = "nodeCompletions",
    CARET_CONTEXT = "caretContext",
    SESSION_STATE = "sessionState",
}

export type CompletionsStateTopicPayloads<TNode, TState> = {
    [CompletionsTopic.COMPLETIONS]: CompletionItem<TNode>[];
    [CompletionsTopic.CARET_CONTEXT]: CaretContext | null;
    [CompletionsTopic.SESSION_STATE]: TState | null;
};

export type CompletionsStateOptions<TNode, TState> = {
    completionStrategy: CompletionStrategy<TNode, TState>;
    treeAccessor: TreeAccessor<TNode>;
    matchOptions?: MatchOptions;
    delimiter: string;
};

export class CompletionsState<TNode, TState> implements PubSub<
    CompletionsStateTopicPayloads<TNode, TState>
> {
    private _pubSubDelegate = new PubSubDelegate<
        CompletionsStateTopicPayloads<TNode, TState>
    >();

    private _treeAccessor: TreeAccessor<TNode>;
    private _strategy: CompletionStrategy<TNode, TState>;
    private _matchOptions: MatchOptions;
    private _delimiter: string;

    private _completions: CompletionItem<TNode>[] = [];
    private _caretContext: CaretContext | null = null;
    private _queryContext: QueryContext = { segmentCount: 0 };
    private _sessionState: TState | null = null;
    private _currentSegmentSelections: TNode[] = [];
    private _selectionMode: CompletionsSelectionMode = "segment";

    constructor(options: CompletionsStateOptions<TNode, TState>) {
        this._treeAccessor = options.treeAccessor;
        this._strategy = options.completionStrategy;
        this._matchOptions = options.matchOptions ?? {};
        this._delimiter = options.delimiter;
    }

    getPubSubDelegate(): PubSubDelegate<
        CompletionsStateTopicPayloads<TNode, TState>
    > {
        return this._pubSubDelegate;
    }

    makeSnapshotGetter<
        T extends keyof CompletionsStateTopicPayloads<TNode, TState>,
    >(topic: T): () => CompletionsStateTopicPayloads<TNode, TState>[T] {
        switch (topic) {
            case CompletionsTopic.COMPLETIONS:
                return () =>
                    this._completions as CompletionsStateTopicPayloads<
                        TNode,
                        TState
                    >[T];
            case CompletionsTopic.SESSION_STATE:
                return () =>
                    this._sessionState as CompletionsStateTopicPayloads<
                        TNode,
                        TState
                    >[T];
            case CompletionsTopic.CARET_CONTEXT:
                return () =>
                    this._caretContext as CompletionsStateTopicPayloads<
                        TNode,
                        TState
                    >[T];
            default:
                throw new Error(`Unknown topic: ${topic}`);
        }
    }

    getStrategy(): CompletionStrategy<TNode, TState> {
        return this._strategy;
    }

    getSessionState(): TState | null {
        return this._sessionState;
    }

    setSessionState(state: TState): void {
        this._sessionState = state;
        this._pubSubDelegate.notifySubscribers(CompletionsTopic.SESSION_STATE);
    }

    updateSessionState(updater: (prev: TState) => TState): void {
        if (this._sessionState === null) {
            return;
        }

        this._sessionState = updater(this._sessionState);
        this._pubSubDelegate.notifySubscribers(CompletionsTopic.SESSION_STATE);
    }

    getDelimiter(): string {
        return this._delimiter;
    }

    getCompletions(): CompletionItem<TNode>[] {
        return this._completions;
    }

    getCaretContext(): CaretContext | null {
        return this._caretContext;
    }

    getQueryContext(): QueryContext {
        return this._queryContext;
    }

    getCurrentSegmentSelections(): TNode[] {
        return this._currentSegmentSelections;
    }

    getSelectionMode(): CompletionsSelectionMode {
        return this._selectionMode;
    }

    /**
     * Update completions for the given query and segment index.
     * Called by input handlers when the focused segment changes.
     */
    updateCompletions(
        parsedQuery: ParsedQuery,
        caretOffset: number,
        selectionMode: CompletionsSelectionMode,
        currentSegmentSelections: TNode[] = []
    ): void {
        const { completions, caretContext } = getCompletions<TNode>(
            parsedQuery,
            caretOffset,
            this._treeAccessor,
            matchName,
            evaluateExpression,
            this._matchOptions
        );

        this._completions = completions;
        this._caretContext = caretContext;
        this._queryContext = { segmentCount: parsedQuery.segments.length };
        this._currentSegmentSelections = currentSegmentSelections;
        this._selectionMode = selectionMode;

        this._sessionState = this._strategy.reconcileState({
            prevState: this._sessionState,
            completions: this._completions,
            caretContext: this._caretContext,
            queryContext: this._queryContext,
            delimiter: this._delimiter,
            selectionMode: this._selectionMode,
            currentSegmentSelections: this._currentSegmentSelections,
        });

        this._pubSubDelegate.notifySubscribers(CompletionsTopic.COMPLETIONS);
        this._pubSubDelegate.notifySubscribers(CompletionsTopic.SESSION_STATE);
        this._pubSubDelegate.notifySubscribers(CompletionsTopic.CARET_CONTEXT);
    }

    /**
     * Clear all suggestions.
     * Called by input handlers when focus is lost or no segment is focused.
     */
    clearCompletions(): void {
        this._completions = [];
        this._caretContext = null;
        this._sessionState = null;

        this._pubSubDelegate.notifySubscribers(CompletionsTopic.COMPLETIONS);
        this._pubSubDelegate.notifySubscribers(CompletionsTopic.CARET_CONTEXT);
        this._pubSubDelegate.notifySubscribers(CompletionsTopic.SESSION_STATE);
    }

    getAppliedCompletion(): SelectedCompletion | null {
        if (this._sessionState === null) {
            return null;
        }

        return this._strategy.getAppliedCompletion({
            completions: this._completions,
            caretContext: this._caretContext,
            queryContext: this._queryContext,
            delimiter: this._delimiter,
            currentSegmentSelections: this._currentSegmentSelections,
            selectionMode: this._selectionMode,
            state: this._sessionState,
        });
    }
}
