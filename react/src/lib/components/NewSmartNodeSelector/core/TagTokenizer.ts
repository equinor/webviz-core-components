/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
    QueryToken,
    DelimiterToken,
    SegmentChildToken,
    CharWildcardToken,
    CharWildcardSegmentToken,
    GlobSegmentToken,
    GroupToken,
    SetToken,
    OperatorToken,
    OpenParenToken,
    CloseParenToken,
    OpenBraceToken,
    CloseBraceToken,
    CharWildcardLiteralToken,
    GlobLiteralToken,
    GlobWildcardToken,
    SegmentToken,
} from "./types/Token";

/**
 * Tokenizes tag strings into Token AST for GUI/editor features
 */
export class QueryTokenizer {
    private _delimiter: string;
    private _position: number = 0;

    constructor(delimiter: string = ":") {
        this._delimiter = delimiter;
    }

    /**
     * Tokenize a tag string into Token AST
     */
    tokenize(query: string): QueryToken {
        this._position = 0;
        const children: (SegmentToken | DelimiterToken)[] = [];
        const start = 0;

        // Special case: empty string should have one empty segment
        if (query.length === 0) {
            children.push({
                type: "SEGMENT",
                children: [
                    {
                        type: "LITERAL",
                        value: "",
                        start: 0,
                        end: 0,
                    },
                ],
                start: 0,
                end: 0,
            });
            return {
                type: "QUERY",
                children,
                start,
                end: 0,
            };
        }

        // Track if we need to add an empty segment at the current position
        let needsSegment = true;

        while (this._position < query.length) {
            // Check if we're at a delimiter
            if (query[this._position] === this._delimiter) {
                // If we need a segment (because we're at start or just after a delimiter), add empty segment
                if (needsSegment) {
                    children.push({
                        type: "SEGMENT",
                        children: [
                            {
                                type: "LITERAL",
                                value: "",
                                start: this._position,
                                end: this._position,
                            },
                        ],
                        start: this._position,
                        end: this._position,
                    });
                }

                // Add the delimiter
                const delimiterStart = this._position;
                this._position++;
                children.push({
                    type: "DELIMITER",
                    value: this._delimiter,
                    start: delimiterStart,
                    end: this._position,
                });

                // After a delimiter, we need a segment
                needsSegment = true;
            } else {
                // Parse entire segment (collect all tokens until delimiter or end)
                const segmentStart = this._position;
                const segmentChildren: SegmentChildToken[] = [];

                while (
                    this._position < query.length &&
                    query[this._position] !== this._delimiter
                ) {
                    const token = this.parseSegmentChild(query);
                    segmentChildren.push(token);
                }

                children.push({
                    type: "SEGMENT",
                    children: segmentChildren,
                    start: segmentStart,
                    end: this._position,
                });
                needsSegment = false;
            }
        }

        // If we ended with a delimiter, add an empty segment
        if (needsSegment) {
            children.push({
                type: "SEGMENT",
                children: [
                    {
                        type: "LITERAL",
                        value: "",
                        start: query.length,
                        end: query.length,
                    },
                ],
                start: query.length,
                end: query.length,
            });
        }

        return {
            type: "QUERY",
            children,
            start,
            end: query.length,
        };
    }

    /**
     * Parse a single segment child token (called within a segment, stops at delimiters)
     */
    private parseSegmentChild(tag: string): SegmentChildToken {
        const start = this._position;

        // Check for deep wildcard: **
        if (tag.slice(this._position, this._position + 2) === "**") {
            this._position += 2;
            return {
                type: "DEEP_WILDCARD",
                value: "**",
                start,
                end: this._position,
            };
        }

        // Check for single wildcard: * (and not followed by another *)
        if (tag[this._position] === "*" && tag[this._position + 1] !== "*") {
            this._position++;
            return {
                type: "WILDCARD",
                value: "*",
                start,
                end: this._position,
            };
        }

        // Check for group: (...)
        if (tag[this._position] === "(") {
            return this.parseGroup(tag, start);
        }

        // Check for set: {...}
        if (tag[this._position] === "{") {
            return this.parseSet(tag, start);
        }

        // Parse literal or wildcard pattern segment
        return this.parseLiteralOrWildcardSegment(tag, start);
    }

