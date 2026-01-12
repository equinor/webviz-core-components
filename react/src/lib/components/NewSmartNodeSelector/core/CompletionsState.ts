import { PubSubDelegate, type PubSub } from "./PubSubDelegate";
import { getCompletions } from "./query-language/completion/completion";
import { evaluateExpression } from "./query-language/evaluator/evaluateExpression";
import { matchName } from "./query-language/matcher/matchName";
import type { ParsedQuery } from "./query-language/parse";
import type { CompletionItem } from "./query-language/types/completion";
import type { TreeAccessor } from "./query-language/types/tree";
import type { IndexedNode } from "./types";

export enum CompletionsTopic {
    COMPLETIONS = "completions",
    SELECTED_INDEX = "selectedIndex",
}

export type CompletionsStateTopicPayloads = {
    [CompletionsTopic.COMPLETIONS]: CompletionItem<IndexedNode>[];
    [CompletionsTopic.SELECTED_INDEX]: number | null;
};

export type CompletionsStateOptions<TNode> = {
    treeAccessor: TreeAccessor<TNode>;
    maxNumCompletions: number;
};

export class CompletionsState<
    TNode,
> implements PubSub<CompletionsStateTopicPayloads> {
    private _pubSubDelegate =
        new PubSubDelegate<CompletionsStateTopicPayloads>();
    private _treeAccessor: TreeAccessor<TNode>;
    private _maxNumCompletions: number;

    private _completions: CompletionItem<TNode>[] = [];
    private _selectedIndex: number | null = null;

    constructor(options: CompletionsStateOptions<TNode>) {
        this._treeAccessor = options.treeAccessor;
        this._maxNumCompletions = options.maxNumCompletions;
    }

    getPubSubDelegate(): PubSubDelegate<CompletionsStateTopicPayloads> {
        return this._pubSubDelegate;
    }

    makeSnapshotGetter<T extends keyof CompletionsStateTopicPayloads>(
        topic: T
    ): () => CompletionsStateTopicPayloads[T] {
        switch (topic) {
            case CompletionsTopic.COMPLETIONS:
                return () =>
                    this._completions as CompletionsStateTopicPayloads[T];
            case CompletionsTopic.SELECTED_INDEX:
                return () =>
                    this._selectedIndex as CompletionsStateTopicPayloads[T];
        }
    }

    getCompletions(): CompletionItem<TNode>[] {
        return this._completions;
    }

    getSelectedIndex(): number | null {
        return this._selectedIndex;
    }

    getSelectedCompletion(): CompletionItem<TNode> | null {
        if (
            this._selectedIndex === null ||
            this._selectedIndex >= this._completions.length
        ) {
            return null;
        }
        return this._completions[this._selectedIndex];
    }

    hasSuggestions(): boolean {
        return this._completions.length > 0;
    }

    /**
     * Update completions for the given query and segment index.
     * Called by input handlers when the focused segment changes.
     */
    updateCompletions(parsedQuery: ParsedQuery, caretOffset: number): void {
        this._completions = getCompletions<TNode>(
            parsedQuery,
            caretOffset,
            this._treeAccessor,
            matchName,
            evaluateExpression
        );

        // Reset selected index when completions change
        this._selectedIndex = null;

        this._pubSubDelegate.notifySubscribers(CompletionsTopic.COMPLETIONS);
        this._pubSubDelegate.notifySubscribers(CompletionsTopic.SELECTED_INDEX);
    }

    /**
     * Clear all suggestions.
     * Called by input handlers when focus is lost or no segment is focused.
     */
    clearCompletions(): void {
        if (this._completions.length > 0 || this._selectedIndex !== null) {
            this._completions = [];
            this._selectedIndex = null;
            this._pubSubDelegate.notifySubscribers(
                CompletionsTopic.COMPLETIONS
            );
            this._pubSubDelegate.notifySubscribers(
                CompletionsTopic.SELECTED_INDEX
            );
        }
    }

    selectNext(): void {
        if (this._completions.length === 0) {
            return;
        }

        if (this._selectedIndex === null) {
            this._selectedIndex = 0;
        } else {
            this._selectedIndex = Math.min(
                this._selectedIndex + 1,
                this._completions.length - 1
            );
        }
        this._pubSubDelegate.notifySubscribers(CompletionsTopic.SELECTED_INDEX);
    }

    selectPrevious(): void {
        if (this._completions.length === 0) {
            return;
        }

        if (this._selectedIndex === null) {
            this._selectedIndex = this._completions.length - 1;
        } else {
            this._selectedIndex = Math.max(this._selectedIndex - 1, 0);
        }
        this._pubSubDelegate.notifySubscribers(CompletionsTopic.SELECTED_INDEX);
    }

    clearSelection(): void {
        if (this._selectedIndex !== null) {
            this._selectedIndex = null;
            this._pubSubDelegate.notifySubscribers(
                CompletionsTopic.SELECTED_INDEX
            );
        }
    }
}
