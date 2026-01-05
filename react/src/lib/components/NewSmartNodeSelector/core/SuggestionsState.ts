import { PubSubDelegate, type PubSub } from "./PubSubDelegate";
import type { Suggestion } from "./types/Suggestion";
import type { SuggestionEngine } from "./SuggestionEngine";

export enum SuggestionsTopic {
    SUGGESTIONS = "suggestions",
    SELECTED_INDEX = "selectedIndex",
}

export type SuggestionsTopicPayloads = {
    [SuggestionsTopic.SUGGESTIONS]: Suggestion[];
    [SuggestionsTopic.SELECTED_INDEX]: number | null;
};

export type SuggestionsStateOptions = {
    suggestionEngine: SuggestionEngine;
    maxSuggestions: number;
};

export class SuggestionsState implements PubSub<SuggestionsTopicPayloads> {
    private _pubSubDelegate = new PubSubDelegate<SuggestionsTopicPayloads>();
    private _suggestionEngine: SuggestionEngine;
    private _maxSuggestions: number;

    private _suggestions: Suggestion[] = [];
    private _selectedIndex: number | null = null;

    constructor(options: SuggestionsStateOptions) {
        this._suggestionEngine = options.suggestionEngine;
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
                return () => this._suggestions as SuggestionsTopicPayloads[T];
            case SuggestionsTopic.SELECTED_INDEX:
                return () => this._selectedIndex as SuggestionsTopicPayloads[T];
        }
    }

    getSuggestions(): Suggestion[] {
        return this._suggestions;
    }

    getSelectedIndex(): number | null {
        return this._selectedIndex;
    }

    getSelectedSuggestion(): Suggestion | null {
        if (
            this._selectedIndex === null ||
            this._selectedIndex >= this._suggestions.length
        ) {
            return null;
        }
        return this._suggestions[this._selectedIndex];
    }

    hasSuggestions(): boolean {
        return this._suggestions.length > 0;
    }

    /**
     * Update suggestions for the given query and segment index.
     * Called by input handlers when the focused segment changes.
     */
    updateSuggestions(query: string, segmentIndex: number): void {
        this._suggestions = this._suggestionEngine.getSuggestions(
            query,
            segmentIndex,
            this._maxSuggestions
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
        if (this._suggestions.length > 0 || this._selectedIndex !== null) {
            this._suggestions = [];
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
        if (this._suggestions.length === 0) {
            return;
        }

        if (this._selectedIndex === null) {
            this._selectedIndex = 0;
        } else {
            this._selectedIndex = Math.min(
                this._selectedIndex + 1,
                this._suggestions.length - 1
            );
        }
        this._pubSubDelegate.notifySubscribers(SuggestionsTopic.SELECTED_INDEX);
    }

    selectPrevious(): void {
        if (this._suggestions.length === 0) {
            return;
        }

        if (this._selectedIndex === null) {
            this._selectedIndex = this._suggestions.length - 1;
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
