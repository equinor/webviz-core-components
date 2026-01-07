import React from "react";
import type { Token } from "../core/query-language/lexer";

export type TokenRendererProps = {
    token: Token;
    queryId?: string;
};

export function TokenRenderer(props: TokenRendererProps): React.ReactElement {
    const { token } = props;

    switch (token.type) {
        case "AND":
            return (
                <span style={{ color: "#CC6600", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "OR":
            return (
                <span style={{ color: "#cc4700ff", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "COMMA":
            return <span style={{ color: "#CC6600" }}>{token.value}</span>;

        case "DEEP":
            return (
                <span style={{ color: "#0066CC", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "LBRACE":
            return (
                <span style={{ color: "#999", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "RBRACE":
            return (
                <span style={{ color: "#999", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "LPAREN":
            return (
                <span style={{ color: "#999", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "RPAREN":
            return (
                <span style={{ color: "#999", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "QMARK":
            return (
                <span style={{ color: "#0066CC", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "STAR":
            return (
                <span style={{ color: "#f3ad0aff", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "DELIMITER":
            return (
                <span style={{ color: "#0996e8ff", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "LITERAL":
            return <span style={{ color: "#000" }}>{token.value}</span>;

        default:
            return <span>{String(token)}</span>;
    }
}
