import type { Atom, Expr } from "../ast/ast";
import type { Token } from "../lexer";
import type { SegmentSpan } from "../segments";
import type { Diagnostic } from "../types/diagnostics";
import { errorExpr, mergeRanges, operatorFromToken, precedence } from "./utils";

export class SegmentParser {
    private _index: number = 0;
    private _tokens: readonly Token[];
    private _span: SegmentSpan;
    private _diagnostics: Diagnostic[] = [];

    constructor(tokens: readonly Token[], span: SegmentSpan) {
        this._tokens = tokens;
        this._span = span;
    }

    getIndex(): number {
        return this._index;
    }

    getDiagnostics(): Diagnostic[] {
        return this._diagnostics;
    }

    private currentToken(): Token | null {
        return this._tokens[this._index] ?? null;
    }

    private previousToken(): Token | null {
        return this._tokens[this._index - 1] ?? null;
    }

    private atEnd(): boolean {
        return this._index >= this._tokens.length;
    }

    private advance(): Token | null {
        if (!this.atEnd()) {
            this._index++;
        }

        return this.previousToken();
    }

    private match(type: Token["type"]): boolean {
        const token = this.currentToken();
        if (token && token.type === type) {
            this.advance();
            return true;
        }
        return false;
    }

    private isStopToken(token: Token | null): boolean {
        if (!token) {
            return true;
        }

        return (
            token.type === "COMMA" ||
            token.type === "RPAREN" ||
            token.type === "RBRACE"
        );
    }

    parseExpression(minPrecedence: number = 0): Expr {
        let left = this.parseTerm();

        while (!this.atEnd()) {
            const token = this.currentToken();
            if (!token) {
                break;
            }

            const prec = precedence(token);
            if (prec < minPrecedence) {
                break;
            }

            const binaryOperators: Token["type"][] = ["OR"];

            if (!binaryOperators.includes(token.type)) {
                break;
            }

            const operatorToken = token;
            this.advance();

            const right = this.parseExpression(prec + 1);

            left = {
                kind: "binary",
                operator: operatorFromToken(operatorToken),
                left,
                right,
                charRange: mergeRanges(left.charRange, right.charRange),
            };
        }

        return left;
    }

    parseTerm(): Expr {
        // A term is a sequence of concatenated primaries (patterns, groups, sets)
        // e.g., "A(B|C)D{1,2}" => concatenate A, (B|C), D, {1,2}
        const parts: Expr[] = [];

        while (true) {
            const token = this.currentToken();

            if (token?.type === "DELIMITER") {
                this.advance(); // consume so we can continue parsing
                this._diagnostics.push({
                    charRange: token.charRange,
                    message: `Delimiter '${token.value}' separates segments and cannot appear inside groups/sets.`,
                    severity: "error",
                });
                return errorExpr(
                    `Unexpected delimiter '${token.value}'.`,
                    token.charRange
                );
            }

            if (this.isStopToken(token) || token?.type === "OR") {
                // Stop parsing the term
                break;
            }

            if (!token) {
                break;
            }

            parts.push(this.parsePrimary());
        }

        if (parts.length === 0) {
            const token = this.currentToken();
            const range = token ? token.charRange : this._span.charRange;

            this._diagnostics.push({
                charRange: range,
                message: "Unexpected end of segment",
                severity: "error",
            });

            return errorExpr("Unexpected end of segment", range);
        }

        if (parts.length === 1) {
            return parts[0];
        }

        // Multiple parts - use a concatenation

        // Flatten concatenations to avoid deep nesting
        const flattenedParts: Expr[] = [];
        for (const part of parts) {
            if (part.kind === "concat") {
                flattenedParts.push(...part.parts);
            } else {
                flattenedParts.push(part);
            }
        }

        return {
            kind: "concat",
            parts: flattenedParts,
            charRange: mergeRanges(
                flattenedParts[0].charRange,
                flattenedParts[flattenedParts.length - 1].charRange
            ),
        };
    }

