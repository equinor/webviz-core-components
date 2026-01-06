/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Token-based AST for GUI/editor features
 *
 * This model is separate from the Query model (used for tree matching).
 * Token model supports: syntax highlighting, cursor positioning, validation feedback, and editor operations.
 *
 * Key design principles:
 * - Segments and delimiters are interleaved in a single children array
 * - Character spans track positions for cursor placement and highlighting
 * - Groups () and sets {} are always balanced (auto-close behavior)
 * - Three-layer hierarchy: Tag → Segment → Token
 */

/**
 * Base token with character span tracking
 */
export interface BaseToken {
    /** Character start position (inclusive) in the original string */
    start: number;
    /** Character end position (exclusive) in the original string */
    end: number;
    /** Whether this token is marked for deletion (selection state) */
    markedForDeletion?: boolean;
}

/**
 * Root token representing the entire tag
 * Contains interleaved segments and delimiters
 */
export interface QueryToken extends BaseToken {
    type: "QUERY";
    /** Interleaved segments and delimiters (e.g., [Segment, Delimiter, Segment, Delimiter, Segment]) */
    children: (SegmentToken | DelimiterToken)[];
}

/**
 * Delimiter token representing the path separator (e.g., ":")
 */
export interface DelimiterToken extends BaseToken {
    type: "DELIMITER";
    value: string;
}

export interface SegmentToken extends BaseToken {
    type: "SEGMENT";
    children: SegmentChildToken[];
}

/**
 * Segment token types
 */
export type SegmentChildToken =
    | LiteralSegmentToken
    | WildcardSegmentToken
    | DeepWildcardSegmentToken
    | CharWildcardSegmentToken
    | GlobSegmentToken
    | GroupToken
    | SetToken;

/**
 * Literal segment: "Node-1"
 */
export interface LiteralSegmentToken extends BaseToken {
    type: "LITERAL";
    value: string;
}

/**
 * Single level wildcard: "*"
 */
export interface WildcardSegmentToken extends BaseToken {
    type: "WILDCARD";
    value: "*";
}

/**
 * Deep wildcard: "**"
 */
export interface DeepWildcardSegmentToken extends BaseToken {
    type: "DEEP_WILDCARD";
    value: "**";
}

/**
 * Character wildcard pattern: "Node-?"
 * Interleaved literal chars and ? wildcards
 */
export interface CharWildcardSegmentToken extends BaseToken {
    type: "CHAR_WILDCARD";
    /** Interleaved literal and wildcard tokens */
    children: (CharWildcardLiteralToken | CharWildcardToken)[];
}

export interface CharWildcardLiteralToken extends BaseToken {
    type: "CHAR_WILDCARD_LITERAL";
    value: string;
}

export interface CharWildcardToken extends BaseToken {
    type: "CHAR_WILDCARD_CHAR";
    value: "?";
}

/**
 * Glob pattern: "Sub*node" or "Node*"
 * Interleaved literal chars and * wildcards
 */
export interface GlobSegmentToken extends BaseToken {
    type: "GLOB";
    /** Interleaved literal and wildcard tokens */
    children: (GlobLiteralToken | GlobWildcardToken)[];
}

export interface GlobLiteralToken extends BaseToken {
    type: "GLOB_LITERAL";
    value: string;
}

export interface GlobWildcardToken extends BaseToken {
    type: "GLOB_WILDCARD";
    value: "*";
}

/**
 * Group with parentheses: "(A|B|C)"
 * Always balanced - auto-close behavior ensures closing paren exists
 */
export interface GroupToken extends BaseToken {
    type: "GROUP";
    /** Opening parenthesis */
    openParen: OpenParenToken;
    /** Interleaved members and operators */
    children: (SegmentToken | OperatorToken)[];
    /** Closing parenthesis */
    closeParen: CloseParenToken;
}

export interface OpenParenToken extends BaseToken {
    type: "OPEN_PAREN";
    value: "(";
}

export interface CloseParenToken extends BaseToken {
    type: "CLOSE_PAREN";
    value: ")";
}

/**
 * Set with braces: "{A,B,C}"
 * Always balanced - auto-close behavior ensures closing brace exists
 */
export interface SetToken extends BaseToken {
    type: "SET";
    /** Opening brace */
    openBrace: OpenBraceToken;
    /** Interleaved members and operators (comma represents intersection) */
    children: (SegmentToken | OperatorToken)[];
    /** Closing brace */
    closeBrace: CloseBraceToken;
}

export interface OpenBraceToken extends BaseToken {
    type: "OPEN_BRACE";
    value: "{";
}

export interface CloseBraceToken extends BaseToken {
    type: "CLOSE_BRACE";
    value: "}";
}

/**
 * Operator tokens for combining members
 */
export type OperatorToken =
    | UnionOperatorToken
    | IntersectionOperatorToken
    | CommaOperatorToken;

/**
 * Union operator: "|"
 * Used in groups: "(A|B|C)"
 */
export interface UnionOperatorToken extends BaseToken {
    type: "UNION_OPERATOR";
    value: "|";
}

/**
 * Intersection operator: "&"
 * Used in groups: "(A&B&C)"
 */
export interface IntersectionOperatorToken extends BaseToken {
    type: "INTERSECTION_OPERATOR";
    value: "&";
}

/**
 * Comma operator: ","
 * Used in sets: "{A,B,C}" (represents intersection)
 */
export interface CommaOperatorToken extends BaseToken {
    type: "COMMA_OPERATOR";
    value: ",";
}

/**
 * Helper type for all token types
 */
export type Token =
    | QueryToken
    | DelimiterToken
    | SegmentToken
    | SegmentChildToken
    | CharWildcardLiteralToken
    | CharWildcardToken
    | GlobLiteralToken
    | GlobWildcardToken
    | OpenParenToken
    | CloseParenToken
    | OpenBraceToken
    | CloseBraceToken
    | OperatorToken;
