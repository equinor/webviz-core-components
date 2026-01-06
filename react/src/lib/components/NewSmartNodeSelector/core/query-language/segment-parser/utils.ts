import type { Expr } from "../ast";
import type { Token } from "../lexer";
import type { Range } from "../types/range";

export function errorExpr(message: string, charRange: Range): Expr {
    return { kind: "error", message, charRange } as Expr;
}

export function mergeRanges(a: Range, b: Range): Range {
    return { start: Math.min(a.start, b.start), end: Math.max(a.end, b.end) };
}

export function rangeFromTokens(first: Token, last: Token): Range {
    return { start: first.charRange.start, end: last.charRange.end };
}

export function precedence(token: Token | null): number {
    if (!token) {
        return -1;
    }

    switch (token.type) {
        case "AND":
            return 2;
        case "OR":
            return 1;
        default:
            return -1;
    }
}

export function operatorFromToken(token: Token): "|" | "&" {
    return token.type === "AND" ? "&" : "|";
}
