import type { Atom, Expr, QueryAST } from "../ast/ast";
import type { TreeAccessor } from "../types/tree";
import { collectAllChildren, collectAllDescendants } from "./_utils";

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
): { frontier: Set<Node>; deepMode: boolean } {
    // Start from all roots in the tree
    // Frontier is the set of nodes to evaluate the next segment on
    let frontier = new Set<Node>([tree.getRoot()]);

    // Deep mode is used for '**' segments that can match any number of levels
    let deepMode = false;

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
            : collectAllChildren(frontier, tree);
        frontier = evaluateExpression(segment.expr, pool, tree, matchName);

        deepMode = false;

        if (frontier.size === 0) {
            break;
        }
    }

    return { frontier, deepMode };
}
