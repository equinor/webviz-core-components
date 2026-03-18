import type { Atom, Expr } from "../ast/ast";
import {
    collectAllChildren,
    collectAllDescendants,
    collectCommonChildren,
} from "../evaluator/_utils";
import { evaluatePrefix } from "../evaluator/evaluatePrefix";
import { matchesName, type MatchOptions } from "../matcher/matchesName";
import type { ParsedQuery } from "../parse";
import type {
    CompletionItem,
    SegmentCompletionItem,
} from "../types/completion";
import type { TreeAccessor } from "../types/tree";
import { getCaretContext, type CaretContext } from "./caretContext";
import { filterPoolByTailSegments } from "./filterPoolByTailSegments";
import { rankCompletions } from "./ranking";
import { getTreeCompletions } from "./treeCompletions";

export function getCompletions<Node>(
    parsed: ParsedQuery,
    caretOffset: number,
    tree: TreeAccessor<Node>,
    matchName: (name: string, atoms: Atom[]) => boolean,
    evaluateExpression: (
        expr: Expr,
        pool: Iterable<Node>,
        tree: TreeAccessor<Node>,
        matchName: (name: string, atoms: Atom[]) => boolean
    ) => Set<Node>,
    opts?: MatchOptions
): { completions: CompletionItem<Node>[]; caretContext: CaretContext } {
    const context = getCaretContext(parsed, caretOffset);

    const { frontier, deepMode, unionMode } = evaluatePrefix(
        parsed.ast,
        context.segmentIndex,
        tree,
        matchName,
        evaluateExpression
    );

    const pool = deepMode
        ? collectAllDescendants(frontier, tree)
        : unionMode
          ? collectAllChildren(frontier, tree)
          : collectCommonChildren(frontier, tree);

    const all: CompletionItem<Node>[] = [];

    if (pool.size === 0) {
        return { completions: all, caretContext: context };
    }

    // Look-ahead: filter pool to only candidates that satisfy tail segments.
    // Trim trailing empty spans first — an empty last segment (e.g. after typing "Well1/")
    // has no text yet and would prune every candidate if included.
    const tailSegments = parsed.ast.segments.slice(context.segmentIndex + 1);
    while (tailSegments.length > 0) {
        const spanIndex = context.segmentIndex + 1 + tailSegments.length - 1;
        const span = parsed.segments[spanIndex];
        if (span && span.charRange.start === span.charRange.end) {
            tailSegments.pop();
        } else {
            break;
        }
    }
    const effectivePool =
        !context.insideAttributeFilter &&
        tailSegments.length > 0 &&
        context.segmentAst.kind === "expr"
            ? filterPoolByTailSegments(
                  pool,
                  tailSegments,
                  context.segmentAst.unionMode,
                  tree,
                  matchName,
                  evaluateExpression
              )
            : pool;

    // Check if we have a full match in the current segment
    const hasFullMatch = checkForFullMatch(context, effectivePool, tree, opts);

    // Handle attribute filter completions
    if (context.insideAttributeFilter && context.attributeFilterContext) {
        // Filter pool by nodes matching the name pattern (attribute filter treated as epsilon)
        const filteredPool = filterPoolByNamePattern(context, pool, tree, opts);

        if (context.expectation === "attributeName") {
            all.push(
                ...getAttributeNameCompletions<Node>(
                    context,
                    filteredPool,
                    tree
                )
            );
        } else if (context.expectation === "attributeValue") {
            all.push(
                ...getAttributeValueCompletions<Node>(
                    context,
                    filteredPool,
                    tree,
                    opts
                )
            );
        }
    } else {
        // Add syntax-based completions
        all.push(...getSyntaxCompletions<Node>(context, hasFullMatch));

        // Added all nodes matching the current segment as completions, with tree-based matching and filtering
        all.push(
            ...Array.from(effectivePool).map((node) => {
                const completionItem: SegmentCompletionItem<Node> = {
                    label: tree.getName(node),
                    insertText: tree.getName(node),
                    replaceRange: context.replaceRange,
                    segmentReplaceRange: {
                        start:
                            context.replaceRange.start -
                            context.segmentAst.charRange.start,
                        end:
                            context.replaceRange.end -
                            context.segmentAst.charRange.start,
                    },
                    kind: "segment",
                    origin: {
                        kind: "single",
                        node,
                        nodeNameRange: {
                            start: 0,
                            end: tree.getName(node).length,
                        },
                    },
                };
                return completionItem;
            })
        );

        // Add tree-based completions
        all.push(...getTreeCompletions<Node>(context, effectivePool, tree, opts));
    }

    // Deduplicate completions - we can later rank them as well
    const deduped = dedupeCompletions(all);
    return {
        completions: rankCompletions(deduped, context.expectation),
        caretContext: context,
    };
}

