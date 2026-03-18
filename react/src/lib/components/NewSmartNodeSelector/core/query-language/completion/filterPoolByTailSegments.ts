import type { Atom, Expr, Segment } from "../ast/ast";
import {
    collectAllChildren,
    collectAllDescendants,
    collectCommonChildren,
} from "../evaluator/_utils";
import type { TreeAccessor } from "../types/tree";

/**
 * Filters the pool to only keep candidates that lead to valid matches
 * when the tail segments are applied against the tree.
 *
 * Used for look-ahead filtering in completions: when a query has further
 * segments after the current editing position, only offer completions that
 * lead to complete valid paths.
 */
export function filterPoolByTailSegments<Node>(
    pool: Set<Node>,
    tailSegments: Segment[],
    currentSegmentUnionMode: boolean,
    tree: TreeAccessor<Node>,
    matchName: (name: string, atoms: Atom[]) => boolean,
    evaluateExpression: (
        expr: Expr,
        pool: Iterable<Node>,
        tree: TreeAccessor<Node>,
        matchName: (name: string, atoms: Atom[]) => boolean
    ) => Set<Node>
): Set<Node> {
    if (tailSegments.length === 0) {
        return pool;
    }

    const filtered = new Set<Node>();
    for (const candidate of pool) {
        if (
            candidateMatchesTail(
                candidate,
                tailSegments,
                currentSegmentUnionMode,
                tree,
                matchName,
                evaluateExpression
            )
        ) {
            filtered.add(candidate);
        }
    }
    return filtered;
}

function candidateMatchesTail<Node>(
    candidate: Node,
    tailSegments: Segment[],
    currentSegmentUnionMode: boolean,
    tree: TreeAccessor<Node>,
    matchName: (name: string, atoms: Atom[]) => boolean,
    evaluateExpression: (
        expr: Expr,
        pool: Iterable<Node>,
        tree: TreeAccessor<Node>,
        matchName: (name: string, atoms: Atom[]) => boolean
    ) => Set<Node>
): boolean {
    let frontier = new Set<Node>([candidate]);
    let previousUnionMode = currentSegmentUnionMode;
    let deepMode = false;

    for (const segment of tailSegments) {
        if (segment.kind === "deep") {
            deepMode = true;
            continue;
        }

        const childPool = deepMode
            ? collectAllDescendants(frontier, tree)
            : previousUnionMode
              ? collectAllChildren(frontier, tree)
              : collectCommonChildren(frontier, tree);

        frontier = evaluateExpression(segment.expr, childPool, tree, matchName);
        previousUnionMode = segment.unionMode;
        deepMode = false;

        if (frontier.size === 0) {
            return false;
        }
    }

    return true;
}
