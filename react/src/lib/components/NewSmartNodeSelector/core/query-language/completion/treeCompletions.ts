import type { Range } from "../../utils/range";
import { matchWithHole } from "../matcher/matchesName";
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
    tree: TreeAccessor<Node>
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

        const span = matchWithHole(segmentAst.expr, context.caretOffset, name);
        if (!span) {
            continue;
        }

        const insertText = name.slice(span.start, span.end);
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

    for (const [insertText, { nodes, span }] of groups) {
        if (nodes.length === 1) {
            const node = nodes[0];
            completions.push({
                label: insertText,
                insertText,
                replaceRange: context.replaceRange,
                segmentReplaceRange: {
                    start:
                        context.replaceRange.start - segmentAst.charRange.start,
                    end: context.replaceRange.end - segmentAst.charRange.start,
                },
                kind: "node",
                origin: { kind: "single", node, nodeNameRange: span },
            });
        } else {
            completions.push({
                label: insertText,
                insertText,
                replaceRange: context.replaceRange,
                segmentReplaceRange: {
                    start:
                        context.replaceRange.start - segmentAst.charRange.start,
                    end: context.replaceRange.end - segmentAst.charRange.start,
                },
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
