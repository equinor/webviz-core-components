import type { IndexedNode } from "../../core";
import type { CompletionItem } from "../../core/query-language/types/completion";
import type {
    CompletionsAdapter,
    CompletionsAdapterFuncArgs,
    SelectedCompletion,
} from "../interface";
import { AdvancedCompletionComponent } from "./AdvancedCompletionComponent";

export class AdvancedCompletionAdapter implements CompletionsAdapter {
    component = AdvancedCompletionComponent;

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
        const syntaxCompletions = this.makeSyntaxCompletions(args.completions);
        if (nodeCompletions.length + syntaxCompletions.length === 0) {
            return args.selectedIndex;
        }

        if (args.selectedIndex === null) {
            return nodeCompletions.length - 1;
        } else {
            return Math.max(args.selectedIndex - 1, -syntaxCompletions.length);
        }
    }

    selectNext(args: CompletionsAdapterFuncArgs): number | null {
        const nodeCompletions = this.makeNodeCompletions(args.completions);
        const syntaxCompletions = this.makeSyntaxCompletions(args.completions);
        if (nodeCompletions.length + syntaxCompletions.length === 0) {
            return args.selectedIndex;
        }

        if (args.selectedIndex === null) {
            if (nodeCompletions.length > 0) {
                return 0;
            } else {
                return -1;
            }
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
        completion: CompletionItem<IndexedNode>
    ): SelectedCompletion {
        // Implementation to transform a completion item
        return {
            text: completion.insertText,
            range: completion.replaceRange,
        };
    }
}
