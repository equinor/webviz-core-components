import type { Atom, Expr, QueryAST } from "../ast/ast";
import type { TreeAccessor } from "../types/tree";
import {
    collectAllChildren,
    collectAllDescendants,
    collectCommonChildren,
} from "./_utils";

export function evaluatePrefix<Node>(
    ast: QueryAST,
    stopBeforeSegmentIndex: number,
    tree: TreeAccessor<Node>,
    matchName: (name: string, atoms: Atom[]) => boolean,
    evaluateExpression: (
        expr: Expr,
        pool: Iterable<Node>,
        tree: TreeAccessor<Node>,
        matchName: (name: string, atoms: Atom[]) => boolean
    ) => Set<Node>
): { frontier: Set<Node>; deepMode: boolean; unionMode: boolean } {
    // Start from all roots in the tree
    // Frontier is the set of nodes to evaluate the next segment on
    let frontier = new Set<Node>([tree.getRoot()]);

    // Deep mode is used for '**' segments that can match any number of levels
    let deepMode = false;

    // Track union mode from previous segment to apply when collecting children for next segment
    let previousUnionMode = false;

    for (let i = 0; i < stopBeforeSegmentIndex; i++) {
        const segment = ast.segments[i];

        if (!segment) {
            break;
        }

        if (segment.kind === "deep") {
            // Enable deep mode for the next segment
            deepMode = true;
            continue;
        }

        const pool = deepMode
            ? collectAllDescendants(frontier, tree)
            : previousUnionMode
              ? collectAllChildren(frontier, tree)
              : collectCommonChildren(frontier, tree);

        frontier = evaluateExpression(segment.expr, pool, tree, matchName);

        // Save this segment's union mode for the next iteration
        previousUnionMode = segment.unionMode;

        deepMode = false;

        if (frontier.size === 0) {
            break;
        }
    }

    return { frontier, deepMode, unionMode: previousUnionMode };
}
