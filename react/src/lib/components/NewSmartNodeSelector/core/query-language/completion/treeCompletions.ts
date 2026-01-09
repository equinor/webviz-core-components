import type { CompletionItem } from "../types/completion";
import type { TreeAccessor } from "../types/tree";
import type { CaretContext } from "./caretContext";

export function getTreeCompletions<Node>(
    context: CaretContext,
    pool: Iterable<Node>,
    tree: TreeAccessor<Node>
): CompletionItem<Node>[] {
    const completions: CompletionItem<Node>[] = [];

    let typedPrefix = "";
    if (context.tokenAt?.type === "LITERAL") {
        const { start } = context.tokenAt.charRange;
        const relativeCaretOffset = Math.max(
            0,
            Math.min(context.caretOffset - start, context.tokenAt.value.length)
        );
        typedPrefix = context.tokenAt.value.slice(0, relativeCaretOffset);
    }

    const prefixLower = typedPrefix.toLowerCase();

    const seen = new Set<string>();
    for (const node of pool) {
        const name = tree.getName(node);
        if (seen.has(name)) {
            continue;
        }

        if (
            typedPrefix.length === 0 ||
            name.toLowerCase().includes(prefixLower)
        ) {
            seen.add(name);
            completions.push({
                label: name,
                insertText: name,
                replaceRange: context.replaceRange,
                kind: "node",
                node,
            });
        }
    }

    return completions;
}
