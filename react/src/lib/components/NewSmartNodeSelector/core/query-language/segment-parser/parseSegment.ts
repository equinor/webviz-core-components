import type { Segment } from "../ast/ast";
import type { Token } from "../lexer";
import type { SegmentSpan } from "../segments";
import type { Diagnostic } from "../types/diagnostics";
import { SegmentParser } from "./SegmentParser";
import { errorExpr } from "./utils";

export type ParseSegmentResult = {
    segment: Segment;
    diagnostics: Diagnostic[];
};

export function parseSegment(
    tokens: Token[],
    span: SegmentSpan
): ParseSegmentResult {
    const diagnostics: Diagnostic[] = [];

    const segmentTokens = tokens.slice(
        span.tokenStartIndex,
        span.tokenEndIndex
    );

    // Empty segment
    if (segmentTokens.length === 0) {
        diagnostics.push({
            charRange: span.charRange,
            message: "Empty segment",
            severity: "error",
        });

        return {
            segment: {
                kind: "expr",
                expr: errorExpr("Empty segment", span.charRange),
                charRange: span.charRange,
            },
            diagnostics,
        };
    }

    // Deep segment rule: "**"
    const deepTokens = segmentTokens.filter((t) => t.type === "DEEP");
    if (deepTokens.length > 0) {
        const onlyOneDeepToken =
            segmentTokens.length === 1 && deepTokens.length === 1;

        if (onlyOneDeepToken) {
            return {
                segment: {
                    kind: "deep",
                    charRange: deepTokens[0].charRange,
                },
                diagnostics,
            };
        }

        diagnostics.push({
            charRange: deepTokens[0].charRange,
            message: "Deep segment '**' must be the only token in a segment",
            severity: "error",
        });

        return {
            segment: {
                kind: "expr",
                expr: errorExpr(
                    "Deep segment '**' must be the only token in a segment",
                    deepTokens[0].charRange
                ),
                charRange: span.charRange,
            },
            diagnostics,
        };
    }

    const parser = new SegmentParser(segmentTokens, span);
    const expr = parser.parseExpression(0);

    diagnostics.push(...parser.getDiagnostics());

    // If there are remaining tokens that weren't consumed and aren't just stop tokens,
    // report them (helps catch junk like "A ) B" etc).
    // (This is intentionally light; your parser will recover and continue.)
    const remaining = segmentTokens.slice(parser.getIndex());
    if (remaining.length > 0) {
        // If remaining starts with a stop token, it's often "expected" (e.g. parser ended at ')')
        // But at top-level segment, stop tokens are generally unexpected.
        const first = remaining[0];
        if (
            first.type === "RPAREN" ||
            first.type === "RBRACE" ||
            first.type === "COMMA"
        ) {
            diagnostics.push({
                charRange: first.charRange,
                message: `Unexpected token '${first.type}'.`,
                severity: "error",
            });
        }
    }

    return {
        segment: {
            kind: "expr",
            expr,
            charRange: span.charRange,
        },
        diagnostics,
    };
}
