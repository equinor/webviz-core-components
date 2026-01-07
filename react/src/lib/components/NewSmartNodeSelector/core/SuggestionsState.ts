import { PubSubDelegate, type PubSub } from "./PubSubDelegate";
import {
    getCompletions,
    type CompletionItem,
} from "./query-language/types/completion";
import type { QueryItem } from "./StateManager/types";
import { makeIndexedNodeAccessor, type BuildResult } from "./TreeIndexBuilder";
import type { TreeAccessor } from "./query-language/types/tree";
import type { IndexedNode } from "./types";
import { matchName } from "./query-language/matcher";
import { evaluateExpression } from "./query-language/evaluator/evaluateExpression";

export enum SuggestionsTopic {
    SUGGESTIONS = "suggestions",
    SELECTED_INDEX = "selectedIndex",
}

export type SuggestionsTopicPayloads = {
    [SuggestionsTopic.SUGGESTIONS]: CompletionItem[];
    [SuggestionsTopic.SELECTED_INDEX]: number | null;
};

export type SuggestionsStateOptions = {
    buildResult: BuildResult;
    maxSuggestions: number;
};

export class SuggestionsState implements PubSub<SuggestionsTopicPayloads> {
    private _pubSubDelegate = new PubSubDelegate<SuggestionsTopicPayloads>();
    private _treeAccessor: TreeAccessor<IndexedNode>;
    private _maxSuggestions: number;

    private _completions: CompletionItem[] = [];
    private _selectedIndex: number | null = null;

    constructor(options: SuggestionsStateOptions) {
        this._treeAccessor = makeIndexedNodeAccessor(options.buildResult);
        this._maxSuggestions = options.maxSuggestions;
    }

    getPubSubDelegate(): PubSubDelegate<SuggestionsTopicPayloads> {
        return this._pubSubDelegate;
    }

    makeSnapshotGetter<T extends keyof SuggestionsTopicPayloads>(
        topic: T
    ): () => SuggestionsTopicPayloads[T] {
        switch (topic) {
            case SuggestionsTopic.SUGGESTIONS:
                return () => this._completions as SuggestionsTopicPayloads[T];
            case SuggestionsTopic.SELECTED_INDEX:
                return () => this._selectedIndex as SuggestionsTopicPayloads[T];
        }
    }

    getSuggestions(): CompletionItem[] {
        return this._completions;
    }

    getSelectedIndex(): number | null {
        return this._selectedIndex;
    }

    getSelectedSuggestion(): CompletionItem | null {
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
     * Update suggestions for the given query and segment index.
     * Called by input handlers when the focused segment changes.
     */
    updateSuggestions(queryItem: QueryItem, caretOffset: number): void {
        this._completions = getCompletions(
            queryItem.parsedQuery,
            caretOffset,
            this._treeAccessor,
            matchName,
            evaluateExpression
        );

        // Reset selected index when suggestions change
        this._selectedIndex = null;

        this._pubSubDelegate.notifySubscribers(SuggestionsTopic.SUGGESTIONS);
        this._pubSubDelegate.notifySubscribers(SuggestionsTopic.SELECTED_INDEX);
    }

    /**
     * Clear all suggestions.
     * Called by input handlers when focus is lost or no segment is focused.
     */
    clearSuggestions(): void {
        if (this._completions.length > 0 || this._selectedIndex !== null) {
            this._completions = [];
            this._selectedIndex = null;
            this._pubSubDelegate.notifySubscribers(
                SuggestionsTopic.SUGGESTIONS
            );
            this._pubSubDelegate.notifySubscribers(
                SuggestionsTopic.SELECTED_INDEX
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
        this._pubSubDelegate.notifySubscribers(SuggestionsTopic.SELECTED_INDEX);
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
        this._pubSubDelegate.notifySubscribers(SuggestionsTopic.SELECTED_INDEX);
    }

    clearSelection(): void {
        if (this._selectedIndex !== null) {
            this._selectedIndex = null;
            this._pubSubDelegate.notifySubscribers(
                SuggestionsTopic.SELECTED_INDEX
            );
        }
    }
}
