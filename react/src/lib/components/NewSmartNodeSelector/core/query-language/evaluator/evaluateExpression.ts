import type { Expr } from "../ast/ast";
import { matchesName } from "../matcher/matchesName";
import type { TreeAccessor } from "../types/tree";
import { convertToSet } from "./_utils";

export function evaluateExpression<Node>(
    expr: Expr,
    nodePool: Iterable<Node>,
    tree: TreeAccessor<Node>
): Set<Node> {
    const nodePoolAsSet = convertToSet(nodePool);
    const result = new Set<Node>();

    for (const node of nodePoolAsSet) {
        const name = tree.getName(node);
        if (matchesName(expr, name)) {
            result.add(node);
        }
    }

    return result;
}
