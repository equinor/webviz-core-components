import type { Atom } from "../ast/ast";
import { astHasErrors } from "../ast/utils";
import type { ParsedQuery } from "../parse";
import type { Diagnostic } from "../types/diagnostics";
import type { TreeAccessor } from "../types/tree";
import { evaluateQueryAst } from "./evaluateQueryAst";

export type EvaluationMode = "editor" | "strict";

export type EvaluationResult<Node> =
    | { status: "ok"; matches: Set<Node> }
    | { status: "blocked"; matches: Set<Node>; reason: "parse-errors" };

export function evaluateQuery<Node>(
    parsedQuery: ParsedQuery,
    tree: TreeAccessor<Node>,
    matchName: (name: string, atoms: Atom[]) => boolean,
    mode: EvaluationMode = "editor"
): EvaluationResult<Node> {
    let shouldBlock = false;
    if (mode === "strict") {
        // In strict mode, any diagnostics with severity "error" block evaluation
        // (e.g. from segment splitting)
        // Also block if there are parse errors in the AST
        shouldBlock =
            shouldBlock || hasErrorDiagnostics(parsedQuery.diagnostics);
        shouldBlock = shouldBlock || astHasErrors(parsedQuery.ast);
    }

    if (shouldBlock) {
        return {
            status: "blocked",
            matches: new Set<Node>(),
            reason: "parse-errors",
        };
    }

    const matches = evaluateQueryAst(parsedQuery.ast, tree, matchName);

    return { status: "ok", matches };
}

function hasErrorDiagnostics(diagnostics: Diagnostic[]): boolean {
    return diagnostics.some((diag) => diag.severity === "error");
}
