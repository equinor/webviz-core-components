import type { Atom, BinaryExpr, Expr, GroupExpr, SetExpr } from "../ast/ast";
import { caretInRange, normalizeCaretIntoRange } from "../utils/range";
import { normalizeKey } from "./normalizeKey";

function flattenByOr(expr: Expr): Expr[] {
    if (expr.kind === "binary" && expr.operator === "|") {
        return [...flattenByOr(expr.left), ...flattenByOr(expr.right)];
    }
    return [expr];
}

// Turn a PatternExpr into a stable string key
function atomsToKey(atoms: Atom[]): string {
    // Keep it simple: literal text + wildcard symbols
    // (If you want case-insensitive: lower-case literals here)
    return atoms
        .map((a) =>
            a.kind === "literal" ? a.text : a.kind === "star" ? "*" : "?"
        )
        .join("");
}

function exprToKey(expr: Expr): string | null {
    if (expr.kind === "pattern") return atomsToKey(expr.atoms);
    if (expr.kind === "group") return exprToKey(expr.expr);
    return null; // skip complex ones for now
}

// Find deepest group/set containing caret
export function findEnclosingGroupOrSet(
    expr: Expr,
    caret: number
): GroupExpr | SetExpr | null {
    const normalizedCaret = normalizeCaretIntoRange(caret, expr.charRange);
    if (!caretInRange(normalizedCaret, expr.charRange)) {
        return null;
    }

    switch (expr.kind) {
        case "group": {
            const inner = findEnclosingGroupOrSet(expr.expr, caret);
            return inner ?? expr;
        }
        case "set": {
            for (const item of expr.items) {
                const inner = findEnclosingGroupOrSet(item, caret);
                if (inner) return inner;
            }
            return expr;
        }
        case "binary": {
            return (
                findEnclosingGroupOrSet(expr.left, caret) ??
                findEnclosingGroupOrSet(expr.right, caret)
            );
        }
        case "concat": {
            for (const p of expr.parts) {
                const inner = findEnclosingGroupOrSet(p, caret);
                if (inner) return inner;
            }
            return null;
        }
        default:
            return null;
    }
}

export function getExistingOptionKeys(scope: GroupExpr | SetExpr): Set<string> {
    const keys = new Set<string>();

    if (scope.kind === "group") {
        for (const alt of flattenByOr(scope.expr)) {
            const k = exprToKey(alt);
            if (k) keys.add(normalizeKey(k));
        }
    } else {
        for (const item of scope.items) {
            const k = exprToKey(item);
            if (k) keys.add(normalizeKey(k));
        }
    }

    return keys;
}

export function getExistingKeysFromOrLeft(orCtx: BinaryExpr): Set<string> {
    const keys = new Set<string>();
    for (const alt of flattenByOr(orCtx.left)) {
        const k = exprToKey(alt);
        if (k) keys.add(normalizeKey(k));
    }
    return keys;
}

export function findNearestOrRhsContext(
    expr: Expr,
    caret: number
): BinaryExpr | null {
    const normalizedCaret = normalizeCaretIntoRange(caret, expr.charRange);
    if (!caretInRange(normalizedCaret, expr.charRange)) return null;

    switch (expr.kind) {
        case "binary": {
            // Prefer deepest match: check children first
            const inLeft = caretInRange(normalizedCaret, expr.left.charRange);
            const inRight = caretInRange(normalizedCaret, expr.right.charRange);

            const child =
                (inLeft ? findNearestOrRhsContext(expr.left, caret) : null) ??
                (inRight ? findNearestOrRhsContext(expr.right, caret) : null);

            if (child) return child;

            if (expr.operator === "|" && inRight) return expr;
            return null;
        }
        case "group":
            return findNearestOrRhsContext(expr.expr, caret);
        case "set":
            for (const it of expr.items) {
                const found = findNearestOrRhsContext(it, caret);
                if (found) return found;
            }
            return null;
        case "concat":
            for (const p of expr.parts) {
                const found = findNearestOrRhsContext(p, caret);
                if (found) return found;
            }
            return null;
        default:
            return null;
    }
}
