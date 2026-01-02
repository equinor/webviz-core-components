import React from "react";
import type { Token } from "../core/types/Token";

export type TokenRendererProps = {
    token: Token;
};

export function TokenRenderer(props: TokenRendererProps): React.ReactElement {
    const { token } = props;
    
    switch (token.type) {
        case "TAG":
            return (
                <>
                    {token.children.map((child, index) => (
                        <TokenRenderer key={index} token={child} />
                    ))}
                </>
            );

        case "DELIMITER":
            return <span style={{ color: "#0996e8ff", fontWeight: "bold" }}>{token.value}</span>;

        case "LITERAL":
            return <span style={{ color: "#000" }}>{token.value}</span>;

        case "WILDCARD":
            return <span style={{ color: "#0066CC", fontWeight: "bold" }}>{token.value}</span>;

        case "DEEP_WILDCARD":
            return <span style={{ color: "#0066CC", fontWeight: "bold" }}>{token.value}</span>;

        case "CHAR_WILDCARD":
            return (
                <>
                    {token.children.map((child, index) => (
                        <TokenRenderer key={index} token={child} />
                    ))}
                </>
            );

        case "CHAR_WILDCARD_LITERAL":
            return <span style={{ color: "#000" }}>{token.value}</span>;

        case "CHAR_WILDCARD_CHAR":
            return <span style={{ color: "#0066CC", fontWeight: "bold" }}>{token.value}</span>;

        case "GLOB":
            return (
                <>
                    {token.children.map((child, index) => (
                        <TokenRenderer key={index} token={child} />
                    ))}
                </>
            );

        case "GLOB_LITERAL":
            return <span style={{ color: "#000" }}>{token.value}</span>;

        case "GLOB_WILDCARD":
            return <span style={{ color: "#0066CC", fontWeight: "bold" }}>{token.value}</span>;

        case "GROUP":
            return (
                <>
                    <TokenRenderer token={token.openParen} />
                    {token.children.map((child, index) => (
                        <TokenRenderer key={index} token={child} />
                    ))}
                    <TokenRenderer token={token.closeParen} />
                </>
            );

        case "OPEN_PAREN":
            return <span style={{ color: "#999", fontWeight: "bold" }}>{token.value}</span>;

        case "CLOSE_PAREN":
            return <span style={{ color: "#999", fontWeight: "bold" }}>{token.value}</span>;

        case "SET":
            return (
                <>
                    <TokenRenderer token={token.openBrace} />
                    {token.children.map((child, index) => (
                        <TokenRenderer key={index} token={child} />
                    ))}
                    <TokenRenderer token={token.closeBrace} />
                </>
            );

        case "OPEN_BRACE":
            return <span style={{ color: "#999", fontWeight: "bold" }}>{token.value}</span>;

        case "CLOSE_BRACE":
            return <span style={{ color: "#999", fontWeight: "bold" }}>{token.value}</span>;

        case "UNION_OPERATOR":
            return <span style={{ color: "#CC6600", fontWeight: "bold" }}>{token.value}</span>;

        case "INTERSECTION_OPERATOR":
            return <span style={{ color: "#CC6600", fontWeight: "bold" }}>{token.value}</span>;

        case "COMMA_OPERATOR":
            return <span style={{ color: "#CC6600" }}>{token.value}</span>;

        default:
            return <span>{String(token)}</span>;
    }
}