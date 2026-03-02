import type { IndexedNode } from "../../core";
import type {
    CompletionItem,
    SyntaxCompletionItem,
} from "../../core/query-language/types/completion";
import type {
    CompletionsAdapter,
    CompletionsAdapterFuncArgs,
    SelectedCompletion,
} from "../interface";
import { SimpleCompletionsComponent } from "./SimpleCompletionsComponent";

export class SimpleCompletionsAdapter implements CompletionsAdapter {
    component = SimpleCompletionsComponent;

    private makeNodeCompletions(
        completions: CompletionItem<IndexedNode>[]
    ): CompletionItem<IndexedNode>[] {
        return completions.filter(
            (comp) => comp.kind === "node"
        ) as CompletionItem<IndexedNode>[];
    }

    private makeSyntaxCompletions(
        completions: CompletionItem<IndexedNode>[]
    ): CompletionItem<IndexedNode>[] {
        return completions.filter((comp) => comp.kind !== "node");
    }

    selectPrevious(args: CompletionsAdapterFuncArgs): number | null {
        const nodeCompletions = this.makeNodeCompletions(args.completions);
        if (nodeCompletions.length === 0) {
            return args.selectedIndex;
        }

        if (args.selectedIndex === null) {
            return null;
        } else {
            return Math.max(args.selectedIndex - 1, -1);
        }
    }

    selectNext(args: CompletionsAdapterFuncArgs): number | null {
        const nodeCompletions = this.makeNodeCompletions(args.completions);
        if (nodeCompletions.length === 0) {
            return args.selectedIndex;
        }

        if (args.selectedIndex === null) {
            if (nodeCompletions.length > 0) {
                return 0;
            }
            return null;
        } else {
            return Math.min(args.selectedIndex + 1, nodeCompletions.length - 1);
        }
    }

    getSelectedCompletion(
        args: CompletionsAdapterFuncArgs
    ): CompletionItem<IndexedNode> | null {
        if (args.selectedIndex === null) {
            return null;
        }

        const range = args.caretContext
            ? {
                  start: args.caretContext.caretOffset,
                  end: args.caretContext.caretOffset,
              }
            : { start: 0, end: 0 };
        if (args.caretContext?.insideGroup) {
            if (args.selectedIndex === -2) {
                const unionCompletion: SyntaxCompletionItem = {
                    label: "+",
                    kind: "unionFlag",
                    insertText: "+",
                    replaceRange: { start: 0, end: 0 },
                    segmentReplaceRange: { start: 0, end: 0 },
                };
                return unionCompletion as CompletionItem<IndexedNode>;
            } else if (args.selectedIndex === -1) {
                const closeGroupCompletion: SyntaxCompletionItem = {
                    label: ")",
                    kind: "group",
                    insertText: ")",
                    replaceRange: range,
                    segmentReplaceRange: range,
                };
                return closeGroupCompletion as CompletionItem<IndexedNode>;
            }
        } else {
            if (args.selectedIndex === -1) {
                const openGroupCompletion: SyntaxCompletionItem = {
                    label: "(",
                    kind: "group",
                    insertText: "(",
                    replaceRange: { start: 0, end: 0 },
                    segmentReplaceRange: { start: 0, end: 0 },
                };
                return openGroupCompletion as CompletionItem<IndexedNode>;
            }
        }

        const nodeCompletions = this.makeNodeCompletions(args.completions);
        const syntaxCompletions = this.makeSyntaxCompletions(args.completions);

        if (args.selectedIndex >= 0) {
            return nodeCompletions[args.selectedIndex] ?? null;
        } else {
            const syntaxIndex = syntaxCompletions.length + args.selectedIndex;
            return syntaxCompletions[syntaxIndex] ?? null;
        }
    }

    hasCompletions(args: CompletionsAdapterFuncArgs): boolean {
        const nodeCompletions = this.makeNodeCompletions(args.completions);
        return nodeCompletions.length > 0;
    }

    transformCompletion(
        completion: CompletionItem<IndexedNode>,
        args: CompletionsAdapterFuncArgs
    ): SelectedCompletion {
        if (completion.kind === "group" && completion.label === "(") {
            return {
                text: completion.label,
                range: completion.replaceRange,
            };
        } else if (completion.kind === "group" && completion.label === ")") {
            const newRange = { ...completion.replaceRange };
            if (args.caretContext?.tokenAt?.type === "OR") {
                newRange.start -= 1;
            }
            return {
                text: completion.label + args.delimiter,
                range: newRange,
            };
        }

        if (completion.kind === "node") {
            const isLeaf =
                completion.origin.kind === "single" &&
                completion.origin.node.isLeaf;
            if (isLeaf) {
                return {
                    text: completion.label,
                    range: completion.replaceRange,
                };
            }
        }

        let suffix = args.delimiter;

        if (args.caretContext?.insideGroup) {
            if (completion.kind == "unionFlag") {
                suffix = "";
            } else {
                suffix = "|";
            }
        }

        return {
            text: completion.label,
            range: completion.replaceRange,
        };
    }
}
