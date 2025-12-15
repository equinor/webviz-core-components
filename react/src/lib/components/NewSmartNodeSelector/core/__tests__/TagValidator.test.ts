/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TagValidator, ValidationErrorCode } from "../TagValidator";

describe("TagValidator", () => {
    describe("validate()", () => {
        it("should accept valid literal paths", () => {
            const validator = new TagValidator(":");

            expect(validator.validate("A").valid).toBe(true);
            expect(validator.validate("A:B").valid).toBe(true);
            expect(validator.validate("A:B:C").valid).toBe(true);
        });

        it("should reject empty tags", () => {
            const validator = new TagValidator(":");

            const result1 = validator.validate("");
            expect(result1.valid).toBe(false);
            expect(result1.errorCode).toBe(ValidationErrorCode.EMPTY_TAG);

            const result2 = validator.validate("   ");
            expect(result2.valid).toBe(false);
            expect(result2.errorCode).toBe(ValidationErrorCode.EMPTY_TAG);
        });

        it("should accept single-level wildcards", () => {
            const validator = new TagValidator(":");

            expect(validator.validate("*").valid).toBe(true);
            expect(validator.validate("A:*").valid).toBe(true);
            expect(validator.validate("*:B").valid).toBe(true);
            expect(validator.validate("A:*:C").valid).toBe(true);
        });

        it("should accept character wildcards", () => {
            const validator = new TagValidator(":");

            expect(validator.validate("Node-?").valid).toBe(true);
            expect(validator.validate("A:Node-?:C").valid).toBe(true);
            expect(validator.validate("???").valid).toBe(true);
        });

        it("should accept glob patterns", () => {
            const validator = new TagValidator(":");

            expect(validator.validate("Subnode*").valid).toBe(true);
            expect(validator.validate("*node").valid).toBe(true);
            expect(validator.validate("A:Sub*:C").valid).toBe(true);
        });

        it("should accept deep wildcards", () => {
            const validator = new TagValidator(":");

            expect(validator.validate("**").valid).toBe(true);
            expect(validator.validate("A:**").valid).toBe(true);
            expect(validator.validate("**:C").valid).toBe(true);
            expect(validator.validate("A:**:C").valid).toBe(true);
        });

        it("should reject deep wildcard mixed with other chars", () => {
            const validator = new TagValidator(":");

            const result1 = validator.validate("A**");
            expect(result1.valid).toBe(false);
            expect(result1.errorCode).toBe(
                ValidationErrorCode.DEEP_WILDCARD_NOT_ALONE
            );

            const result2 = validator.validate("**B");
            expect(result2.valid).toBe(false);
            expect(result2.errorCode).toBe(
                ValidationErrorCode.DEEP_WILDCARD_NOT_ALONE
            );

            const result3 = validator.validate("A**B");
            expect(result3.valid).toBe(false);
            expect(result3.errorCode).toBe(
                ValidationErrorCode.DEEP_WILDCARD_NOT_ALONE
            );
        });

        it("should reject more than two consecutive asterisks", () => {
            const validator = new TagValidator(":");

            const result = validator.validate("***");
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe(
                ValidationErrorCode.TOO_MANY_ASTERISKS
            );
        });

        it("should accept valid set notation", () => {
            const validator = new TagValidator(":");

            expect(validator.validate("{A,B}").valid).toBe(true);
            expect(validator.validate("{A,B,C}").valid).toBe(true);
            expect(validator.validate("Parent:{A,B}").valid).toBe(true);
            expect(validator.validate("{A,B}:Child").valid).toBe(true);
            expect(validator.validate("A:{B,C}:D").valid).toBe(true);
        });

        it("should reject empty set notation", () => {
            const validator = new TagValidator(":");

            const result = validator.validate("{}");
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe(ValidationErrorCode.EMPTY_SET);
        });

        it("should reject set with single item", () => {
            const validator = new TagValidator(":");

            const result = validator.validate("{A}");
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe(
                ValidationErrorCode.SET_TOO_FEW_ITEMS
            );
        });

        it("should reject set with empty items", () => {
            const validator = new TagValidator(":");

            const result1 = validator.validate("{A,}");
            expect(result1.valid).toBe(false);
            expect(result1.errorCode).toBe(ValidationErrorCode.EMPTY_SET_ITEM);

            const result2 = validator.validate("{,B}");
            expect(result2.valid).toBe(false);
            expect(result2.errorCode).toBe(ValidationErrorCode.EMPTY_SET_ITEM);

            const result3 = validator.validate("{A,,B}");
            expect(result3.valid).toBe(false);
            expect(result3.errorCode).toBe(ValidationErrorCode.EMPTY_SET_ITEM);
        });

        it("should reject wildcards within set notation", () => {
            const validator = new TagValidator(":");

            const result1 = validator.validate("{A*,B}");
            expect(result1.valid).toBe(false);
            expect(result1.errorCode).toBe(ValidationErrorCode.WILDCARD_IN_SET);

            const result2 = validator.validate("{A,B?}");
            expect(result2.valid).toBe(false);
            expect(result2.errorCode).toBe(ValidationErrorCode.WILDCARD_IN_SET);
        });

        it("should reject unbalanced braces", () => {
            const validator = new TagValidator(":");

            const result1 = validator.validate("{A,B");
            expect(result1.valid).toBe(false);
            expect(result1.errorCode).toBe(
                ValidationErrorCode.UNMATCHED_OPENING_BRACE
            );

            const result2 = validator.validate("A,B}");
            expect(result2.valid).toBe(false);
            expect(result2.errorCode).toBe(
                ValidationErrorCode.UNMATCHED_CLOSING_BRACE
            );
        });

        it("should reject nested braces", () => {
            const validator = new TagValidator(":");

            const result = validator.validate("{A,{B,C}}");
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe(ValidationErrorCode.NESTED_BRACES);
        });

        it("should reject forbidden characters", () => {
            const validator = new TagValidator(":");

            const result1 = validator.validate("A<B");
            expect(result1.valid).toBe(false);
            expect(result1.errorCode).toBe(
                ValidationErrorCode.FORBIDDEN_CHARACTERS
            );

            const result2 = validator.validate("A>B");
            expect(result2.valid).toBe(false);
            expect(result2.errorCode).toBe(
                ValidationErrorCode.FORBIDDEN_CHARACTERS
            );
        });

        it("should work with custom delimiter", () => {
            const validator = new TagValidator("/");

            expect(validator.validate("A/B/C").valid).toBe(true);
            expect(validator.validate("A/**").valid).toBe(true);
            expect(validator.validate("A/**/C").valid).toBe(true);
        });

        it("should accept OR queries", () => {
            const validator = new TagValidator(":");

            expect(validator.validate("A|B").valid).toBe(true);
            expect(validator.validate("A:B|C:D").valid).toBe(true);
            expect(validator.validate("A:*|B:C").valid).toBe(true);
        });

        it("should accept complex valid patterns", () => {
            const validator = new TagValidator(":");

            expect(validator.validate("Root:*:Leaf").valid).toBe(true);
            expect(validator.validate("Root:**:Leaf").valid).toBe(true);
            expect(validator.validate("Node-?:Child").valid).toBe(true);
            expect(validator.validate("Sub*:Child").valid).toBe(true);
            expect(validator.validate("Parent:{A,B,C}:Child").valid).toBe(true);
            expect(validator.validate("A:B|C:D|E:F").valid).toBe(true);
        });

        it("should provide position information for errors", () => {
            const validator = new TagValidator(":");

            const result1 = validator.validate("A:}");
            expect(result1.valid).toBe(false);
            expect(result1.position).toBe(2);

            const result2 = validator.validate("A:{B,{C}}");
            expect(result2.valid).toBe(false);
            expect(result2.position).toBeDefined();
        });
    });
});
