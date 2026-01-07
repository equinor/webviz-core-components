import type { Atom, Expr } from "../ast/ast";
import type { TreeAccessor } from "../types/tree";
import { convertToSet } from "./_utils";

export function evaluateExpression<Node>(
    expr: Expr,
    nodePool: Iterable<Node>,
    tree: TreeAccessor<Node>,
    matchName: (name: string, atoms: Atom[]) => boolean
): Set<Node> {
    const nodePoolAsSet = convertToSet(nodePool);

    function evaluateInner(innerExpr: Expr): Set<Node> {
        switch (innerExpr.kind) {
            case "binary": {
                const left = evaluateInner(innerExpr.left);
                const right = evaluateInner(innerExpr.right);

                if (innerExpr.operator === "|") {
                    return unionInto(left, right);
                } else {
                    return intersectSets(left, right);
                }
            }
            case "group": {
                return evaluateInner(innerExpr.expr);
            }
            case "set": {
                const result = new Set<Node>();
                for (const item of innerExpr.items) {
                    const itemResult = evaluateInner(item);
                    unionInto(result, itemResult);
                }
                return result;
            }
            case "pattern": {
                return filterNodePoolByPattern(
                    nodePoolAsSet,
                    tree,
                    innerExpr.atoms,
                    matchName
                );
            }
            case "error": {
                // On error, return empty set
                return new Set<Node>();
            }
        }
    }

    return evaluateInner(expr);
}

function unionInto<Node>(intoSet: Set<Node>, fromSet: Set<Node>): Set<Node> {
    for (const item of fromSet) {
        intoSet.add(item);
    }
    return intoSet;
}

function intersectSets<Node>(setA: Set<Node>, setB: Set<Node>): Set<Node> {
    const [smallerSet, largerSet] =
        setA.size < setB.size ? [setA, setB] : [setB, setA];

    const result = new Set<Node>();

    for (const item of smallerSet) {
        if (largerSet.has(item)) {
            result.add(item);
        }
    }

    return result;
}

function filterNodePoolByPattern<Node>(
    nodePoolSet: Set<Node>,
    tree: TreeAccessor<Node>,
    atoms: Atom[],
    matchName: (name: string, atoms: Atom[]) => boolean
): Set<Node> {
    const result = new Set<Node>();

    for (const node of nodePoolSet) {
        const name = tree.getName(node);
        if (matchName(name, atoms)) {
            result.add(node);
        }
    }

    return result;
}
