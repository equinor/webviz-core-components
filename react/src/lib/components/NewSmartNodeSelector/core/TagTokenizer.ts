/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
    TagToken,
    DelimiterToken,
    SegmentToken,
    LiteralSegmentToken,
    WildcardSegmentToken,
    DeepWildcardSegmentToken,
    CharWildcardSegmentToken,
    GlobSegmentToken,
    GroupToken,
    SetToken,
    OperatorToken,
    UnionOperatorToken,
    IntersectionOperatorToken,
    CommaOperatorToken,
    OpenParenToken,
    CloseParenToken,
    OpenBraceToken,
    CloseBraceToken,
    CharWildcardLiteralToken,
    CharWildcardToken,
    GlobLiteralToken,
    GlobWildcardToken,
} from "./types/Token";

/**
 * Tokenizes tag strings into Token AST for GUI/editor features
 */
export class TagTokenizer {
    private _delimiter: string;
    private _position: number = 0;

    constructor(delimiter: string = ":") {
        this._delimiter = delimiter;
    }

    /**
     * Tokenize a tag string into Token AST
     */
    tokenize(tag: string): TagToken {
        this._position = 0;
        const children: (SegmentToken | DelimiterToken)[] = [];
        const start = 0;

        while (this._position < tag.length) {
            // Parse all segments until we hit a delimiter or end
            // This allows for multiple segment tokens between delimiters (e.g., "Data Source (A|B)")
            while (this._position < tag.length && tag[this._position] !== this._delimiter) {
                const segment = this.parseSegment(tag);
                children.push(segment);
            }

            // Check for delimiter after segment(s)
            if (this._position < tag.length && tag[this._position] === this._delimiter) {
                const delimiterStart = this._position;
                this._position++;
                children.push({
                    type: "DELIMITER",
                    value: this._delimiter,
                    start: delimiterStart,
                    end: this._position,
                });
            }
        }

        return {
            type: "TAG",
            children,
            start,
            end: tag.length,
        };
    }

    /**
     * Parse a single segment (everything between delimiters or until end)
     */
    private parseSegment(tag: string): SegmentToken {
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

            // Parse member (stop at operators or closing paren)
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
                children.push(this.parseMemberSegment(memberText, memberStart));
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

            // Parse member (stop at comma or closing brace)
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
                children.push(this.parseMemberSegment(memberText, memberStart));
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
    private parseMemberSegment(text: string, start: number): SegmentToken {
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
    private parseLiteralOrWildcardSegment(tag: string, start: number): SegmentToken {
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
    private parseCharWildcardPattern(text: string, start: number): CharWildcardSegmentToken {
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