    parsePrimary(): Expr {
        const token = this.currentToken();
        if (!token) {
            this._diagnostics.push({
                charRange: this._span.charRange,
                message: "Unexpected end of segment",
                severity: "error",
            });

            return errorExpr("Unexpected end of segment", this._span.charRange);
        }

        if (this.match("LPAREN")) {
            const open = token;

            const inner = this.parseExpression(0);

            let closed = false;
            if (this.match("RPAREN")) {
                closed = true;
            } else {
                closed = false;
                this._diagnostics.push({
                    charRange: {
                        start: open.charRange.start,
                        end: this._span.charRange.end,
                    },
                    message: "Unclosed group, missing closing parenthesis ')'",
                    severity: "error",
                });
            }

            const endRange = closed
                ? this.previousToken()!.charRange
                : this._span.charRange;

            return {
                kind: "group",
                expr: inner,
                closed,
                charRange: mergeRanges(open.charRange, endRange),
            };
        }

        if (this.match("LBRACE")) {
            const open = token;

            const items: Expr[] = [];
            let closed = false;

            if (this.match("RBRACE")) {
                closed = true;
            } else {
                // Parse first item
                items.push(this.parseExpression(0));

                // More items are separated by commas
                while (this.match("COMMA")) {
                    items.push(this.parseExpression(0));
                }

                if (this.match("RBRACE")) {
                    closed = true;
                } else {
                    closed = false;
                    this._diagnostics.push({
                        charRange: {
                            start: open.charRange.start,
                            end: this._span.charRange.end,
                        },
                        message: "Unclosed set, missing closing brace '}'",
                        severity: "error",
                    });
                }
            }

            const endRange = closed
                ? this.previousToken()!.charRange
                : this._span.charRange;

            return {
                kind: "set",
                items,
                closed,
                charRange: mergeRanges(open.charRange, endRange),
            };
        }

        // Otherwise, it should be a pattern
        return this.parsePattern();
    }

    parsePattern(): Expr {
        const atoms: Atom[] = [];

        while (!this.atEnd()) {
            const token = this.currentToken();
            if (!token) {
                break;
            }

            if (token.type === "DELIMITER") {
                this.advance();
                this._diagnostics.push({
                    charRange: token.charRange,
                    message: `Delimiter '${token.value}' is only allowed between segments (top level).`,
                    severity: "error",
                });
                break; // or continue; depending on how you want recovery
            }

            // Stop when we reach a token that cannot be part of a pattern
            const excludedTypes: Token["type"][] = [
                "OR",
                "COMMA",
                "LPAREN",
                "RPAREN",
                "LBRACE",
                "RBRACE",
                "DELIMITER",
                "DEEP", // should not happen inside patterns, but just in case
            ];
            if (excludedTypes.includes(token.type)) {
                break;
            }

            if (token.type === "LITERAL") {
                this.advance();
                atoms.push({
                    kind: "literal",
                    text: token.value,
                    charRange: token.charRange,
                });
                continue;
            }

            if (token.type === "STAR") {
                this.advance();
                atoms.push({
                    kind: "star",
                    charRange: token.charRange,
                });
                continue;
            }

            if (token.type === "QMARK") {
                this.advance();
                atoms.push({
                    kind: "qmark",
                    charRange: token.charRange,
                });
                continue;
            }

            // If we reach here, it's an unexpected token
            this._diagnostics.push({
                charRange: token.charRange,
                message: `Unexpected token '${token.value}' in pattern`,
                severity: "error",
            });
            this.advance();
        }

        if (atoms.length === 0) {
            const token = this.currentToken();
            const range = token ? token.charRange : this._span.charRange;

            this._diagnostics.push({
                charRange: range,
                message: "Expected a pattern",
                severity: "error",
            });

            return errorExpr("Expected a pattern", range);
        }

        const first = atoms[0];
        const last = atoms[atoms.length - 1];

        return {
            kind: "pattern",
            atoms,
            charRange: mergeRanges(first.charRange, last.charRange),
        };
    }
}
