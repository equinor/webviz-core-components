import { clamp } from "../../../utils/clamp";
import type { Range } from "../../utils/range";
import type { Segment } from "../ast/ast";
import { isGroupToken, type Token } from "../lexer";
import type { ParsedQuery } from "../parse";
import type { SegmentSpan } from "../segments";

export type Expectation =
    | "unionFlag"
    | "term"
    | "operator"
    | "comma"
    | "delimiterOrEnd"
    | "attributeName"
    | "attributeValue";

export type AttributeFilterContext = {
    /** The attribute name being filtered (if already typed) */
    attributeName?: string;
    /** Whether we're after the '=' sign */
    afterEquals: boolean;
};

export type CaretContext = {
    caretOffset: number;

    segmentIndex: number;
    segment: SegmentSpan;
    segmentTokens: Token[];
    segmentAst: Segment;

    tokenBefore?: Token;
    tokenAt?: Token;
    tokenAfter?: Token;

    stack: Token[];
    insideGroup: boolean;
    insideSet: boolean;
    insideAttributeFilter: boolean;
    attributeFilterContext?: AttributeFilterContext;

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
    const insideAttributeFilter =
        stack.find((t) => t.type === "LSQUAREBRACKET") !== undefined;

    // Determine attribute filter context
    const attributeFilterContext = insideAttributeFilter
        ? getAttributeFilterContext(segmentTokens, stack, caret)
        : undefined;

    const expectation = determineExpectation(
        prevSignificantToken,
        insideGroup,
        insideSet,
        insideAttributeFilter,
        attributeFilterContext
    );

    const replaceRange = { start: caret, end: caret }; // computeReplaceRange(tokenAt, caret);

    return {
        caretOffset: caret,
        segmentIndex,
        segment,
        segmentAst: parsed.ast.segments[segmentIndex],
        segmentTokens,
        tokenBefore,
        tokenAt,
        tokenAfter,
        stack,
        insideGroup,
        insideSet,
        insideAttributeFilter,
        attributeFilterContext,
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

function getAttributeFilterContext(
    segmentTokens: Token[],
    stack: Token[],
    caret: number
): AttributeFilterContext {
    // Find the opening bracket token in the stack
    const openBracket = stack.find((t) => t.type === "LSQUAREBRACKET");
    if (!openBracket) {
        return { afterEquals: false };
    }

    // Find tokens after the opening bracket and before caret
    let attributeName: string | undefined;
    let afterEquals = false;

    for (const token of segmentTokens) {
        if (token.charRange.start < openBracket.charRange.start) {
            continue;
        }
        if (token.charRange.start >= caret) {
            break;
        }

        if (token.type === "LITERAL" && !afterEquals) {
            attributeName = token.value;
        }
        if (token.type === "EQUALS") {
            afterEquals = true;
        }
    }

    return { attributeName, afterEquals };
}

function determineExpectation(
    token: Token | null,
    insideGroup: boolean,
    insideSet: boolean,
    insideAttributeFilter: boolean,
    attributeFilterContext?: AttributeFilterContext
): Expectation {
    // Handle attribute filter context first
    if (insideAttributeFilter && attributeFilterContext) {
        if (!attributeFilterContext.afterEquals) {
            // After '[' but before '=' - expecting attribute name
            if (!token || token.type === "LSQUAREBRACKET") {
                return "attributeName";
            }
            // After attribute name, still expecting '=' (treat as attributeName for now)
            if (token.type === "LITERAL") {
                return "attributeName";
            }
        } else {
            // After '=' - expecting attribute value
            return "attributeValue";
        }
    }

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
        "LSQUAREBRACKET",
        "OR",
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
