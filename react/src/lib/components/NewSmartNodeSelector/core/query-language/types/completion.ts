import type { Atom, Expr } from "../ast/ast";
import { getCaretContext, type CaretContext } from "../completion/caretContext";
import { collectAllChildren, collectAllDescendants } from "../evaluator/_utils";
import { evaluatePrefix } from "../evaluator/evaluatePrefix";
import type { ParsedQuery } from "../parse";
import type { Range } from "./range";
import type { TreeAccessor } from "./tree";

export type CompletionItem = {
    label: string;
    insertText: string;
    replaceRange: Range;
    kind: "node" | "operator" | "wildcard" | "group" | "set";
    detail?: string;
};

export function getCompletions<Node>(
    parsed: ParsedQuery,
    caretOffset: number,
    tree: TreeAccessor<Node>,
    matchName: (name: string, atoms: Atom[]) => boolean,
    evaluateExpression: (
        expr: Expr,
        pool: Iterable<Node>,
        tree: TreeAccessor<Node>,
        matchName: (name: string, atoms: Atom[]) => boolean
    ) => Set<Node>
): CompletionItem[] {
    const context = getCaretContext(parsed, caretOffset);

    const { frontier, deepMode } = evaluatePrefix(
        parsed.ast,
        context.segmentIndex,
        tree,
        matchName,
        evaluateExpression
    );

    const pool = deepMode
        ? collectAllDescendants(frontier, tree)
        : collectAllChildren(frontier, tree);

    const result: CompletionItem[] = [];

    // Add syntax-based completions
    result.push(...getSyntaxCompletions(context));

    // Add tree-based completions
    result.push(...getTreeCompletions(context, pool, tree));

    // Deduplicate completions - we can later rank them as well
    return deduplicateCompletions(result);
}

function getSyntaxCompletions(context: CaretContext): CompletionItem[] {
    const completions: CompletionItem[] = [];

    function add(
        label: string,
        insertText = label,
        kind: CompletionItem["kind"] = "operator"
    ) {
        completions.push({
            label,
            insertText,
            replaceRange: context.replaceRange,
            kind,
        });
    }

    switch (context.expectation) {
        case "term":
            add("(", "(", "group");
            add("{", "{", "set");
            add("*", "*", "wildcard");
            add("?", "?", "wildcard");

            if (context.isEmptySegment) {
                add("**", "***", "wildcard");
            }
            break;

        case "operator":
            add("|", "|", "operator");
            add("&", "&", "operator");
            break;

        case "comma":
            add(",", ",", "operator");
            break;

        case "delimiterOrEnd":
            // No specific completions for delimiters or end of segment
            break;
    }

    const topOfStack = context.stack.at(context.stack.length - 1);
    if (topOfStack === "LPAREN") {
        add(")", ")", "group");
    } else if (topOfStack === "LBRACE") {
        add("}", "}", "set");
    }

    return completions;
}

function getTreeCompletions<Node>(
    context: CaretContext,
    pool: Iterable<Node>,
    tree: TreeAccessor<Node>
): CompletionItem[] {
    const completions: CompletionItem[] = [];

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
            });
        }
    }

    return completions;
}

function deduplicateCompletions(
    completions: CompletionItem[]
): CompletionItem[] {
    function makeKey(item: CompletionItem): string {
        return `${item.replaceRange.start}:${item.replaceRange.end}:${item.insertText}:${item.kind}`;
    }

    const seen = new Set<string>();
    const deduplicated: CompletionItem[] = [];

    for (const item of completions) {
        const key = makeKey(item);
        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        deduplicated.push(item);
    }

    return deduplicated;
}
