/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { tokenize } from "../lexer";

describe("Tokenizer", () => {
    describe("tokenize()", () => {
        it('should tokenize "Data Source A" as a single LITERAL', () => {
            const tokens = tokenize("Data Source A", ":");

            expect(tokens).toHaveLength(1);
            expect(tokens[0]).toEqual({
                type: "LITERAL",
                value: "Data Source A",
                charRange: {
                    start: 0,
                    end: 13,
                },
            });
        });

        it('should tokenize "Data (Source|) A" with proper token splitting', () => {
            const tokens = tokenize("Data (Source|) A", ":");

            expect(tokens).toHaveLength(6);

            // LITERAL("Data ")
            expect(tokens[0]).toEqual({
                type: "LITERAL",
                value: "Data ",
                charRange: {
                    start: 0,
                    end: 5,
                },
            });

            // LPAREN
            expect(tokens[1]).toEqual({
                type: "LPAREN",
                value: "(",
                charRange: {
                    start: 5,
                    end: 6,
                },
            });

            // LITERAL("Source")
            expect(tokens[2]).toEqual({
                type: "LITERAL",
                value: "Source",
                charRange: {
                    start: 6,
                    end: 12,
                },
            });

            // OR
            expect(tokens[3]).toEqual({
                type: "OR",
                value: "|",
                charRange: {
                    start: 12,
                    end: 13,
                },
            });

            // RPAREN
            expect(tokens[4]).toEqual({
                type: "RPAREN",
                value: ")",
                charRange: {
                    start: 13,
                    end: 14,
                },
            });

            // LITERAL(" A")
            expect(tokens[5]).toEqual({
                type: "LITERAL",
                value: " A",
                charRange: {
                    start: 14,
                    end: 16,
                },
            });
        });

        it('should tokenize "{A,B}" with braces and comma', () => {
            const tokens = tokenize("{A,B}", ":");

            expect(tokens).toHaveLength(5);

            // LBRACE
            expect(tokens[0]).toEqual({
                type: "LBRACE",
                value: "{",
                charRange: {
                    start: 0,
                    end: 1,
                },
            });

            // LITERAL("A")
            expect(tokens[1]).toEqual({
                type: "LITERAL",
                value: "A",
                charRange: {
                    start: 1,
                    end: 2,
                },
            });

            // COMMA
            expect(tokens[2]).toEqual({
                type: "COMMA",
                value: ",",
                charRange: {
                    start: 2,
                    end: 3,
                },
            });

            // LITERAL("B")
            expect(tokens[3]).toEqual({
                type: "LITERAL",
                value: "B",
                charRange: {
                    start: 3,
                    end: 4,
                },
            });

            // RBRACE
            expect(tokens[4]).toEqual({
                type: "RBRACE",
                value: "}",
                charRange: {
                    start: 4,
                    end: 5,
                },
            });
        });

        it('should tokenize "A:**:B" with DEEP wildcard', () => {
            const tokens = tokenize("A:**:B", ":");

            expect(tokens).toHaveLength(5);

            // LITERAL("A")
            expect(tokens[0]).toEqual({
                type: "LITERAL",
                value: "A",
                charRange: {
                    start: 0,
                    end: 1,
                },
            });

            // DELIMITER (first colon)
            expect(tokens[1]).toEqual({
                type: "DELIMITER",
                value: ":",
                charRange: {
                    start: 1,
                    end: 2,
                },
            });

            // DEEP
            expect(tokens[2]).toEqual({
                type: "DEEP",
                value: "**",
                charRange: {
                    start: 2,
                    end: 4,
                },
            });

            // DELIMITER (second colon)
            expect(tokens[3]).toEqual({
                type: "DELIMITER",
                value: ":",
                charRange: {
                    start: 4,
                    end: 5,
                },
            });

            // LITERAL("B")
            expect(tokens[4]).toEqual({
                type: "LITERAL",
                value: "B",
                charRange: {
                    start: 5,
                    end: 6,
                },
            });
        });

        it('should tokenize "Data*?A" with STAR and QMARK', () => {
            const tokens = tokenize("Data*?A", ":");

            expect(tokens).toHaveLength(4);

            // LITERAL("Data")
            expect(tokens[0]).toEqual({
                type: "LITERAL",
                value: "Data",
                charRange: {
                    start: 0,
                    end: 4,
                },
            });

            // STAR
            expect(tokens[1]).toEqual({
                type: "STAR",
                value: "*",
                charRange: {
                    start: 4,
                    end: 5,
                },
            });

            // QMARK
            expect(tokens[2]).toEqual({
                type: "QMARK",
                value: "?",
                charRange: {
                    start: 5,
                    end: 6,
                },
            });

            // LITERAL("A")
            expect(tokens[3]).toEqual({
                type: "LITERAL",
                value: "A",
                charRange: {
                    start: 6,
                    end: 7,
                },
            });
        });

        it("should handle custom delimiter", () => {
            const tokens = tokenize("A/B/C", "/");

            expect(tokens).toHaveLength(5);
            expect(tokens[0]).toEqual({
                type: "LITERAL",
                value: "A",
                charRange: {
                    start: 0,
                    end: 1,
                },
            });
            expect(tokens[1]).toEqual({
                type: "DELIMITER",
                value: "/",
                charRange: {
                    start: 1,
                    end: 2,
                },
            });
            expect(tokens[2]).toEqual({
                type: "LITERAL",
                value: "B",
                charRange: {
                    start: 2,
                    end: 3,
                },
            });
            expect(tokens[3]).toEqual({
                type: "DELIMITER",
                value: "/",
                charRange: {
                    start: 3,
                    end: 4,
                },
            });
            expect(tokens[4]).toEqual({
                type: "LITERAL",
                value: "C",
                charRange: {
                    start: 4,
                    end: 5,
                },
            });
        });

        it("should handle empty input", () => {
            const tokens = tokenize("", ":");

            expect(tokens).toHaveLength(0);
        });

        it("should tokenize all special characters", () => {
            const tokens = tokenize("(){}|&,:**?", ":");

            expect(tokens).toHaveLength(10);
            expect(tokens[0].type).toBe("LPAREN");
            expect(tokens[1].type).toBe("RPAREN");
            expect(tokens[2].type).toBe("LBRACE");
            expect(tokens[3].type).toBe("RBRACE");
            expect(tokens[4].type).toBe("OR");
            expect(tokens[5].type).toBe("AND");
            expect(tokens[6].type).toBe("COMMA");
            expect(tokens[7].type).toBe("DELIMITER");
            expect(tokens[8].type).toBe("DEEP");
            expect(tokens[9].type).toBe("QMARK");
        });

        it("should handle consecutive delimiters", () => {
            const tokens = tokenize("A::B", ":");

            expect(tokens).toHaveLength(4);
            expect(tokens[0]).toEqual({
                type: "LITERAL",
                value: "A",
                charRange: {
                    start: 0,
                    end: 1,
                },
            });
            expect(tokens[1]).toEqual({
                type: "DELIMITER",
                value: ":",
                charRange: {
                    start: 1,
                    end: 2,
                },
            });
            expect(tokens[2]).toEqual({
                type: "DELIMITER",
                value: ":",
                charRange: {
                    start: 2,
                    end: 3,
                },
            });
            expect(tokens[3]).toEqual({
                type: "LITERAL",
                value: "B",
                charRange: {
                    start: 3,
                    end: 4,
                },
            });
        });

        it("should distinguish between STAR and DEEP", () => {
            const tokens = tokenize("*:**:***", ":");

            expect(tokens).toHaveLength(6);
            // Single STAR
            expect(tokens[0]).toEqual({
                type: "STAR",
                value: "*",
                charRange: {
                    start: 0,
                    end: 1,
                },
            });
            // DELIMITER
            expect(tokens[1]).toEqual({
                type: "DELIMITER",
                value: ":",
                charRange: {
                    start: 1,
                    end: 2,
                },
            });
            // DEEP (**)
            expect(tokens[2]).toEqual({
                type: "DEEP",
                value: "**",
                charRange: {
                    start: 2,
                    end: 4,
                },
            });
            // DELIMITER
            expect(tokens[3]).toEqual({
                type: "DELIMITER",
                value: ":",
                charRange: {
                    start: 4,
                    end: 5,
                },
            });
            // DEEP (**) followed by STAR (*)
            expect(tokens[4]).toEqual({
                type: "DEEP",
                value: "**",
                charRange: {
                    start: 5,
                    end: 7,
                },
            });
            // STAR (*)
            expect(tokens[5]).toEqual({
                type: "STAR",
                value: "*",
                charRange: {
                    start: 7,
                    end: 8,
                },
            });
        });

        it("should handle complex real-world query", () => {
            const tokens = tokenize("Root:**:{A,B}|(C&D):*Leaf?", ":");

            expect(tokens).toHaveLength(19);

            const types = tokens.map((t) => t.type);
            expect(types).toEqual([
                "LITERAL", // Root
                "DELIMITER", // :
                "DEEP", // **
                "DELIMITER", // :
                "LBRACE", // {
                "LITERAL", // A
                "COMMA", // ,
                "LITERAL", // B
                "RBRACE", // }
                "OR", // |
                "LPAREN", // (
                "LITERAL", // C
                "AND", // &
                "LITERAL", // D
                "RPAREN", // )
                "DELIMITER", // :
                "STAR", // *
                "LITERAL", // Leaf
                "QMARK", // ?
            ]);
        });
    });
});
