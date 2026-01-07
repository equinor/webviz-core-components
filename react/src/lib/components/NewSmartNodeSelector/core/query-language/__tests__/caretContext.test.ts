/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { parseQuery } from "../parse";
import {
    getCaretContext,
    type CaretContext,
} from "../completion/caretContext";

describe("getCaretContext", () => {
    function getContext(text: string, caretOffset: number): CaretContext {
        const parsed = parseQuery(text, { delimiter: ":" });
        return getCaretContext(parsed, caretOffset);
    }

    describe("basic caret positioning", () => {
        it("should clamp caret offset to valid range", () => {
            const parsed = parseQuery("Root", { delimiter: ":" });

            // Negative offset should be clamped to 0
            const ctx1 = getCaretContext(parsed, -5);
            expect(ctx1.caretOffset).toBe(0);

            // Beyond text length should be clamped to text length
            const ctx2 = getCaretContext(parsed, 100);
            expect(ctx2.caretOffset).toBe(4);
        });

        it("should find correct segment for caret at start", () => {
            const ctx = getContext("Root:A:B", 0);

            expect(ctx.segmentIndex).toBe(0);
            expect(ctx.segment.charRange).toEqual({ start: 0, end: 4 });
        });

        it("should find correct segment for caret at end", () => {
            const ctx = getContext("Root:A:B", 8);

            expect(ctx.segmentIndex).toBe(2);
        });

        it("should find correct segment for caret in middle", () => {
            const ctx = getContext("Root:A:B", 6);

            expect(ctx.segmentIndex).toBe(1);
        });

        it("should handle caret at segment boundary", () => {
            // At the delimiter between Root and A
            const ctx = getContext("Root:A:B", 4);

            // Should prefer the next segment when at boundary
            expect(ctx.segmentIndex).toBe(1);
        });
    });

    describe("token positioning", () => {
        it("should identify tokenBefore when caret is after token", () => {
            const ctx = getContext("Root:A", 6);

            expect(ctx.tokenBefore).toBeDefined();
            expect(ctx.tokenBefore?.type).toBe("LITERAL");
            expect(ctx.tokenBefore?.charRange).toEqual({ start: 5, end: 6 });
        });

        it("should identify tokenAt when caret is inside token", () => {
            const ctx = getContext("Root:Test", 7);

            expect(ctx.tokenAt).toBeDefined();
            expect(ctx.tokenAt?.type).toBe("LITERAL");
            expect(ctx.tokenAt?.charRange).toEqual({ start: 5, end: 9 });
        });

        it("should identify tokenAfter when caret is before token", () => {
            const ctx = getContext("Root:A", 4);

            expect(ctx.tokenAfter).toBeDefined();
            expect(ctx.tokenAfter?.type).toBe("LITERAL");
            expect(ctx.tokenAfter?.charRange).toEqual({ start: 5, end: 6 });
        });

        it("should have all three tokens in complex query", () => {
            const ctx = getContext("Root:A|B", 6);

            expect(ctx.tokenBefore?.type).toBe("OR");
            expect(ctx.tokenAt).toBeUndefined(); // caret in empty space
            expect(ctx.tokenAfter?.type).toBe("LITERAL");
        });

        it("should handle caret at token boundary", () => {
            const ctx = getContext("Root:Test", 9);

            // At the end of "Test"
            expect(ctx.tokenBefore?.type).toBe("LITERAL");
            expect(ctx.tokenAt).toBeUndefined();
        });
    });

    describe("segmentTokens", () => {
        it("should include only tokens from current segment", () => {
            const ctx = getContext("Root:A:B", 6);

            expect(ctx.segmentIndex).toBe(1);
            expect(ctx.segmentTokens.length).toBe(1);
            expect(ctx.segmentTokens[0].type).toBe("LITERAL");
        });

        it("should handle segment with multiple tokens", () => {
            const ctx = getContext("Root:(A|B)", 8);

            expect(ctx.segmentIndex).toBe(1);
            // LPAREN, LITERAL(A), OR, LITERAL(B), RPAREN
            expect(ctx.segmentTokens.length).toBe(5);
        });

        it("should handle empty segment", () => {
            const ctx = getContext("Root:", 5);

            expect(ctx.segmentIndex).toBe(1);
            expect(ctx.segmentTokens.length).toBe(0);
        });
    });

    describe("stack tracking", () => {
        it("should have empty stack for simple query", () => {
            const ctx = getContext("Root:A", 6);

            expect(ctx.stack).toEqual([]);
        });

        it("should track LPAREN in stack", () => {
            const ctx = getContext("Root:(A", 7);

            expect(ctx.stack).toEqual(["LPAREN"]);
        });

        it("should track LBRACE in stack", () => {
            const ctx = getContext("Root:{A", 7);

            expect(ctx.stack).toEqual(["LBRACE"]);
        });

        it("should pop LPAREN on RPAREN", () => {
            const ctx = getContext("Root:(A)", 8);

            expect(ctx.stack).toEqual([]);
        });

        it("should pop LBRACE on RBRACE", () => {
            const ctx = getContext("Root:{A}", 8);

            expect(ctx.stack).toEqual([]);
        });

        it("should track nested groups", () => {
            const ctx = getContext("Root:((A", 8);

            expect(ctx.stack).toEqual(["LPAREN", "LPAREN"]);
        });

        it("should track nested groups with close", () => {
            const ctx = getContext("Root:((A)", 9);

            expect(ctx.stack).toEqual(["LPAREN"]);
        });

        it("should handle mixed nesting", () => {
            const ctx = getContext("Root:({A", 8);

            expect(ctx.stack).toEqual(["LPAREN", "LBRACE"]);
        });

        it("should only pop matching bracket", () => {
            const ctx = getContext("Root:(A}", 8);

            // LBRACE doesn't match LPAREN, so LPAREN stays
            expect(ctx.stack).toEqual(["LPAREN"]);
        });
    });

    describe("expectation determination", () => {
        it("should expect term at start of segment", () => {
            const ctx = getContext("Root:", 5);

            expect(ctx.expectation).toBe("term");
        });

        it("should expect term after LPAREN", () => {
            const ctx = getContext("Root:(", 6);

            expect(ctx.expectation).toBe("term");
        });

        it("should expect term after LBRACE", () => {
            const ctx = getContext("Root:{", 6);

            expect(ctx.expectation).toBe("term");
        });

        it("should expect term after OR", () => {
            const ctx = getContext("Root:A|", 7);

            expect(ctx.expectation).toBe("term");
        });

        it("should expect term after AND", () => {
            const ctx = getContext("Root:A&", 7);

            expect(ctx.expectation).toBe("term");
        });

        it("should expect term after COMMA", () => {
            const ctx = getContext("Root:{A,", 8);

            expect(ctx.expectation).toBe("term");
        });

        it("should expect comma inside set after term", () => {
            const ctx = getContext("Root:{A", 7);

            expect(ctx.expectation).toBe("comma");
        });

        it("should expect operator inside group after term", () => {
            const ctx = getContext("Root:(A", 7);

            expect(ctx.expectation).toBe("operator");
        });

        it("should expect delimiterOrEnd after term outside group/set", () => {
            const ctx = getContext("Root:A", 6);

            expect(ctx.expectation).toBe("delimiterOrEnd");
        });

        it("should expect operator in nested group", () => {
            const ctx = getContext("Root:((A", 8);

            expect(ctx.expectation).toBe("operator");
        });

        it("should expect comma in set inside group", () => {
            const ctx = getContext("Root:({A", 8);

            expect(ctx.expectation).toBe("comma");
        });
    });

    describe("replaceRange computation", () => {
        it("should return caret position for non-literal token", () => {
            const ctx = getContext("Root:|A", 6);

            expect(ctx.replaceRange).toEqual({ start: 6, end: 6 });
        });

        it("should return token range when caret is on literal", () => {
            const ctx = getContext("Root:Test", 7);

            expect(ctx.tokenAt?.type).toBe("LITERAL");
            expect(ctx.replaceRange).toEqual({ start: 5, end: 9 });
        });

        it("should return caret position when not on any token", () => {
            const ctx = getContext("Root:", 5);

            expect(ctx.replaceRange).toEqual({ start: 5, end: 5 });
        });

        it("should return token range at start of literal", () => {
            const ctx = getContext("Root:Test", 5);

            expect(ctx.tokenAt?.type).toBe("LITERAL");
            expect(ctx.replaceRange).toEqual({ start: 5, end: 9 });
        });

        it("should return token range at end of literal", () => {
            const ctx = getContext("Root:Test", 8);

            expect(ctx.tokenAt?.type).toBe("LITERAL");
            expect(ctx.replaceRange).toEqual({ start: 5, end: 9 });
        });
    });

    describe("complex query scenarios", () => {
        it("should handle query with set expression", () => {
            const ctx = getContext("Root:{A,B,C}", 10);

            expect(ctx.segmentIndex).toBe(1);
            expect(ctx.tokenAt?.type).toBe("LITERAL");
            expect(ctx.stack).toEqual(["LBRACE"]);
            expect(ctx.expectation).toBe("comma");
        });

        it("should handle query with binary operators", () => {
            const ctx = getContext("Root:(A|B)&C", 11);

            expect(ctx.segmentIndex).toBe(1);
            expect(ctx.tokenBefore?.type).toBe("AND");
            expect(ctx.stack).toEqual([]);
            expect(ctx.expectation).toBe("term");
        });

        it("should handle deeply nested expression", () => {
            const ctx = getContext("Root:((A|B)&(C|D))", 12);

            expect(ctx.segmentIndex).toBe(1);
            expect(ctx.stack).toEqual(["LPAREN"]);
            expect(ctx.expectation).toBe("operator");
        });

        it("should handle multi-segment query", () => {
            const ctx = getContext("Root:A:B:C", 8);

            expect(ctx.segmentIndex).toBe(2);
            expect(ctx.tokenAt?.type).toBe("LITERAL");
            expect(ctx.expectation).toBe("delimiterOrEnd");
        });

        it("should handle wildcard patterns", () => {
            const ctx = getContext("Root:Test*", 9);

            expect(ctx.segmentIndex).toBe(1);
            expect(ctx.tokenAt?.type).toBe("STAR");
        });

        it("should handle deep segment", () => {
            const ctx = getContext("Root:**:A", 7);

            expect(ctx.segmentIndex).toBe(2);
        });
    });

    describe("edge cases", () => {
        it("should handle empty query", () => {
            const ctx = getContext("", 0);

            expect(ctx.segmentIndex).toBe(0);
            expect(ctx.segmentTokens.length).toBe(0);
            expect(ctx.tokenBefore).toBeUndefined();
            expect(ctx.tokenAt).toBeUndefined();
            expect(ctx.tokenAfter).toBeUndefined();
            expect(ctx.expectation).toBe("term");
        });

        it("should handle single character query", () => {
            const ctx = getContext("A", 1);

            expect(ctx.segmentIndex).toBe(0);
            expect(ctx.tokenBefore?.type).toBe("LITERAL");
        });

        it("should handle query with only delimiter", () => {
            const ctx = getContext(":", 1);

            expect(ctx.segmentIndex).toBe(1);
            expect(ctx.expectation).toBe("term");
        });

        it("should handle query with unclosed group", () => {
            const ctx = getContext("Root:(A|B", 9);

            expect(ctx.stack).toEqual(["LPAREN"]);
            expect(ctx.expectation).toBe("operator");
        });

        it("should handle query with unclosed set", () => {
            const ctx = getContext("Root:{A,B", 9);

            expect(ctx.stack).toEqual(["LBRACE"]);
            expect(ctx.expectation).toBe("comma");
        });

        it("should handle caret beyond text length", () => {
            const ctx = getContext("Root", 100);

            expect(ctx.caretOffset).toBe(4);
            expect(ctx.tokenBefore?.type).toBe("LITERAL");
        });

        it("should handle multiple delimiters in a row", () => {
            const ctx = getContext("Root::", 5);

            expect(ctx.segmentIndex).toBe(1);
            expect(ctx.expectation).toBe("term");
        });
    });
});
