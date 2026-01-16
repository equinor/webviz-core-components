import React from "react";
import type { GroupToken, Token } from "../core/query-language/lexer";
import type { Diagnostic } from "../core/query-language/types/diagnostics";
import type { Range } from "../core/utils/range";

export type TokenRendererProps = {
    token: Token;
    queryId?: string;
    diagnostics?: Diagnostic[];
};

/**
 * Check if a token's character range overlaps with a diagnostic's range
 */
function rangesOverlap(a: Range, b: Range): boolean {
    return a.start < b.end && b.start < a.end;
}

/**
 * Get diagnostics that apply to a specific token
 */
function getDiagnosticsForToken(
    token: Token,
    diagnostics: Diagnostic[]
): Diagnostic[] {
    return diagnostics.filter((d) => rangesOverlap(token.charRange, d.charRange));
}

/**
 * Get the most severe diagnostic level for a token
 */
function getMaxSeverity(
    diagnostics: Diagnostic[]
): "error" | "warning" | null {
    if (diagnostics.some((d) => d.severity === "error")) {
        return "error";
    }
    if (diagnostics.some((d) => d.severity === "warning")) {
        return "warning";
    }
    return null;
}

export function TokenRenderer(props: TokenRendererProps): React.ReactElement {
    const { token, diagnostics = [] } = props;

    const tokenDiagnostics = getDiagnosticsForToken(token, diagnostics);
    const severity = getMaxSeverity(tokenDiagnostics);
    const errorStyle = getErrorStyle(severity);
    const title = tokenDiagnostics.map((d) => d.message).join("\n") || undefined;

    switch (token.type) {
        case "OR":
            return (
                <span
                    style={{ color: "#cc4700ff", fontWeight: "bold", ...errorStyle }}
                    title={title}
                >
                    {token.value}
                </span>
            );

        case "COMMA":
            return (
                <span style={{ color: "#CC6600", ...errorStyle }} title={title}>
                    {token.value}
                </span>
            );

        case "DEEP":
            return (
                <span
                    style={{ color: "#0066CC", fontWeight: "bold", ...errorStyle }}
                    title={title}
                >
                    {token.value}
                </span>
            );

        case "LBRACE": {
            const color = makeColorForGroupToken(token);
            return (
                <span
                    style={{ color, fontWeight: "bold", ...errorStyle }}
                    title={title}
                >
                    {token.value}
                </span>
            );
        }
        case "RBRACE": {
            const color = makeColorForGroupToken(token);
            return (
                <span
                    style={{ color, fontWeight: "bold", ...errorStyle }}
                    title={title}
                >
                    {token.value}
                </span>
            );
        }
        case "LPAREN": {
            const color = makeColorForGroupToken(token);
            return (
                <span
                    style={{ color, fontWeight: "bold", ...errorStyle }}
                    title={title}
                >
                    {token.value}
                </span>
            );
        }
        case "RPAREN": {
            const color = makeColorForGroupToken(token);
            return (
                <span
                    style={{ color, fontWeight: "bold", ...errorStyle }}
                    title={title}
                >
                    {token.value}
                </span>
            );
        }
        case "QMARK":
            return (
                <span
                    style={{ color: "#0066CC", fontWeight: "bold", ...errorStyle }}
                    title={title}
                >
                    {token.value}
                </span>
            );

        case "STAR":
            return (
                <span
                    style={{ color: "#f3ad0aff", fontWeight: "bold", ...errorStyle }}
                    title={title}
                >
                    {token.value}
                </span>
            );

        case "DELIMITER":
            return (
                <span
                    style={{ color: "#0996e8ff", fontWeight: "bold", ...errorStyle }}
                    title={title}
                >
                    {token.value}
                </span>
            );

        case "LITERAL":
            return (
                <span style={{ color: "#000", ...errorStyle }} title={title}>
                    {token.value}
                </span>
            );

        case "PLUS":
            return (
                <span
                    style={{ color: "#7e00ccff", fontWeight: "bold", ...errorStyle }}
                    title={title}
                >
                    {token.value}
                </span>
            );

        default: {
            const _exhaustiveCheck: never = token;
            return _exhaustiveCheck;
        }
    }
}

function getErrorStyle(
    severity: "error" | "warning" | null
): React.CSSProperties {
    if (severity === "error") {
        return {
            textDecoration: "wavy underline #d12525ff",
            textUnderlineOffset: "2px",
        };
    }
    if (severity === "warning") {
        return {
            textDecoration: "wavy underline #e6a700",
            textUnderlineOffset: "2px",
        };
    }
    return {};
}

function makeColorForGroupToken(token: GroupToken): string {
    if (token.refTokenId === undefined) {
        return "#d12525ff";
    }
    return "#999";
}
