/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { parseQuery } from "../parse";

describe("parseQuery", () => {
    describe("basic parsing", () => {
        it("should parse empty string", () => {
            const result = parseQuery("", { delimiter: ":" });

            expect(result.text).toBe("");
            expect(result.tokens).toHaveLength(0);
            expect(result.segments).toHaveLength(1);
            expect(result.ast.segments).toHaveLength(1);
            // Empty segments should produce a diagnostic
            expect(result.diagnostics.length).toBeGreaterThan(0);
            expect(result.diagnostics[0].message).toBe("Empty segment");
        });

        it("should parse simple literal", () => {
            const result = parseQuery("Root", { delimiter: ":" });

            expect(result.text).toBe("Root");
            expect(result.tokens).toHaveLength(1);
            expect(result.tokens[0].type).toBe("LITERAL");
            expect(result.tokens[0].value).toBe("Root");

            expect(result.segments).toHaveLength(1);
            expect(result.segments[0].tokenStartIndex).toBe(0);
            expect(result.segments[0].tokenEndIndex).toBe(1);

            expect(result.ast.segments).toHaveLength(1);
            const segment = result.ast.segments[0];
            expect(segment.kind).toBe("expr");
            if (segment.kind === "expr") {
                expect(segment.expr.kind).toBe("pattern");
                if (segment.expr.kind === "pattern") {
                    expect(segment.expr.atoms).toHaveLength(1);
                    expect(segment.expr.atoms[0].kind).toBe("literal");
                    if (segment.expr.atoms[0].kind === "literal") {
                        expect(segment.expr.atoms[0].text).toBe("Root");
                    }
                }
            }

            expect(result.diagnostics).toHaveLength(0);
        });

        it("should parse path with multiple segments", () => {
            const result = parseQuery("A:B:C", { delimiter: ":" });

            expect(result.text).toBe("A:B:C");
            expect(result.tokens).toHaveLength(5);

            expect(result.segments).toHaveLength(3);
            expect(result.ast.segments).toHaveLength(3);

            // First segment: A
            expect(result.segments[0].tokenStartIndex).toBe(0);
            expect(result.segments[0].tokenEndIndex).toBe(1);

            // Second segment: B
            expect(result.segments[1].tokenStartIndex).toBe(2);
            expect(result.segments[1].tokenEndIndex).toBe(3);

            // Third segment: C
            expect(result.segments[2].tokenStartIndex).toBe(4);
            expect(result.segments[2].tokenEndIndex).toBe(5);

            expect(result.diagnostics).toHaveLength(0);
        });
    });

    describe("deep wildcard parsing", () => {
        it("should parse deep wildcard segment", () => {
            const result = parseQuery("A:**:B", { delimiter: ":" });

            expect(result.text).toBe("A:**:B");
            expect(result.segments).toHaveLength(3);
            expect(result.ast.segments).toHaveLength(3);

            // First segment: A
            const firstSegment = result.ast.segments[0];
            expect(firstSegment.kind).toBe("expr");

            // Second segment: **
            const secondSegment = result.ast.segments[1];
            expect(secondSegment.kind).toBe("deep");

            // Third segment: B
            const thirdSegment = result.ast.segments[2];
            expect(thirdSegment.kind).toBe("expr");

            expect(result.diagnostics).toHaveLength(0);
        });
    });

    describe("wildcard patterns", () => {
        it("should parse star wildcard in pattern", () => {
            const result = parseQuery("Node*", { delimiter: ":" });

            expect(result.ast.segments).toHaveLength(1);
            const segment = result.ast.segments[0];
            expect(segment.kind).toBe("expr");
            if (segment.kind === "expr" && segment.expr.kind === "pattern") {
                expect(segment.expr.atoms).toHaveLength(2);
                expect(segment.expr.atoms[0].kind).toBe("literal");
                expect(segment.expr.atoms[1].kind).toBe("star");
            }

            expect(result.diagnostics).toHaveLength(0);
        });

        it("should parse question mark wildcard in pattern", () => {
            const result = parseQuery("Node?", { delimiter: ":" });

            expect(result.ast.segments).toHaveLength(1);
            const segment = result.ast.segments[0];
            expect(segment.kind).toBe("expr");
            if (segment.kind === "expr" && segment.expr.kind === "pattern") {
                expect(segment.expr.atoms).toHaveLength(2);
                expect(segment.expr.atoms[0].kind).toBe("literal");
                expect(segment.expr.atoms[1].kind).toBe("qmark");
            }

            expect(result.diagnostics).toHaveLength(0);
        });

        it("should parse mixed wildcards", () => {
            const result = parseQuery("Data*?Test", { delimiter: ":" });

            expect(result.ast.segments).toHaveLength(1);
            const segment = result.ast.segments[0];
            expect(segment.kind).toBe("expr");
            if (segment.kind === "expr" && segment.expr.kind === "pattern") {
                expect(segment.expr.atoms).toHaveLength(4);
                expect(segment.expr.atoms[0].kind).toBe("literal");
                expect(segment.expr.atoms[1].kind).toBe("star");
                expect(segment.expr.atoms[2].kind).toBe("qmark");
                expect(segment.expr.atoms[3].kind).toBe("literal");
            }

            expect(result.diagnostics).toHaveLength(0);
        });
    });

    describe("OR expressions", () => {
        it("should parse OR expression", () => {
            const result = parseQuery("A|B", { delimiter: ":" });

            expect(result.ast.segments).toHaveLength(1);
            const segment = result.ast.segments[0];
            expect(segment.kind).toBe("expr");
            if (segment.kind === "expr") {
                expect(segment.expr.kind).toBe("binary");
                if (segment.expr.kind === "binary") {
                    expect(segment.expr.operator).toBe("|");
                    expect(segment.expr.left.kind).toBe("pattern");
                    expect(segment.expr.right.kind).toBe("pattern");
                }
            }

            expect(result.diagnostics).toHaveLength(0);
        });

        it("should parse multiple OR expressions", () => {
            const result = parseQuery("A|B|C", { delimiter: ":" });

            expect(result.ast.segments).toHaveLength(1);
            const segment = result.ast.segments[0];
            expect(segment.kind).toBe("expr");
            if (segment.kind === "expr") {
                expect(segment.expr.kind).toBe("binary");
                if (segment.expr.kind === "binary") {
                    expect(segment.expr.operator).toBe("|");
                    // Should be left-associative: (A|B)|C
                    expect(segment.expr.left.kind).toBe("binary");
                    expect(segment.expr.right.kind).toBe("pattern");
                }
            }

            expect(result.diagnostics).toHaveLength(0);
        });
    });

    describe("AND expressions", () => {
        it("should parse AND expression", () => {
            const result = parseQuery("A&B", { delimiter: ":" });

            expect(result.ast.segments).toHaveLength(1);
            const segment = result.ast.segments[0];
            expect(segment.kind).toBe("expr");
            if (segment.kind === "expr") {
                expect(segment.expr.kind).toBe("binary");
                if (segment.expr.kind === "binary") {
                    expect(segment.expr.operator).toBe("&");
                    expect(segment.expr.left.kind).toBe("pattern");
                    expect(segment.expr.right.kind).toBe("pattern");
                }
            }

            expect(result.diagnostics).toHaveLength(0);
        });
    });

    describe("group expressions", () => {
        it("should parse grouped expression", () => {
            const result = parseQuery("(A|B)", { delimiter: ":" });

            expect(result.ast.segments).toHaveLength(1);
            const segment = result.ast.segments[0];
            expect(segment.kind).toBe("expr");
            if (segment.kind === "expr") {
                expect(segment.expr.kind).toBe("group");
                if (segment.expr.kind === "group") {
                    expect(segment.expr.closed).toBe(true);
                    expect(segment.expr.expr.kind).toBe("binary");
                }
            }

            expect(result.diagnostics).toHaveLength(0);
        });

        it("should parse unclosed group", () => {
            const result = parseQuery("(A|B", { delimiter: ":" });

            expect(result.ast.segments).toHaveLength(1);
            const segment = result.ast.segments[0];
            expect(segment.kind).toBe("expr");
            if (segment.kind === "expr" && segment.expr.kind === "group") {
                expect(segment.expr.closed).toBe(false);
            }

            // Unclosed groups might produce diagnostics
            // (depending on implementation)
        });
    });

    describe("set expressions", () => {
        it("should parse set expression", () => {
            const result = parseQuery("{A,B,C}", { delimiter: ":" });

            expect(result.ast.segments).toHaveLength(1);
            const segment = result.ast.segments[0];
            expect(segment.kind).toBe("expr");
            if (segment.kind === "expr") {
                expect(segment.expr.kind).toBe("set");
                if (segment.expr.kind === "set") {
                    expect(segment.expr.closed).toBe(true);
                    expect(segment.expr.items).toHaveLength(3);
                }
            }

            expect(result.diagnostics).toHaveLength(0);
        });

        it("should parse unclosed set", () => {
            const result = parseQuery("{A,B", { delimiter: ":" });

            expect(result.ast.segments).toHaveLength(1);
            const segment = result.ast.segments[0];
            expect(segment.kind).toBe("expr");
            if (segment.kind === "expr" && segment.expr.kind === "set") {
                expect(segment.expr.closed).toBe(false);
            }

            // Unclosed sets might produce diagnostics
        });
    });

    describe("complex queries", () => {
        it("should parse complex nested query", () => {
            const result = parseQuery("Root:**:{A,B}|(C&D):*Leaf?", {
                delimiter: ":",
            });

            expect(result.text).toBe("Root:**:{A,B}|(C&D):*Leaf?");
            expect(result.segments).toHaveLength(4);
            expect(result.ast.segments).toHaveLength(4);

            // First segment: Root (pattern)
            expect(result.ast.segments[0].kind).toBe("expr");

            // Second segment: ** (deep)
            expect(result.ast.segments[1].kind).toBe("deep");

            // Third segment: {A,B}|(C&D) (complex expression)
            const thirdSegment = result.ast.segments[2];
            expect(thirdSegment.kind).toBe("expr");
            if (thirdSegment.kind === "expr") {
                expect(thirdSegment.expr.kind).toBe("binary");
                if (thirdSegment.expr.kind === "binary") {
                    expect(thirdSegment.expr.operator).toBe("|");
                    expect(thirdSegment.expr.left.kind).toBe("set");
                    expect(thirdSegment.expr.right.kind).toBe("group");
                }
            }

            // Fourth segment: *Leaf? (pattern with wildcards)
            const fourthSegment = result.ast.segments[3];
            expect(fourthSegment.kind).toBe("expr");
            if (fourthSegment.kind === "expr") {
                expect(fourthSegment.expr.kind).toBe("pattern");
            }
        });

        it("should parse query with custom delimiter", () => {
            const result = parseQuery("A/B/C", { delimiter: "/" });

            expect(result.text).toBe("A/B/C");
            expect(result.segments).toHaveLength(3);
            expect(result.ast.segments).toHaveLength(3);
            expect(result.diagnostics).toHaveLength(0);
        });
    });

    describe("error handling", () => {
        it("should detect empty segments", () => {
            const result = parseQuery("A::B", { delimiter: ":" });

            expect(result.segments).toHaveLength(3);
            // Middle segment is empty
            expect(result.diagnostics.length).toBeGreaterThan(0);
            const emptySegmentDiagnostic = result.diagnostics.find(
                (d) => d.message === "Empty segment"
            );
            expect(emptySegmentDiagnostic).toBeDefined();
            expect(emptySegmentDiagnostic?.severity).toBe("error");
        });

        it("should detect unmatched closing parenthesis", () => {
            const result = parseQuery("A:B)", { delimiter: ":" });

            expect(result.diagnostics.length).toBeGreaterThan(0);
            const unmatchedDiagnostic = result.diagnostics.find((d) =>
                d.message.includes("Unmatched closing parenthesis")
            );
            expect(unmatchedDiagnostic).toBeDefined();
            expect(unmatchedDiagnostic?.severity).toBe("error");
        });

        it("should detect unmatched closing brace", () => {
            const result = parseQuery("A:B}", { delimiter: ":" });

            expect(result.diagnostics.length).toBeGreaterThan(0);
            const unmatchedDiagnostic = result.diagnostics.find((d) =>
                d.message.includes("Unmatched closing brace")
            );
            expect(unmatchedDiagnostic).toBeDefined();
            expect(unmatchedDiagnostic?.severity).toBe("error");
        });

        it("should handle leading delimiter", () => {
            const result = parseQuery(":A:B", { delimiter: ":" });

            expect(result.segments).toHaveLength(3);
            // First segment is empty
            expect(result.diagnostics.length).toBeGreaterThan(0);
            const emptySegmentDiagnostic = result.diagnostics.find(
                (d) => d.message === "Empty segment"
            );
            expect(emptySegmentDiagnostic).toBeDefined();
        });

        it("should handle trailing delimiter", () => {
            const result = parseQuery("A:B:", { delimiter: ":" });

            expect(result.segments).toHaveLength(3);
            // Last segment is empty
            expect(result.diagnostics.length).toBeGreaterThan(0);
            const emptySegmentDiagnostic = result.diagnostics.find(
                (d) => d.message === "Empty segment"
            );
            expect(emptySegmentDiagnostic).toBeDefined();
        });
    });

    describe("segment boundaries", () => {
        it("should not split on delimiter inside parentheses", () => {
            const result = parseQuery("A:(B:C):D", { delimiter: ":" });

            expect(result.segments).toHaveLength(3);
            // Middle segment should contain (B:C) as a whole
            expect(result.segments[1].tokenStartIndex).toBe(2);
            // Should include all tokens from ( to )
        });

        it("should not split on delimiter inside braces", () => {
            const result = parseQuery("A:{B:C}:D", { delimiter: ":" });

            expect(result.segments).toHaveLength(3);
            // Middle segment should contain {B:C} as a whole
            expect(result.segments[1].tokenStartIndex).toBe(2);
        });
    });

    describe("return value structure", () => {
        it("should return all required fields", () => {
            const result = parseQuery("A:B", { delimiter: ":" });

            expect(result).toHaveProperty("text");
            expect(result).toHaveProperty("tokens");
            expect(result).toHaveProperty("segments");
            expect(result).toHaveProperty("ast");
            expect(result).toHaveProperty("diagnostics");

            expect(typeof result.text).toBe("string");
            expect(Array.isArray(result.tokens)).toBe(true);
            expect(Array.isArray(result.segments)).toBe(true);
            expect(result.ast).toHaveProperty("segments");
            expect(Array.isArray(result.diagnostics)).toBe(true);
        });

        it("should preserve input text", () => {
            const input = "Root:**:Leaf";
            const result = parseQuery(input, { delimiter: ":" });

            expect(result.text).toBe(input);
        });

        it("should have consistent segment count", () => {
            const result = parseQuery("A:B:C", { delimiter: ":" });

            // Number of AST segments should match segment spans
            expect(result.ast.segments.length).toBe(result.segments.length);
        });
    });
});