    /**
     * Parse group: (A|B|C) or (A&B)
     */
    private parseGroup(tag: string, start: number): GroupToken {
        const openParenStart = this._position;
        this._position++; // Skip '('

        const openParen: OpenParenToken = {
            type: "OPEN_PAREN",
            value: "(",
            start: openParenStart,
            end: this._position,
        };

        const children: (SegmentToken | OperatorToken)[] = [];

        // Parse members and operators until we hit ')'
        while (this._position < tag.length && tag[this._position] !== ")") {
            // Check for operator before parsing next member
            if (children.length > 0) {
                if (tag[this._position] === "|") {
                    const opStart = this._position;
                    this._position++;
                    children.push({
                        type: "UNION_OPERATOR",
                        value: "|",
                        start: opStart,
                        end: this._position,
                    });
                } else if (tag[this._position] === "&") {
                    const opStart = this._position;
                    this._position++;
                    children.push({
                        type: "INTERSECTION_OPERATOR",
                        value: "&",
                        start: opStart,
                        end: this._position,
                    });
                }
            }

            // Parse member segment (stop at operators or closing paren)
            const memberStart = this._position;
            let memberText = "";

            while (
                this._position < tag.length &&
                tag[this._position] !== "|" &&
                tag[this._position] !== "&" &&
                tag[this._position] !== ")"
            ) {
                memberText += tag[this._position];
                this._position++;
            }

            if (memberText) {
                const segmentChild = this.parseMemberSegmentChild(
                    memberText,
                    memberStart
                );
                children.push({
                    type: "SEGMENT",
                    children: [segmentChild],
                    start: memberStart,
                    end: this._position,
                });
            }
        }

        const closeParenStart = this._position;
        if (this._position < tag.length && tag[this._position] === ")") {
            this._position++; // Skip ')'
        }

        const closeParen: CloseParenToken = {
            type: "CLOSE_PAREN",
            value: ")",
            start: closeParenStart,
            end: this._position,
        };

        return {
            type: "GROUP",
            openParen,
            children,
            closeParen,
            start,
            end: this._position,
        };
    }

    /**
     * Parse set: {A,B,C}
     */
    private parseSet(tag: string, start: number): SetToken {
        const openBraceStart = this._position;
        this._position++; // Skip '{'

        const openBrace: OpenBraceToken = {
            type: "OPEN_BRACE",
            value: "{",
            start: openBraceStart,
            end: this._position,
        };

        const children: (SegmentToken | OperatorToken)[] = [];

        // Parse members and commas until we hit '}'
        while (this._position < tag.length && tag[this._position] !== "}") {
            // Check for comma before parsing next member
            if (children.length > 0 && tag[this._position] === ",") {
                const opStart = this._position;
                this._position++;
                children.push({
                    type: "COMMA_OPERATOR",
                    value: ",",
                    start: opStart,
                    end: this._position,
                });
            }

            // Parse member segment (stop at comma or closing brace)
            const memberStart = this._position;
            let memberText = "";

            while (
                this._position < tag.length &&
                tag[this._position] !== "," &&
                tag[this._position] !== "}"
            ) {
                memberText += tag[this._position];
                this._position++;
            }

            if (memberText) {
                const segmentChild = this.parseMemberSegmentChild(
                    memberText,
                    memberStart
                );
                children.push({
                    type: "SEGMENT",
                    children: [segmentChild],
                    start: memberStart,
                    end: this._position,
                });
            }
        }

        const closeBraceStart = this._position;
        if (this._position < tag.length && tag[this._position] === "}") {
            this._position++; // Skip '}'
        }

        const closeBrace: CloseBraceToken = {
            type: "CLOSE_BRACE",
            value: "}",
            start: closeBraceStart,
            end: this._position,
        };

        return {
            type: "SET",
            openBrace,
            children,
            closeBrace,
            start,
            end: this._position,
        };
    }

