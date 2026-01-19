import type { Range } from "../../utils/range";
import { matchWithHole, type MatchOptions } from "../matcher/matchesName";
import type { CompletionItem } from "../types/completion";
import type { TreeAccessor } from "../types/tree";
import type { CaretContext } from "./caretContext";
import {
    findEnclosingGroupOrSet,
    findNearestOrRhsContext,
    getExistingKeysFromOrLeft,
    getExistingOptionKeys,
} from "./existingOptions";
import { normalizeKey } from "./normalizeKey";

export function getTreeCompletions<Node>(
    context: CaretContext,
    pool: Iterable<Node>,
    tree: TreeAccessor<Node>,
    opts?: MatchOptions
): CompletionItem<Node>[] {
    const completions: CompletionItem<Node>[] = [];
    const segmentAst = context.segmentAst;

    if (segmentAst.kind !== "expr") {
        return completions;
    }

    // Compute existing options in the enclosing scope
    const scope = findEnclosingGroupOrSet(segmentAst.expr, context.caretOffset);
    let existingKeys = scope ? getExistingOptionKeys(scope) : new Set<string>();

    if (existingKeys.size === 0) {
        const orCtx = findNearestOrRhsContext(
            segmentAst.expr,
            context.caretOffset
        );
        if (orCtx) {
            existingKeys = getExistingKeysFromOrLeft(orCtx);
        }
    }

    // Dedupe by the grouping by insertText
    const groups = new Map<string, { nodes: Node[]; span: Range }>();

    for (const node of pool) {
        const name = tree.getName(node);

        const span = matchWithHole(
            segmentAst.expr,
            context.caretOffset,
            name,
            opts
        );
        if (!span) {
            continue;
        }

        // When case-insensitive, use the full name to replace what the user typed
        // with the correctly-cased version. Otherwise use just the hole portion.
        const insertText = opts?.caseInsensitive
            ? name
            : name.slice(span.start, span.end);
        if (insertText.length === 0) {
            continue;
        }

        // Skip whitespace-only insert texts
        if (insertText.trim().length === 0) {
            continue;
        }

        const key = normalizeKey(insertText);
        if (existingKeys.has(key)) {
            continue;
        }

        const group = groups.get(insertText);
        if (group) {
            group.nodes.push(node);
            continue;
        } else {
            groups.set(insertText, { nodes: [node], span });
        }
    }

    // When case-insensitive, we need to replace the literal text the user typed
    // with the correctly-cased full name. Find the range of literal tokens to replace.
    // Only consider tokens in the current "branch" (after the last OR operator before caret).
    let replaceRange: Range = context.replaceRange;
    if (opts?.caseInsensitive) {
        // Find the last OR token before the caret position
        let lastOrIndex = -1;
        for (let i = 0; i < context.segmentTokens.length; i++) {
            const token = context.segmentTokens[i];
            if (
                token.type === "OR" &&
                token.charRange.end <= context.caretOffset
            ) {
                lastOrIndex = i;
            }
        }

        // Find literal tokens after the last OR (or from the beginning if no OR)
        const tokensInBranch = context.segmentTokens.slice(lastOrIndex + 1);
        const literalTokens = tokensInBranch.filter(
            (t) =>
                t.type === "LITERAL" &&
                t.charRange.start <= context.caretOffset
        );

        if (literalTokens.length > 0) {
            const firstLiteral = literalTokens[0];
            const lastLiteral = literalTokens[literalTokens.length - 1];
            replaceRange = {
                start: firstLiteral.charRange.start,
                end: lastLiteral.charRange.end,
            };
        }
    }
    const segmentReplaceRange: Range = {
        start: replaceRange.start - segmentAst.charRange.start,
        end: replaceRange.end - segmentAst.charRange.start,
    };

    for (const [insertText, { nodes, span }] of groups) {
        if (nodes.length === 1) {
            const node = nodes[0];
            completions.push({
                label: insertText,
                insertText,
                replaceRange,
                segmentReplaceRange,
                kind: "node",
                origin: { kind: "single", node, nodeNameRange: span },
            });
        } else {
            completions.push({
                label: insertText,
                insertText,
                replaceRange,
                segmentReplaceRange,
                kind: "node",
                origin: {
                    kind: "multi",
                    nodes: new Set(nodes),
                    count: nodes.length,
                },
            });
        }
    }

    return completions;
}
