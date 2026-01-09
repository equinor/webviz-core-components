import type { Atom, Expr } from "../ast/ast";
import {
    collectAllChildren,
    collectAllDescendants,
    collectCommonChildren,
} from "../evaluator/_utils";
import { evaluatePrefix } from "../evaluator/evaluatePrefix";
import type { ParsedQuery } from "../parse";
import type { CompletionItem } from "../types/completion";
import type { TreeAccessor } from "../types/tree";
import { getCaretContext, type CaretContext } from "./caretContext";
import { rankCompletions } from "./ranking";
import { getTreeCompletions } from "./treeCompletions";

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
): CompletionItem<Node>[] {
    const context = getCaretContext(parsed, caretOffset);

    const { frontier, deepMode, unionMode } = evaluatePrefix(
        parsed.ast,
        context.segmentIndex,
        tree,
        matchName,
        evaluateExpression
    );

    const pool = deepMode
        ? collectAllDescendants(frontier, tree)
        : unionMode
          ? collectAllChildren(frontier, tree)
          : collectCommonChildren(frontier, tree);

    const all: CompletionItem<Node>[] = [];

    // Add syntax-based completions
    all.push(...getSyntaxCompletions<Node>(context));

    // Add tree-based completions
    all.push(...getTreeCompletions<Node>(context, pool, tree));

    // Deduplicate completions - we can later rank them as well
    const deduped = dedupeCompletions(all);
    return rankCompletions(deduped, context.expectation);
}

function getSyntaxCompletions<Node>(
    context: CaretContext
): CompletionItem<Node>[] {
    const completions: CompletionItem<Node>[] = [];

    function add(
        label: string,
        insertText = label,
        kind: CompletionItem<Node>["kind"] = "operator"
    ) {
        if (kind === "node") {
            throw new Error("Node completions cannot be added via syntax");
        }
        completions.push({
            label,
            insertText,
            replaceRange: context.replaceRange,
            segmentReplaceRange: {
                start:
                    context.replaceRange.start -
                    context.segmentAst.charRange.start,
                end:
                    context.replaceRange.end -
                    context.segmentAst.charRange.start,
            },
            kind,
        });
    }

    switch (context.expectation) {
        case "term":
            if (context.isEmptySegment) {
                add("+", "+", "unionFlag");
            }
            add("(", "(", "group");
            if (!context.insideSet) {
                add("{", "{", "set");
            }
            add("*", "*", "wildcard");
            add("?", "?", "wildcard");

            if (context.isEmptySegment) {
                add("**", "**", "wildcard");
            }
            break;

        case "operator":
            add("|", "|", "operator");
            break;

        case "comma":
            if (!context.insideSet) {
                break;
            }
            add(",", ",", "operator");
            break;

        case "delimiterOrEnd":
            // No specific completions for delimiters or end of segment
            break;
    }

    const topOfStack = context.stack.at(context.stack.length - 1);
    if (topOfStack?.type === "LPAREN" && topOfStack?.refTokenId === undefined) {
        add(")", ")", "group");
    } else if (
        topOfStack?.type === "LBRACE" &&
        topOfStack?.refTokenId === undefined
    ) {
        add("}", "}", "set");
    }

    return completions;
}

function dedupeCompletions<Node>(
    completions: CompletionItem<Node>[]
): CompletionItem<Node>[] {
    function makeKey(item: CompletionItem<Node>): string {
        return `${item.replaceRange.start}:${item.replaceRange.end}:${item.insertText}:${item.kind}`;
    }

    const seen = new Set<string>();
    const deduplicated: CompletionItem<Node>[] = [];

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
