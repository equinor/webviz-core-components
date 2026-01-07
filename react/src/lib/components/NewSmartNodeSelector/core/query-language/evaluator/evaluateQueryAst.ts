import type { Atom, QueryAST } from "../ast/ast";
import type { TreeAccessor } from "../types/tree";
import {
    collectAllChildren,
    collectAllDescendants,
    convertToSet,
} from "./_utils";
import { evaluateExpression } from "./evaluateExpression";

export function evaluateQueryAst<Node>(
    ast: QueryAST,
    tree: TreeAccessor<Node>,
    matchName: (name: string, atoms: Atom[]) => boolean
): Set<Node> {
    // Start from the root in the tree
    // Frontier is the set of nodes to evaluate the next segment on
    let frontier = convertToSet([tree.getRoot()]);

    // Deep mode is used for '**' segments that can match any number of levels
    let deepMode = false;

    for (const segment of ast.segments) {
        if (segment.kind === "deep") {
            // Enable deep mode for the next segment
            deepMode = true;
            continue;
        }

        // Otherwise, it's an expr segment
        const pool = deepMode
            ? collectAllDescendants(frontier, tree)
            : collectAllChildren(frontier, tree);

        frontier = evaluateExpression(segment.expr, pool, tree, matchName);

        // If frontier is empty, we can stop early
        if (frontier.size === 0) {
            return frontier;
        }

        // Reset deep mode
        deepMode = false;
    }

    return frontier;
}