/**
 * Check if the current segment expression has at least one full match
 * in the pool of candidate nodes, AND the caret is at the end of the segment.
 */
function checkForFullMatch<Node>(
    context: CaretContext,
    pool: Iterable<Node>,
    tree: TreeAccessor<Node>,
    opts?: MatchOptions
): { fullMatch: boolean; isLeafMatch: boolean } {
    const segmentAst = context.segmentAst;

    // Only check for matches in expression segments
    if (segmentAst.kind !== "expr") {
        return { fullMatch: false, isLeafMatch: false };
    }

    // Check if caret is at the end of the segment
    const isCaretAtEnd = context.caretOffset === segmentAst.charRange.end;
    if (!isCaretAtEnd) {
        return { fullMatch: false, isLeafMatch: false };
    }

    // Check if any node in the pool is a full match for the current expression
    for (const node of pool) {
        const name = tree.getName(node);
        if (matchesName(segmentAst.expr, name, opts)) {
            const isLeaf = tree.isLeaf(node);
            return { fullMatch: true, isLeafMatch: isLeaf };
        }
    }

    return { fullMatch: false, isLeafMatch: false };
}

type SyntaxKind =
    | "unionFlag"
    | "operator"
    | "wildcard"
    | "group"
    | "set"
    | "delimiter"
    | "attributeFilter";

function getSyntaxCompletions<Node>(
    context: CaretContext,
    hasFullMatch: { fullMatch: boolean; isLeafMatch: boolean }
): CompletionItem<Node>[] {
    const completions: CompletionItem<Node>[] = [];

    function add(
        label: string,
        insertText = label,
        kind: SyntaxKind = "operator"
    ) {
        completions.push({
            label,
            insertText,
            replaceRange: context.replaceRange,
            segmentReplaceRange: {
                start:
                    context.replaceRange.start -
                    context.segmentAst.charRange.start,
                end:
                    context.replaceRange.end -
                    context.segmentAst.charRange.start,
            },
            kind,
        });
    }

    switch (context.expectation) {
        case "term":
            if (context.isEmptySegment) {
                add("+", "+", "unionFlag");
            }
            add("(", "(", "group");
            if (!context.insideSet) {
                add("{", "{", "set");
            }
            add("*", "*", "wildcard");
            add("?", "?", "wildcard");

            if (context.isEmptySegment) {
                add("**", "**", "wildcard");
            }

            if (!context.insideAttributeFilter) {
                add("[", "[", "attributeFilter");
            }

            // If we have a full match, also suggest delimiter and operator
            if (hasFullMatch.fullMatch) {
                if (
                    !context.insideSet &&
                    !context.insideGroup &&
                    !hasFullMatch.isLeafMatch
                ) {
                    add(":", ":", "delimiter");
                }
                add("|", "|", "operator");
            }
            break;

        case "operator":
            add("|", "|", "operator");
            break;

        case "comma":
            if (!context.insideSet) {
                break;
            }
            add(",", ",", "operator");
            break;

        case "delimiterOrEnd":
            // No specific completions for delimiters or end of segment
            add(":", ":", "delimiter");
            break;
    }

    const topOfStack = context.stack.at(context.stack.length - 1);
    if (topOfStack?.type === "LPAREN" && topOfStack?.refTokenId === undefined) {
        add(")", ")", "group");
    } else if (
        topOfStack?.type === "LBRACE" &&
        topOfStack?.refTokenId === undefined
    ) {
        add("}", "}", "set");
    }

    return completions;
}

/**
 * Filter pool by nodes that match the name pattern part of the current segment.
 * Attribute filters are stripped out before matching, so this only considers
 * the non-attribute-filter parts of the expression.
 */
function filterPoolByNamePattern<Node>(
    context: CaretContext,
    pool: Iterable<Node>,
    tree: TreeAccessor<Node>,
    opts?: MatchOptions
): Set<Node> {
    const segmentAst = context.segmentAst;
    if (segmentAst.kind !== "expr") {
        return new Set(pool);
    }

    // Strip attribute filters from the expression to get just the name pattern
    const namePattern = stripAttributeFilters(segmentAst.expr);

    // If there's no name pattern (only attribute filters), return all nodes
    if (!namePattern) {
        return new Set(pool);
    }

    const filtered = new Set<Node>();
    for (const node of pool) {
        const name = tree.getName(node);
        if (matchesName(namePattern, name, opts)) {
            filtered.add(node);
        }
    }
    return filtered;
}

/**
 * Strip attribute filters from an expression, returning just the name-matching parts.
 * Returns null if the expression is ONLY attribute filters (no name pattern).
 */
