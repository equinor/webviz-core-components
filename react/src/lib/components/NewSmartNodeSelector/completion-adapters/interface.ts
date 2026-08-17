import type { IndexedNode } from "../core";
import { QueryAST } from "../core/query-language/ast/ast";
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
    currentSegmentSelections: IndexedNode[];
    onSelectCompletion: (index: number) => void;
    maxContainerHeight: number;
    caretContext: CaretContext | null;
};

export type CompletionsAdapterFuncArgs = {
    completions: CompletionItem<IndexedNode>[];
    selectedIndex: number | null;
    caretContext: CaretContext | null;
    delimiter: string;
};

export interface CompletionsAdapter {
    selectPrevious(args: CompletionsAdapterFuncArgs): number | null;
    selectNext(args: CompletionsAdapterFuncArgs): number | null;
    getSelectedCompletion(
        args: CompletionsAdapterFuncArgs
    ): CompletionItem<IndexedNode> | null;
    transformCompletion(
        completion: CompletionItem<IndexedNode>,
        args: CompletionsAdapterFuncArgs
    ): SelectedCompletion;
    hasCompletions(args: CompletionsAdapterFuncArgs): boolean;
    component: React.ComponentType<CompletionsAdapterComponentProps>;
}

export type NewCompletionsAdapterComponentProps = {
    queryBefore: QueryAST;
    completions: CompletionItem<IndexedNode>[];
};

export interface NewCompletionsAdapter {
    component: React.ComponentType<NewCompletionsAdapterComponentProps>;
    onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
}
