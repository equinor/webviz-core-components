import { clamp } from "../../../utils/clamp";
import type { Token } from "../lexer";
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

    stack: ("LPAREN" | "LBRACE")[];

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

    const stack: ("LPAREN" | "LBRACE")[] = [];

    for (let i = segment.tokenStartIndex; i < segment.tokenEndIndex; i++) {
        const token = parsed.tokens[i];

        switch (token.type) {
            case "LPAREN":
                stack.push("LPAREN");
                break;
            case "LBRACE":
                stack.push("LBRACE");
                break;
            case "RPAREN":
                if (stack.at(stack.length - 1) === "LPAREN") {
                    stack.pop();
                }
                break;
            case "RBRACE":
                if (stack.at(stack.length - 1) === "LBRACE") {
                    stack.pop();
                }
                break;
            default:
                break;
        }

        if (token.charRange.end <= caret) {
            tokenBefore = token;
        }
        // charRange.end is exclusive
        if (token.charRange.start <= caret && caret < token.charRange.end) {
            tokenAt = token;
        }
        if (token.charRange.start > caret) {
            tokenAfter = token;
            break;
        }
    }

    const prevSignificantToken =
        tokenBefore && isSignificantToken(tokenBefore) ? tokenBefore : null;

    const expectation = determineExpectation(prevSignificantToken, stack);

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
    prevToken: Token | null,
    stack: ("LPAREN" | "LBRACE")[]
): Expectation {
    const insideGroup = stack.includes("LPAREN");
    const insideSet = stack.includes("LBRACE");

    if (!prevToken) {
        return "term";
    }

    const tokensThatExpectTerm: Token["type"][] = [
        "LPAREN",
        "LBRACE",
        "OR",
        "AND",
        "COMMA",
    ];
    if (tokensThatExpectTerm.includes(prevToken.type)) {
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
