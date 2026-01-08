import { clamp } from "../../../utils/clamp";
import { isGroupToken, type Token } from "../lexer";
import type { ParsedQuery } from "../parse";
import type { SegmentSpan } from "../segments";
import type { Range } from "../types/range";

export type Expectation = "term" | "operator" | "comma" | "delimiterOrEnd";

export type CaretContext = {
    caretOffset: number;

    segmentIndex: number;
    segment: SegmentSpan;
    segmentTokens: Token[];

    tokenBefore?: Token;
    tokenAt?: Token;
    tokenAfter?: Token;

    stack: Token[];
    insideGroup: boolean;
    insideSet: boolean;

    expectation: Expectation;

    replaceRange: Range;

    isEmptySegment: boolean;
};

export function getCaretContext(
    parsed: ParsedQuery,
    caretOffset: number
): CaretContext {
    const caret = clamp(caretOffset, 0, parsed.text.length);

    const segmentIndex = findSegmentIndex(parsed.segments, caret);
    const segment = parsed.segments[segmentIndex];

    const segmentTokens = parsed.tokens.slice(
        segment.tokenStartIndex,
        segment.tokenEndIndex
    );

    let tokenAt: Token | undefined;
    let tokenBefore: Token | undefined;
    let tokenAfter: Token | undefined;

    let stack: Token[] = [];

    for (let i = segment.tokenStartIndex; i < segment.tokenEndIndex; i++) {
        const token = parsed.tokens[i];

        if (!tokenAt) {
            if (isGroupToken(token)) {
                if (!token.refTokenId) {
                    stack.push(token);
                } else if (!stack.find((t) => t.id === token.refTokenId)) {
                    stack.push(token);
                } else {
                    stack = stack.filter((t) => t.id !== token.refTokenId);
                }
            }
        }

        if (token.charRange.end < caret) {
            tokenBefore = token;
        }
        // charRange.end is exclusive
        if (token.charRange.start < caret && caret <= token.charRange.end) {
            tokenAt = token;
        }
        if (token.charRange.start >= caret) {
            tokenAfter = token;
            break;
        }
    }

    const prevSignificantToken =
        tokenAt && isSignificantToken(tokenAt) ? tokenAt : null;

    const insideGroup = stack.find((t) => t.type === "LPAREN") !== undefined;
    const insideSet = stack.find((t) => t.type === "LBRACE") !== undefined;

    const expectation = determineExpectation(
        prevSignificantToken,
        insideGroup,
        insideSet
    );

    const replaceRange = computeReplaceRange(tokenAt, caret);

    return {
        caretOffset: caret,
        segmentIndex,
        segment,
        segmentTokens,
        tokenBefore,
        tokenAt,
        tokenAfter,
        stack,
        insideGroup,
        insideSet,
        expectation,
        replaceRange,
        isEmptySegment: segment.tokenStartIndex === segment.tokenEndIndex,
    };
}

function findSegmentIndex(
    segments: SegmentSpan[],
    caretOffset: number
): number {
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const range = segment.charRange;
        if (caretOffset < range.start) {
            continue;
        }
        if (caretOffset > range.end) {
            continue;
        }

        if (
            caretOffset === range.end &&
            i + 1 < segments.length &&
            segments[i + 1].charRange.start === caretOffset
        ) {
            return i + 1;
        }

        return i;
    }

    // If caret is beyond all segments, return the last segment
    return Math.max(0, segments.length - 1);
}

// @ts-expect-error: This is intentional as we are not using the token parameter yet
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isSignificantToken(token: Token): boolean {
    // If there are more token types that are not significant, add them here
    return true;
}

function determineExpectation(
    token: Token | null,
    insideGroup: boolean,
    insideSet: boolean
): Expectation {
    if (!token) {
        return "term";
    }

    if (token.type === "LITERAL") {
        if (insideGroup) {
            return "operator";
        }
        if (insideSet) {
            return "comma";
        }
        return "term";
    }

    const tokensThatExpectTerm: Token["type"][] = [
        "LPAREN",
        "LBRACE",
        "OR",
        "AND",
        "COMMA",
        "LITERAL",
    ];
    if (tokensThatExpectTerm.includes(token.type)) {
        return "term";
    }

    if (insideSet) {
        return "comma";
    }

    if (insideGroup) {
        return "operator";
    }

    return "delimiterOrEnd";
}

function computeReplaceRange(
    tokenAt: Token | undefined,
    caretOffset: number
): Range {
    if (tokenAt?.type === "LITERAL") {
        return tokenAt.charRange;
    }

    return { start: caretOffset, end: caretOffset };
}
