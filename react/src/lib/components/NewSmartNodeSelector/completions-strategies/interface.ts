import type { CompletionsSelectionMode } from "../core/CompletionsState";
import type { CaretContext } from "../core/query-language/completion/caretContext";
import type { CompletionItem } from "../core/query-language/types/completion";
import type { Range } from "../core/utils/range";

export type CompletionStrategyStateUpdater<TState> =
    | TState
    | ((prev: TState) => TState);

export type QueryContext = {
    segmentCount: number;
};

export type CompletionStrategyContext<Node> = {
    completions: CompletionItem<Node>[];
    caretContext: CaretContext | null;
    queryContext: QueryContext;
    delimiter: string;
    currentSegmentSelections: Node[];
    selectionMode: CompletionsSelectionMode;
};

export type CompletionStrategyRuntimeArgs<Node, TState> =
    CompletionStrategyContext<Node> & {
        state: TState;
    };

export type CompletionStrategyReconcileArgs<Node, TState> =
    CompletionStrategyContext<Node> & {
        prevState: TState | null;
    };

export type CompletionStrategyKeyResult<TState> = {
    nextState?: TState;
    accept?: boolean;
    close?: boolean;
    focusEditor?: boolean;
};

export type SelectedCompletion = {
    text: string;
    range: Range;
    moveCaretTo?: number;
    moveFocus?: boolean;
};

export type CompletionStrategyComponentProps<Node, TState> =
    CompletionStrategyRuntimeArgs<Node, TState> & {
        maxContainerHeight: number;
        currentSegmentSelections: Node[];

        setState: (updater: CompletionStrategyStateUpdater<TState>) => void;
        accept: () => void;
        close: () => void;
    };

export interface CompletionStrategy<Node, TState> {
    reconcileState(args: CompletionStrategyReconcileArgs<Node, TState>): TState;

    onKeyDown(
        event: React.KeyboardEvent<HTMLElement>,
        args: CompletionStrategyRuntimeArgs<Node, TState>
    ): CompletionStrategyKeyResult<TState>;

    getAppliedCompletion(
        args: CompletionStrategyRuntimeArgs<Node, TState>
    ): SelectedCompletion | null;

    component: React.ComponentType<
        CompletionStrategyComponentProps<Node, TState>
    >;
}
