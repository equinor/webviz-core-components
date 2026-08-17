import { tokenize } from "../lexer";
import { parseSegment } from "../segment-parser/parseSegment";

describe("parseSegment - starting with group", () => {
    it('should parse "(Data|Tag) Source (A&B)" with Cartesian product expansion', () => {
        const text = "(Data|Tag) Source (A&B)";
        const tokens = tokenize(text, ":");

        const segmentSpan = {
            tokenStartIndex: 0,
            tokenEndIndex: tokens.length,
            charRange: { start: 0, end: text.length },
        };

        const result = parseSegment(tokens, segmentSpan);

        expect(result.segment.kind).toBe("expr");
        expect(result.diagnostics.length).toBe(0);

        // Should expand to 4 alternatives via Cartesian product:
        // (Data|Tag) × (Space) × (A&B) = (Data Space A | Data Space B | Tag Space A | Tag Space B)
        // The result will be a nested binary tree structure representing these 4 patterns

        // Verify the structure is a binary OR expression
        if (result.segment.kind === "expr") {
            expect(result.segment.expr.kind).toBe("binary");
            if (result.segment.expr.kind === "binary") {
                expect(result.segment.expr.operator).toBe("|");
            }
        }
    });

    it('should parse "(A|B)C" correctly', () => {
        const text = "(A|B)C";
        const tokens = tokenize(text, ":");

        const segmentSpan = {
            tokenStartIndex: 0,
            tokenEndIndex: tokens.length,
            charRange: { start: 0, end: text.length },
        };

        const result = parseSegment(tokens, segmentSpan);

        expect(result.segment.kind).toBe("expr");
        expect(result.diagnostics.length).toBe(0);

        // Should expand to (AC | BC)
        if (result.segment.kind === "expr") {
            const expr = result.segment.expr;
            expect(expr.kind).toBe("binary");

            if (expr.kind === "binary") {
                expect(expr.operator).toBe("|");
                expect(expr.left.kind).toBe("pattern");
                expect(expr.right.kind).toBe("pattern");

                if (expr.left.kind === "pattern" && expr.right.kind === "pattern") {
                    // Left: AC
                    expect(expr.left.atoms).toHaveLength(2);
                    // Right: BC
                    expect(expr.right.atoms).toHaveLength(2);
                }
            }
        }
    });

    it('should handle AND operator same as OR for pattern matching', () => {
        const text = "prefix(A&B)";
        const tokens = tokenize(text, ":");

        const segmentSpan = {
            tokenStartIndex: 0,
            tokenEndIndex: tokens.length,
            charRange: { start: 0, end: text.length },
        };

        const result = parseSegment(tokens, segmentSpan);

        expect(result.segment.kind).toBe("expr");
        expect(result.diagnostics.length).toBe(0);

        // Should expand to (prefixA | prefixB)
        // AND vs OR only matters for child node evaluation, not pattern matching
        if (result.segment.kind === "expr") {
            const expr = result.segment.expr;
            expect(expr.kind).toBe("binary");

            if (expr.kind === "binary") {
                expect(expr.operator).toBe("|");
            }
        }
    });
});
