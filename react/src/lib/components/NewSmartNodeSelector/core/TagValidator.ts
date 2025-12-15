/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Error codes for validation failures
 */
export enum ValidationErrorCode {
    EMPTY_TAG = "EMPTY_TAG",
    FORBIDDEN_CHARACTERS = "FORBIDDEN_CHARACTERS",
    NESTED_BRACES = "NESTED_BRACES",
    UNMATCHED_OPENING_BRACE = "UNMATCHED_OPENING_BRACE",
    UNMATCHED_CLOSING_BRACE = "UNMATCHED_CLOSING_BRACE",
    EMPTY_SET = "EMPTY_SET",
    SET_TOO_FEW_ITEMS = "SET_TOO_FEW_ITEMS",
    EMPTY_SET_ITEM = "EMPTY_SET_ITEM",
    WILDCARD_IN_SET = "WILDCARD_IN_SET",
    TOO_MANY_ASTERISKS = "TOO_MANY_ASTERISKS",
    DEEP_WILDCARD_NOT_ALONE = "DEEP_WILDCARD_NOT_ALONE",
}

/**
 * Validates tag strings before parsing
 * Checks for syntax errors and provides helpful error messages
 */
export class TagValidator {
    private _delimiter: string;

    constructor(delimiter: string = ":") {
        this._delimiter = delimiter;
    }

    /**
     * Validate a tag string
     * Returns validation result with error code if invalid
     */
    validate(tag: string): ValidationResult {
        if (!tag || tag.trim() === "") {
            return {
                valid: false,
                errorCode: ValidationErrorCode.EMPTY_TAG,
                message: "Tag cannot be empty",
            };
        }

        // Check for invalid characters in tag (except within braces)
        const invalidCharsResult = this.checkInvalidCharacters(tag);
        if (!invalidCharsResult.valid) {
            return invalidCharsResult;
        }

        // Check for balanced braces
        const balancedBracesResult = this.checkBalancedBraces(tag);
        if (!balancedBracesResult.valid) {
            return balancedBracesResult;
        }

        // Check for valid set notation
        const setNotationResult = this.checkSetNotation(tag);
        if (!setNotationResult.valid) {
            return setNotationResult;
        }

        // Check for valid wildcard usage
        const wildcardResult = this.checkWildcards(tag);
        if (!wildcardResult.valid) {
            return wildcardResult;
        }

        return { valid: true };
    }

    /**
     * Check for invalid characters
     */
    private checkInvalidCharacters(tag: string): ValidationResult {
        // Characters that are not allowed anywhere
        const forbidden = /[<>]/;
        if (forbidden.test(tag)) {
            return {
                valid: false,
                errorCode: ValidationErrorCode.FORBIDDEN_CHARACTERS,
                message: "Tag contains forbidden characters: < or >",
            };
        }

        return { valid: true };
    }

    /**
     * Check for balanced braces
     */
    private checkBalancedBraces(tag: string): ValidationResult {
        let depth = 0;
        let inBraces = false;

        for (let i = 0; i < tag.length; i++) {
            const char = tag[i];

            if (char === "{") {
                if (inBraces) {
                    return {
                        valid: false,
                        errorCode: ValidationErrorCode.NESTED_BRACES,
                        message: `Nested braces are not allowed at position ${i}`,
                        position: i,
                    };
                }
                inBraces = true;
                depth++;
            } else if (char === "}") {
                if (!inBraces) {
                    return {
                        valid: false,
                        errorCode: ValidationErrorCode.UNMATCHED_CLOSING_BRACE,
                        message: `Unmatched closing brace at position ${i}`,
                        position: i,
                    };
                }
                inBraces = false;
                depth--;
            }
        }

        if (depth !== 0) {
            return {
                valid: false,
                errorCode: ValidationErrorCode.UNMATCHED_OPENING_BRACE,
                message: "Unmatched opening brace",
            };
        }

        return { valid: true };
    }

    /**
     * Check for valid set notation
     */
    private checkSetNotation(tag: string): ValidationResult {
        const setPattern = /\{([^}]*)\}/g;
        let match;

        while ((match = setPattern.exec(tag)) !== null) {
            const content = match[1];

            // Check for empty set
            if (content.trim() === "") {
                return {
                    valid: false,
                    errorCode: ValidationErrorCode.EMPTY_SET,
                    message: `Empty set notation at position ${match.index}`,
                    position: match.index,
                };
            }

            // Split by comma and validate each item
            const items = content.split(",");
            if (items.length < 2) {
                return {
                    valid: false,
                    errorCode: ValidationErrorCode.SET_TOO_FEW_ITEMS,
                    message: `Set notation must contain at least 2 items at position ${match.index}`,
                    position: match.index,
                };
            }

            // Check for empty items
            for (const item of items) {
                if (item.trim() === "") {
                    return {
                        valid: false,
                        errorCode: ValidationErrorCode.EMPTY_SET_ITEM,
                        message: `Empty item in set notation at position ${match.index}`,
                        position: match.index,
                    };
                }
            }

            // Check for wildcards in set notation (not allowed)
            if (/[*?]/.test(content)) {
                return {
                    valid: false,
                    errorCode: ValidationErrorCode.WILDCARD_IN_SET,
                    message: `Wildcards are not allowed within set notation at position ${match.index}`,
                    position: match.index,
                };
            }
        }

        return { valid: true };
    }

    /**
     * Check for valid wildcard usage
     */
    private checkWildcards(tag: string): ValidationResult {
        // Remove content within braces for wildcard checking
        const withoutSets = tag.replace(/\{[^}]+\}/g, "");

        // Check for invalid wildcard combinations
        if (/\*\*\*+/.test(withoutSets)) {
            return {
                valid: false,
                errorCode: ValidationErrorCode.TOO_MANY_ASTERISKS,
                message: "Invalid wildcard: more than two consecutive asterisks",
            };
        }

        // Check that ** is not mixed with other characters in same segment
        const segments = withoutSets.split(this._delimiter);
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            if (segment.includes("**")) {
                if (segment !== "**") {
                    return {
                        valid: false,
                        errorCode: ValidationErrorCode.DEEP_WILDCARD_NOT_ALONE,
                        message: `Deep wildcard ** must be used alone in a segment, found: "${segment}"`,
                    };
                }
            }
        }

        return { valid: true };
    }
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errorCode?: ValidationErrorCode;
    message?: string;
    position?: number;
}
