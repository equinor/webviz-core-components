import type { QueryAST } from "../ast/ast";
import type { TreeAccessor } from "../types/tree";
import {
    collectAllChildren,
    collectCommonChildren,
    collectAllDescendants,
    convertToSet,
} from "./_utils";
import { evaluateExpression } from "./evaluateExpression";

export function evaluateQueryAst<Node>(
    ast: QueryAST,
    tree: TreeAccessor<Node>
): Set<Node> {
    // Start from the root in the tree
    // Frontier is the set of nodes to evaluate the next segment on
    let frontier = convertToSet([tree.getRoot()]);

    // Deep mode is used for '**' segments that can match any number of levels
    let deepMode = false;

    // Track union mode from previous segment to apply when collecting children for next segment
    let previousUnionMode = false;

    for (const segment of ast.segments) {
        if (segment.kind === "deep") {
            // Enable deep mode for the next segment
            deepMode = true;
            continue;
        }

        // Otherwise, it's an expr segment
        // Use unionMode flag from PREVIOUS segment to determine how to collect children:
        // - unionMode true (+): collect ALL children from ANY matched parent (union)
        // - unionMode false (default): collect children that appear in ALL matched parents (intersection)
        const pool = deepMode
            ? collectAllDescendants(frontier, tree)
            : previousUnionMode
              ? collectAllChildren(frontier, tree)
              : collectCommonChildren(frontier, tree);

        frontier = evaluateExpression(segment.expr, pool, tree);

        // If frontier is empty, we can stop early
        if (frontier.size === 0) {
            return frontier;
        }

        // Save this segment's union mode for the next iteration
        previousUnionMode = segment.unionMode;

        // Reset deep mode
        deepMode = false;
    }

    return frontier;
}