    /**
     * Parse a member within a group or set (can be literal or wildcard pattern)
     */
    private parseMemberSegmentChild(
        text: string,
        start: number
    ): SegmentChildToken {
        // Check for wildcards in the text
        if (text.includes("*")) {
            return this.parseGlobPattern(text, start);
        }

        if (text.includes("?")) {
            return this.parseCharWildcardPattern(text, start);
        }

        // Plain literal
        return {
            type: "LITERAL",
            value: text,
            start,
            end: start + text.length,
        };
    }

    /**
     * Parse literal or wildcard pattern segment (until delimiter, group/set boundary, or end)
     */
    private parseLiteralOrWildcardSegment(
        tag: string,
        start: number
    ): SegmentChildToken {
        let text = "";

        // Read until delimiter, group/set boundary, or end
        while (
            this._position < tag.length &&
            tag[this._position] !== this._delimiter &&
            tag[this._position] !== "(" &&
            tag[this._position] !== "{" &&
            tag[this._position] !== ")" &&
            tag[this._position] !== "}"
        ) {
            text += tag[this._position];
            this._position++;
        }

        // Check what type of segment this is
        if (text.includes("*")) {
            return this.parseGlobPattern(text, start);
        }

        if (text.includes("?")) {
            return this.parseCharWildcardPattern(text, start);
        }

        // Plain literal
        return {
            type: "LITERAL",
            value: text,
            start,
            end: this._position,
        };
    }

    /**
     * Parse glob pattern: "Sub*node" or "Node*"
     */
    private parseGlobPattern(text: string, start: number): GlobSegmentToken {
        const children: (GlobLiteralToken | GlobWildcardToken)[] = [];
        let currentLiteral = "";
        let pos = 0;

        for (const char of text) {
            if (char === "*") {
                // Push accumulated literal if any
                if (currentLiteral) {
                    children.push({
                        type: "GLOB_LITERAL",
                        value: currentLiteral,
                        start: start + pos - currentLiteral.length,
                        end: start + pos,
                    });
                    currentLiteral = "";
                }

                // Push wildcard
                children.push({
                    type: "GLOB_WILDCARD",
                    value: "*",
                    start: start + pos,
                    end: start + pos + 1,
                });
            } else {
                currentLiteral += char;
            }
            pos++;
        }

        // Push remaining literal if any
        if (currentLiteral) {
            children.push({
                type: "GLOB_LITERAL",
                value: currentLiteral,
                start: start + pos - currentLiteral.length,
                end: start + pos,
            });
        }

        return {
            type: "GLOB",
            children,
            start,
            end: start + text.length,
        };
    }

    /**
     * Parse char wildcard pattern: "Node-?"
     */
    private parseCharWildcardPattern(
        text: string,
        start: number
    ): CharWildcardSegmentToken {
        const children: (CharWildcardLiteralToken | CharWildcardToken)[] = [];
        let currentLiteral = "";
        let pos = 0;

        for (const char of text) {
            if (char === "?") {
                // Push accumulated literal if any
                if (currentLiteral) {
                    children.push({
                        type: "CHAR_WILDCARD_LITERAL",
                        value: currentLiteral,
                        start: start + pos - currentLiteral.length,
                        end: start + pos,
                    });
                    currentLiteral = "";
                }

                // Push wildcard
                children.push({
                    type: "CHAR_WILDCARD_CHAR",
                    value: "?",
                    start: start + pos,
                    end: start + pos + 1,
                });
            } else {
                currentLiteral += char;
            }
            pos++;
        }

        // Push remaining literal if any
        if (currentLiteral) {
            children.push({
                type: "CHAR_WILDCARD_LITERAL",
                value: currentLiteral,
                start: start + pos - currentLiteral.length,
                end: start + pos,
            });
        }

        return {
            type: "CHAR_WILDCARD",
            children,
            start,
            end: start + text.length,
        };
    }
}
