import type { Token } from "./lexer";
import type { Diagnostic } from "./types/diagnostics";
import type { Range } from "./types/range";

export type SegmentSpan = {
    tokenStartIndex: number; // inclusive
    tokenEndIndex: number; // exclusive
    charRange: Range;
};

export type SplitSegmentsResult = {
    segments: SegmentSpan[];
    diagnostics: Diagnostic[];
};

type StackEntry = {
    type: "LPAREN" | "LBRACE";
    tokenIndex: number;
};

export function splitSegments(
    tokens: Token[],
    delimiter: string,
    textLength: number
): SplitSegmentsResult {
    const segments: SegmentSpan[] = [];
    const diagnostics: Diagnostic[] = [];

    const stack: StackEntry[] = [];

    let segmentTokenStartIndex = 0;
    let segmentCharStart = 0;

    function makeSegment(
        tokenEndIndexExclusive: number,
        charEnd: number
    ): SegmentSpan {
        const tokenStartIndex = segmentTokenStartIndex;
        const tokenEndIndex = tokenEndIndexExclusive;

        let charRangeStart: number;
        let charRangeEnd: number;

        if (tokenStartIndex < tokenEndIndex) {
            charRangeStart = tokens[tokenStartIndex].charRange.start;
            charRangeEnd = tokens[tokenEndIndex - 1].charRange.end;
        } else {
            charRangeStart = segmentCharStart;
            charRangeEnd = charEnd;
        }

        return {
            tokenStartIndex,
            tokenEndIndex,
            charRange: {
                start: charRangeStart,
                end: charRangeEnd,
            },
        };
    }

    function pushSegment(
        tokenEndIndexExclusive: number,
        charEnd: number
    ): void {
        const segment = makeSegment(tokenEndIndexExclusive, charEnd);
        segments.push(segment);

        if (segment.tokenStartIndex === segment.tokenEndIndex) {
            const start = segment.charRange.start;
            const end = segment.charRange.end;

            const widenedRange: Range =
                start === end
                    ? { start, end: Math.min(start + 1, textLength) }
                    : { start, end };

            diagnostics.push({
                charRange: widenedRange,
                message: "Empty segment",
                severity: "error",
            });
        }
    }

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        switch (token.type) {
            case "LPAREN":
                stack.push({ type: "LPAREN", tokenIndex: i });
                break;
            case "LBRACE":
                stack.push({ type: "LBRACE", tokenIndex: i });
                break;
            case "RPAREN": {
                const top = stack[stack.length - 1];
                if (top?.type === "LPAREN") {
                    stack.pop();
                } else {
                    diagnostics.push({
                        charRange: token.charRange,
                        message: "Unmatched closing parenthesis",
                        severity: "error",
                    });
                }
                break;
            }
            case "RBRACE": {
                const top = stack[stack.length - 1];
                if (top?.type === "LBRACE") {
                    stack.pop();
                } else {
                    diagnostics.push({
                        charRange: token.charRange,
                        message: "Unmatched closing brace",
                        severity: "error",
                    });
                }
                break;
            }
            case "DELIMITER":
                if (stack.length === 0 && token.value === delimiter) {
                    // Found a delimiter at the top level, split here
                    pushSegment(i, token.charRange.start);

                    // Next segment starts after this token
                    segmentTokenStartIndex = i + 1;
                    segmentCharStart = token.charRange.end;
                }
                break;
            default:
                // Other tokens, do nothing
                break;
        }
    }

    // Always push the final segment (may be empty)
    pushSegment(tokens.length, textLength);

    return { segments, diagnostics };
}
