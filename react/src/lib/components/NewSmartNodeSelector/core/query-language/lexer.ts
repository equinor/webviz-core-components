import type { Range } from "./types/range";

export interface BaseToken {
    id: number;
    charRange: Range;
}

export interface GroupToken extends BaseToken {
    refTokenId: number | undefined;
}

export function isGroupToken(token: unknown): token is GroupToken {
    return typeof token === "object" && token !== null && "refTokenId" in token;
}

export interface LPAREN extends GroupToken {
    type: "LPAREN";
    value: "(";
}

export interface RPAREN extends GroupToken {
    type: "RPAREN";
    value: ")";
}

export interface LBRACE extends GroupToken {
    type: "LBRACE";
    value: "{";
}

export interface RBRACE extends GroupToken {
    type: "RBRACE";
    value: "}";
}

export interface OR extends BaseToken {
    type: "OR";
    value: "|";
}

export interface AND extends BaseToken {
    type: "AND";
    value: "&";
}

export interface COMMA extends BaseToken {
    type: "COMMA";
    value: ",";
}

export interface DELIMITER extends BaseToken {
    type: "DELIMITER";
    value: string;
}

export interface DEEP extends BaseToken {
    type: "DEEP";
    value: "**";
}

export interface STAR extends BaseToken {
    type: "STAR";
    value: "*";
}

export interface QMARK extends BaseToken {
    type: "QMARK";
    value: "?";
}

export interface LITERAL extends BaseToken {
    type: "LITERAL";
    value: string;
}

export type Token =
    | LPAREN
    | RPAREN
    | LBRACE
    | RBRACE
    | OR
    | AND
    | COMMA
    | DELIMITER
    | DEEP
    | STAR
    | QMARK
    | LITERAL;

export function tokenize(text: string, delimiter: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;
    let literalReference: LITERAL | null = null;

    function pushToken<T extends Token>(token: Omit<T, "id">): number {
        literalReference = null;
        tokens.push({ ...token, id: tokens.length } as T);
        return tokens.length - 1;
    }

    function findPrevGroupTokenOfType(type: Token["type"]): number | undefined {
        for (let i = tokens.length - 1; i >= 0; i--) {
            const token = tokens[i];
            if (
                token.type === type &&
                isGroupToken(token) &&
                token.refTokenId === undefined
            ) {
                return i;
            }
        }
        return undefined;
    }

    while (position < text.length) {
        const char = text[position];
        const nextChar = text.at(position + 1);

        if (char === "*") {
            if (nextChar === "*") {
                pushToken({
                    type: "DEEP",
                    value: "**",
                    charRange: {
                        start: position,
                        end: position + 2,
                    },
                });
                position += 2;
                continue;
            } else {
                pushToken({
                    type: "STAR",
                    value: "*",
                    charRange: {
                        start: position,
                        end: position + 1,
                    },
                });
                position++;
                continue;
            }
        }

        if (char === "(") {
            pushToken<LPAREN>({
                type: "LPAREN",
                value: "(",
                charRange: {
                    start: position,
                    end: position + 1,
                },
                refTokenId: undefined,
            });
            position++;
            continue;
        }

        if (char === ")") {
            const openingParenIndex = findPrevGroupTokenOfType("LPAREN");
            const closingParenIndex = pushToken<RPAREN>({
                type: "RPAREN",
                value: ")",
                charRange: {
                    start: position,
                    end: position + 1,
                },
                refTokenId: openingParenIndex,
            });
            if (openingParenIndex !== undefined) {
                (tokens[openingParenIndex] as LPAREN).refTokenId =
                    closingParenIndex;
            }
            position++;
            continue;
        }

        if (char === "{") {
            pushToken<LBRACE>({
                type: "LBRACE",
                value: "{",
                charRange: {
                    start: position,
                    end: position + 1,
                },
                refTokenId: undefined,
            });
            position++;
            continue;
        }

        if (char === "}") {
            const openingBraceIndex = findPrevGroupTokenOfType("LBRACE");
            const closingBraceIndex = pushToken<RBRACE>({
                type: "RBRACE",
                value: "}",
                charRange: {
                    start: position,
                    end: position + 1,
                },
                refTokenId: openingBraceIndex,
            });
            if (openingBraceIndex !== undefined) {
                (tokens[openingBraceIndex] as LBRACE).refTokenId =
                    closingBraceIndex;
            }
            position++;
            continue;
        }

        if (char === "|") {
            pushToken({
                type: "OR",
                value: "|",
                charRange: {
                    start: position,
                    end: position + 1,
                },
            });
            position++;
            continue;
        }

        if (char === "&") {
            pushToken({
                type: "AND",
                value: "&",
                charRange: {
                    start: position,
                    end: position + 1,
                },
            });
            position++;
            continue;
        }

        if (char === ",") {
            pushToken({
                type: "COMMA",
                value: ",",
                charRange: {
                    start: position,
                    end: position + 1,
                },
            });
            position++;
            continue;
        }

        if (char === "?") {
            pushToken({
                type: "QMARK",
                value: "?",
                charRange: {
                    start: position,
                    end: position + 1,
                },
            });
            position++;
            continue;
        }

        if (char === delimiter) {
            pushToken({
                type: "DELIMITER",
                value: delimiter,
                charRange: {
                    start: position,
                    end: position + 1,
                },
            });
            position++;
            continue;
        }

        // Literal token (any sequence of characters not matching above)
        if (literalReference === null) {
            pushToken<LITERAL>({
                type: "LITERAL",
                value: "",
                charRange: {
                    start: position,
                    end: position,
                },
            });
            literalReference = tokens[tokens.length - 1] as LITERAL;
        }
        literalReference.value += char;
        literalReference.charRange.end = position + 1;
        position++;
    }

    return tokens;
}
