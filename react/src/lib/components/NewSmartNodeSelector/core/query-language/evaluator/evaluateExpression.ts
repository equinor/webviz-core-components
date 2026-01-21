import type { AttributeFilterExpr, Expr } from "../ast/ast";
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

    // Handle attribute filter specially since it needs metadata access
    if (expr.kind === "attributeFilter") {
        return evaluateAttributeFilter(expr, nodePoolAsSet, tree);
    }

    // Handle concat that may contain attribute filters
    if (expr.kind === "concat") {
        return evaluateConcatWithAttributeFilters(expr, nodePoolAsSet, tree);
    }

    for (const node of nodePoolAsSet) {
        const name = tree.getName(node);
        if (matchesName(expr, name)) {
            result.add(node);
        }
    }

    return result;
}

function evaluateAttributeFilter<Node>(
    expr: AttributeFilterExpr,
    nodePool: Set<Node>,
    tree: TreeAccessor<Node>
): Set<Node> {
    const result = new Set<Node>();
    const getMetadata = tree.getFilterableMetadata;

    if (!getMetadata) {
        return result;
    }

    for (const node of nodePool) {
        const metadata = getMetadata(node);
        const attrValue = metadata[expr.attributeName];

        if (attrValue === undefined) {
            continue;
        }

        // Check if attrValue matches ANY of the value patterns (OR semantics)
        for (const valueExpr of expr.values) {
            if (valueExpr.kind === "pattern") {
                if (matchesName(valueExpr, attrValue)) {
                    result.add(node);
                    break;
                }
            }
        }
    }

    return result;
}

function evaluateConcatWithAttributeFilters<Node>(
    expr: Expr & { kind: "concat" },
    nodePool: Set<Node>,
    tree: TreeAccessor<Node>
): Set<Node> {
    // Check if concat contains attribute filters
    const hasAttributeFilter = expr.parts.some(p => p.kind === "attributeFilter");

    if (!hasAttributeFilter) {
        // No attribute filters, use standard name matching
        const result = new Set<Node>();
        for (const node of nodePool) {
            const name = tree.getName(node);
            if (matchesName(expr, name)) {
                result.add(node);
            }
        }
        return result;
    }

    // Separate name pattern parts from attribute filter parts
    const nameParts: Expr[] = [];
    const attrFilters: AttributeFilterExpr[] = [];

    for (const part of expr.parts) {
        if (part.kind === "attributeFilter") {
            attrFilters.push(part);
        } else {
            nameParts.push(part);
        }
    }

    // First, filter by name pattern (if any)
    let candidates = nodePool;

    if (nameParts.length > 0) {
        const nameExpr: Expr = nameParts.length === 1
            ? nameParts[0]
            : { kind: "concat", parts: nameParts, charRange: expr.charRange };

        candidates = new Set<Node>();
        for (const node of nodePool) {
            const name = tree.getName(node);
            if (matchesName(nameExpr, name)) {
                candidates.add(node);
            }
        }
    }

    // Then, apply each attribute filter (AND semantics between filters)
    for (const attrFilter of attrFilters) {
        candidates = evaluateAttributeFilter(attrFilter, candidates, tree);
    }

    return candidates;
}
