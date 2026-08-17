import type { Expr, QueryAST } from "./ast";

export function astHasErrors(ast: QueryAST): boolean {
    return ast.segments.some((segment) => {
        if (segment.kind === "expr") {
            return expressionHasParseErrors(segment.expr);
        }
        return false;
    });
}

function expressionHasParseErrors(expr: Expr): boolean {
    switch (expr.kind) {
        case "error":
            return true;
        case "group":
            return !expr.closed || expressionHasParseErrors(expr.expr);
        case "set":
            return !expr.closed || expr.items.some(expressionHasParseErrors);
        case "attributeFilter":
            return !expr.closed || expr.values.some(expressionHasParseErrors);
        case "binary":
            return (
                expressionHasParseErrors(expr.left) ||
                expressionHasParseErrors(expr.right)
            );
        default:
            return false;
    }
}
