import type { Range } from "./types/range";

export interface BaseToken {
    charRange: Range;
}

export interface LPAREN extends BaseToken {
    type: "LPAREN";
    value: "(";
}

export interface RPAREN extends BaseToken {
    type: "RPAREN";
    value: ")";
}

export interface LBRACE extends BaseToken {
    type: "LBRACE";
    value: "{";
}

export interface RBRACE extends BaseToken {
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

    function pushToken(token: Token): void {
        literalReference = null;
        tokens.push(token);
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
            pushToken({
                type: "LPAREN",
                value: "(",
                charRange: {
                    start: position,
                    end: position + 1,
                },
            });
            position++;
            continue;
        }

        if (char === ")") {
            pushToken({
                type: "RPAREN",
                value: ")",
                charRange: {
                    start: position,
                    end: position + 1,
                },
            });
            position++;
            continue;
        }

        if (char === "{") {
            pushToken({
                type: "LBRACE",
                value: "{",
                charRange: {
                    start: position,
                    end: position + 1,
                },
            });
            position++;
            continue;
        }

        if (char === "}") {
            pushToken({
                type: "RBRACE",
                value: "}",
                charRange: {
                    start: position,
                    end: position + 1,
                },
            });
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
            literalReference = {
                type: "LITERAL",
                value: "",
                charRange: {
                    start: position,
                    end: position,
                },
            };
            tokens.push(literalReference);
        }
        literalReference.value += char;
        literalReference.charRange.end = position + 1;
        position++;
    }

    return tokens;
}
