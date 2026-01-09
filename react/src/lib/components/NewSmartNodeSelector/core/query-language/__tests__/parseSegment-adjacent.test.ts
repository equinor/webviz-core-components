import { tokenize } from "../lexer";
import { parseSegment } from "../segment-parser/parseSegment";

describe("parseSegment - adjacent expressions", () => {
    it('should parse "Data Source (A|B)" as pattern concatenation', () => {
        const text = "Data Source (A|B)";
        const tokens = tokenize(text, ":");

        const segmentSpan = {
            tokenStartIndex: 0,
            tokenEndIndex: tokens.length,
            charRange: { start: 0, end: text.length },
        };

        const result = parseSegment(tokens, segmentSpan);

        // Should parse as: Binary OR of two patterns
        expect(result.segment.kind).toBe("expr");
        expect(result.diagnostics.length).toBe(0);

        if (result.segment.kind === "expr") {
            const expr = result.segment.expr;
            expect(expr.kind).toBe("binary");

            if (expr.kind === "binary") {
                expect(expr.operator).toBe("|");

                // Left: Pattern ["Data Source ", "A"]
                expect(expr.left.kind).toBe("pattern");
                if (expr.left.kind === "pattern") {
                    expect(expr.left.atoms).toHaveLength(2);
                    expect(expr.left.atoms[0].kind).toBe("literal");
                    if (expr.left.atoms[0].kind === "literal") {
                        expect(expr.left.atoms[0].text).toBe("Data Source ");
                    }
                    expect(expr.left.atoms[1].kind).toBe("literal");
                    if (expr.left.atoms[1].kind === "literal") {
                        expect(expr.left.atoms[1].text).toBe("A");
                    }
                }

                // Right: Pattern ["Data Source ", "B"]
                expect(expr.right.kind).toBe("pattern");
                if (expr.right.kind === "pattern") {
                    expect(expr.right.atoms).toHaveLength(2);
                    expect(expr.right.atoms[0].kind).toBe("literal");
                    if (expr.right.atoms[0].kind === "literal") {
                        expect(expr.right.atoms[0].text).toBe("Data Source ");
                    }
                    expect(expr.right.atoms[1].kind).toBe("literal");
                    if (expr.right.atoms[1].kind === "literal") {
                        expect(expr.right.atoms[1].text).toBe("B");
                    }
                }
            }
        }
    });

    it('should parse "prefix{a,b,c}" as pattern concatenation with set', () => {
        const text = "prefix{a,b,c}";
        const tokens = tokenize(text, ":");

        const segmentSpan = {
            tokenStartIndex: 0,
            tokenEndIndex: tokens.length,
            charRange: { start: 0, end: text.length },
        };

        const result = parseSegment(tokens, segmentSpan);

        expect(result.segment.kind).toBe("expr");
        expect(result.diagnostics.length).toBe(0);

        if (result.segment.kind === "expr") {
            const expr = result.segment.expr;
            // Should be: (prefixa | prefixb | prefixc)
            expect(expr.kind).toBe("binary");

            if (expr.kind === "binary") {
                expect(expr.operator).toBe("|");
                // Left should be (prefixa | prefixb)
                expect(expr.left.kind).toBe("binary");
                // Right should be prefixc
                expect(expr.right.kind).toBe("pattern");
            }
        }
    });

    it('should parse "A(B|C)D" with prefix and suffix', () => {
        const text = "A(B|C)D";
        const tokens = tokenize(text, ":");

        const segmentSpan = {
            tokenStartIndex: 0,
            tokenEndIndex: tokens.length,
            charRange: { start: 0, end: text.length },
        };

        const result = parseSegment(tokens, segmentSpan);

        expect(result.segment.kind).toBe("expr");

        if (result.segment.kind === "expr") {
            const expr = result.segment.expr;
            // Should be: (ABD | ACD)
            expect(expr.kind).toBe("binary");

            if (expr.kind === "binary") {
                expect(expr.operator).toBe("|");

                // Left: ABD
                expect(expr.left.kind).toBe("pattern");
                if (expr.left.kind === "pattern") {
                    expect(expr.left.atoms).toHaveLength(3);
                    if (expr.left.atoms[0].kind === "literal" &&
                        expr.left.atoms[1].kind === "literal" &&
                        expr.left.atoms[2].kind === "literal") {
                        expect(expr.left.atoms[0].text).toBe("A");
                        expect(expr.left.atoms[1].text).toBe("B");
                        expect(expr.left.atoms[2].text).toBe("D");
                    }
                }

                // Right: ACD
                expect(expr.right.kind).toBe("pattern");
                if (expr.right.kind === "pattern") {
                    expect(expr.right.atoms).toHaveLength(3);
                    if (expr.right.atoms[0].kind === "literal" &&
                        expr.right.atoms[1].kind === "literal" &&
                        expr.right.atoms[2].kind === "literal") {
                        expect(expr.right.atoms[0].text).toBe("A");
                        expect(expr.right.atoms[1].text).toBe("C");
                        expect(expr.right.atoms[2].text).toBe("D");
                    }
                }
            }
        }
    });

    it('should parse standalone group without prefix', () => {
        const text = "(A|B)";
        const tokens = tokenize(text, ":");

        const segmentSpan = {
            tokenStartIndex: 0,
            tokenEndIndex: tokens.length,
            charRange: { start: 0, end: text.length },
        };

        const result = parseSegment(tokens, segmentSpan);

        expect(result.segment.kind).toBe("expr");

        if (result.segment.kind === "expr") {
            const expr = result.segment.expr;
            // Should still be a group containing binary OR
            expect(expr.kind).toBe("group");

            if (expr.kind === "group") {
                expect(expr.expr.kind).toBe("binary");
            }
        }
    });
});
