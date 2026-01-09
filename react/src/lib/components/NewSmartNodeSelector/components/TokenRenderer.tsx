import React from "react";
import type { GroupToken, Token } from "../core/query-language/lexer";

export type TokenRendererProps = {
    token: Token;
    queryId?: string;
};

export function TokenRenderer(props: TokenRendererProps): React.ReactElement {
    const { token } = props;

    switch (token.type) {
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

        case "LBRACE": {
            const color = makeColorForGroupToken(token);
            return (
                <span style={{ color, fontWeight: "bold" }}>{token.value}</span>
            );
        }
        case "RBRACE": {
            const color = makeColorForGroupToken(token);
            return (
                <span style={{ color, fontWeight: "bold" }}>{token.value}</span>
            );
        }
        case "LPAREN": {
            const color = makeColorForGroupToken(token);
            return (
                <span style={{ color, fontWeight: "bold" }}>{token.value}</span>
            );
        }
        case "RPAREN": {
            const color = makeColorForGroupToken(token);
            return (
                <span style={{ color, fontWeight: "bold" }}>{token.value}</span>
            );
        }
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

        case "PLUS":
            return (
                <span style={{ color: "#7e00ccff", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        default: {
            const _exhaustiveCheck: never = token;
            return _exhaustiveCheck;
        }
    }
}

function makeColorForGroupToken(token: GroupToken): string {
    if (token.refTokenId === undefined) {
        return "#d12525ff";
    }
    return "#999";
}