function stripAttributeFilters(expr: Expr): Expr | null {
    switch (expr.kind) {
        case "attributeFilter":
            // Attribute filter only - no name pattern
            return null;

        case "pattern":
        case "error":
            // These are name patterns
            return expr;

        case "group": {
            const innerStripped = stripAttributeFilters(expr.expr);
            if (!innerStripped) return null;
            return { ...expr, expr: innerStripped };
        }

        case "set": {
            const strippedItems = expr.items
                .map(stripAttributeFilters)
                .filter((item): item is Expr => item !== null);
            if (strippedItems.length === 0) return null;
            return { ...expr, items: strippedItems };
        }

        case "concat": {
            const strippedParts = expr.parts
                .map(stripAttributeFilters)
                .filter((part): part is Expr => part !== null);
            if (strippedParts.length === 0) return null;
            if (strippedParts.length === 1) return strippedParts[0];
            return { ...expr, parts: strippedParts };
        }

        case "binary": {
            const leftStripped = stripAttributeFilters(expr.left);
            const rightStripped = stripAttributeFilters(expr.right);

            // For OR: if both sides have patterns, keep both
            // If only one side has a pattern, use that
            if (!leftStripped && !rightStripped) return null;
            if (!leftStripped) return rightStripped;
            if (!rightStripped) return leftStripped;
            return { ...expr, left: leftStripped, right: rightStripped };
        }
    }
}

function getAttributeNameCompletions<Node>(
    context: CaretContext,
    pool: Iterable<Node>,
    tree: TreeAccessor<Node>
): CompletionItem<Node>[] {
    const completions: CompletionItem<Node>[] = [];
    const getMetadata = tree.getFilterableMetadata;

    if (!getMetadata) {
        return completions;
    }

    // Collect all unique attribute names from the pool
    const attributeNames = new Set<string>();
    for (const node of pool) {
        const metadata = getMetadata(node);
        for (const key of Object.keys(metadata)) {
            attributeNames.add(key);
        }
    }

    // Create completions for each attribute name
    for (const attrName of attributeNames) {
        completions.push({
            label: attrName,
            insertText: attrName + "=",
            replaceRange: context.replaceRange,
            segmentReplaceRange: {
                start:
                    context.replaceRange.start -
                    context.segmentAst.charRange.start,
                end:
                    context.replaceRange.end -
                    context.segmentAst.charRange.start,
            },
            kind: "attributeName",
        });
    }

    return completions;
}

function getAttributeValueCompletions<Node>(
    context: CaretContext,
    pool: Iterable<Node>,
    tree: TreeAccessor<Node>,
    opts?: MatchOptions
): CompletionItem<Node>[] {
    const completions: CompletionItem<Node>[] = [];
    const getMetadata = tree.getFilterableMetadata;
    const attributeName = context.attributeFilterContext?.attributeName;

    if (!getMetadata || !attributeName) {
        return completions;
    }

    // Collect all unique values for this attribute from the pool
    // Group nodes by their attribute value
    const valueToNodes = new Map<string, Set<Node>>();
    for (const node of pool) {
        const metadata = getMetadata(node);
        const value = metadata[attributeName];
        if (value !== undefined) {
            if (!valueToNodes.has(value)) {
                valueToNodes.set(value, new Set());
            }
            valueToNodes.get(value)!.add(node);
        }
    }

    // Create completions for each unique value
    for (const [value, nodes] of valueToNodes) {
        const origin =
            nodes.size === 1
                ? {
                      kind: "single" as const,
                      node: nodes.values().next().value as Node,
                      nodeNameRange: { start: 0, end: value.length },
                  }
                : {
                      kind: "multi" as const,
                      nodes,
                      count: nodes.size,
                  };

        completions.push({
            label: value,
            insertText: value,
            replaceRange: context.replaceRange,
            segmentReplaceRange: {
                start:
                    context.replaceRange.start -
                    context.segmentAst.charRange.start,
                end:
                    context.replaceRange.end -
                    context.segmentAst.charRange.start,
            },
            kind: "attributeValue",
            origin,
        });
    }

    return completions;
}

function dedupeCompletions<Node>(
    completions: CompletionItem<Node>[]
): CompletionItem<Node>[] {
    function makeKey(item: CompletionItem<Node>): string {
        return `${item.replaceRange.start}:${item.replaceRange.end}:${item.insertText}:${item.kind}`;
    }

    const seen = new Set<string>();
    const deduplicated: CompletionItem<Node>[] = [];

    for (const item of completions) {
        const key = makeKey(item);
        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        deduplicated.push(item);
    }

    return deduplicated;
}
