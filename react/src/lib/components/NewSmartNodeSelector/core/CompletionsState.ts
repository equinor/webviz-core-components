import type {
    CompletionsAdapter,
    CompletionsAdapterComponentProps,
    CompletionsAdapterFuncArgs,
    SelectedCompletion,
} from "../completion-adapters/interface";
import { PubSubDelegate, type PubSub } from "./PubSubDelegate";
import type { CaretContext } from "./query-language/completion/caretContext";
import { getCompletions } from "./query-language/completion/completion";
import { evaluateExpression } from "./query-language/evaluator/evaluateExpression";
import { matchName } from "./query-language/matcher/matchName";
import type { ParsedQuery } from "./query-language/parse";
import type { CompletionItem } from "./query-language/types/completion";
import type { TreeAccessor } from "./query-language/types/tree";
import type { IndexedNode } from "./types";

export enum CompletionsTopic {
    COMPLETIONS = "nodeCompletions",
    CARET_CONTEXT = "caretContext",
    SELECTED_INDEX = "selectedIndex",
}

export type CompletionsStateTopicPayloads = {
    [CompletionsTopic.COMPLETIONS]: CompletionItem<IndexedNode>[];
    [CompletionsTopic.CARET_CONTEXT]: CaretContext | null;
    [CompletionsTopic.SELECTED_INDEX]: number | null;
};

export type CompletionsStateOptions<IndexedNode> = {
    completionsAdapter: CompletionsAdapter;
    treeAccessor: TreeAccessor<IndexedNode>;
};

export class CompletionsState implements PubSub<CompletionsStateTopicPayloads> {
    private _pubSubDelegate =
        new PubSubDelegate<CompletionsStateTopicPayloads>();
    private _treeAccessor: TreeAccessor<IndexedNode>;
    private _adapter: CompletionsAdapter;

    private _completions: CompletionItem<IndexedNode>[] = [];
    private _caretContext: CaretContext | null = null;
    private _selectedIndex: number | null = null;

    constructor(options: CompletionsStateOptions<IndexedNode>) {
        this._treeAccessor = options.treeAccessor;
        this._adapter = options.completionsAdapter;
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
            case CompletionsTopic.CARET_CONTEXT:
                return () =>
                    this._caretContext as CompletionsStateTopicPayloads[T];
            default:
                throw new Error(`Unknown topic: ${topic}`);
        }
    }

    getCompletions(): CompletionItem<IndexedNode>[] {
        return this._completions;
    }

    getSelectedIndex(): number | null {
        return this._selectedIndex;
    }

    private makeAdapterArgs(): CompletionsAdapterFuncArgs {
        return {
            completions: this._completions,
            selectedIndex: this._selectedIndex,
            caretContext: this._caretContext,
        };
    }

    getSelectedCompletion(): SelectedCompletion | null {
        const selectedCompletion = this._adapter.getSelectedCompletion(
            this.makeAdapterArgs()
        );
        if (!selectedCompletion) {
            return null;
        }
        return this._adapter.transformCompletion(selectedCompletion);
    }

    hasCompletions(): boolean {
        return this._adapter.hasCompletions(this.makeAdapterArgs());
    }

    transformCompletion(
        completion: CompletionItem<IndexedNode>
    ): SelectedCompletion {
        return this._adapter.transformCompletion(completion);
    }

    /**
     * Update completions for the given query and segment index.
     * Called by input handlers when the focused segment changes.
     */
    updateCompletions(parsedQuery: ParsedQuery, caretOffset: number): void {
        const { completions, caretContext } = getCompletions<IndexedNode>(
            parsedQuery,
            caretOffset,
            this._treeAccessor,
            matchName,
            evaluateExpression
        );

        this._completions = completions;
        this._caretContext = caretContext;

        // Reset selected index when completions change
        this._selectedIndex = null;

        this._pubSubDelegate.notifySubscribers(CompletionsTopic.COMPLETIONS);
        this._pubSubDelegate.notifySubscribers(CompletionsTopic.SELECTED_INDEX);
        this._pubSubDelegate.notifySubscribers(CompletionsTopic.CARET_CONTEXT);
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

    getComponent(): React.ComponentType<CompletionsAdapterComponentProps> {
        return this._adapter.component;
    }

    selectNext(): void {
        this._selectedIndex = this._adapter.selectNext(this.makeAdapterArgs());
        this._pubSubDelegate.notifySubscribers(CompletionsTopic.SELECTED_INDEX);
    }

    selectPrevious(): void {
        this._selectedIndex = this._adapter.selectPrevious(
            this.makeAdapterArgs()
        );
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
