import type { IndexedNode } from "../core";
import type { CaretContext } from "../core/query-language/completion/caretContext";
import type { CompletionItem } from "../core/query-language/types/completion";
import type { Range } from "../core/utils/range";

export type SelectedCompletion = {
    text: string;
    range: Range;
};

export interface CompletionsAdapterConstructor {
    new (): CompletionsAdapter;
}

export type CompletionsAdapterComponentProps = {
    selectedIndex: number | null;
    completions: CompletionItem<IndexedNode>[];
    onSelectCompletion: (completion: CompletionItem<IndexedNode>) => void;
    maxContainerHeight: number;
    caretContext: CaretContext | null;
};

export type CompletionsAdapterFuncArgs = {
    completions: CompletionItem<IndexedNode>[];
    selectedIndex: number | null;
};

export interface CompletionsAdapter {
    selectPrevious(args: CompletionsAdapterFuncArgs): number | null;
    selectNext(args: CompletionsAdapterFuncArgs): number | null;
    getSelectedCompletion(
        args: CompletionsAdapterFuncArgs
    ): CompletionItem<IndexedNode> | null;
    transformCompletion(
        completion: CompletionItem<IndexedNode>
    ): SelectedCompletion;
    hasCompletions(args: CompletionsAdapterFuncArgs): boolean;
    component: React.ComponentType<CompletionsAdapterComponentProps>;
}
