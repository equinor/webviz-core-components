/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { matchName } from "../matcher/matchName";
import type { Atom } from "../ast/ast";

describe("matchName", () => {
    describe("literal matching", () => {
        it("should match exact string", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "hello",
                    charRange: { start: 0, end: 5 },
                },
            ];
            expect(matchName("hello", atoms)).toBe(true);
        });

        it("should not match different string", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "hello",
                    charRange: { start: 0, end: 5 },
                },
            ];
            expect(matchName("world", atoms)).toBe(false);
        });

        it("should match multiple literals in sequence", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "hello",
                    charRange: { start: 0, end: 5 },
                },
                {
                    kind: "literal",
                    text: "world",
                    charRange: { start: 5, end: 10 },
                },
            ];
            expect(matchName("helloworld", atoms)).toBe(true);
        });

        it("should not match if string is too short", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "hello",
                    charRange: { start: 0, end: 5 },
                },
            ];
            expect(matchName("hell", atoms)).toBe(false);
        });

        it("should not match if string is too long", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "hello",
                    charRange: { start: 0, end: 5 },
                },
            ];
            expect(matchName("helloo", atoms)).toBe(false);
        });

        it("should match empty pattern with empty string", () => {
            const atoms: Atom[] = [];
            expect(matchName("", atoms)).toBe(true);
        });

        it("should not match empty pattern with non-empty string", () => {
            const atoms: Atom[] = [];
            expect(matchName("hello", atoms)).toBe(false);
        });
    });

    describe("star (*) matching", () => {
        it("should match star with empty string", () => {
            const atoms: Atom[] = [
                { kind: "star", charRange: { start: 0, end: 1 } },
            ];
            expect(matchName("", atoms)).toBe(true);
        });

        it("should match star with any string", () => {
            const atoms: Atom[] = [
                { kind: "star", charRange: { start: 0, end: 1 } },
            ];
            expect(matchName("hello", atoms)).toBe(true);
            expect(matchName("world", atoms)).toBe(true);
            expect(matchName("a", atoms)).toBe(true);
        });

        it("should match literal followed by star", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "test",
                    charRange: { start: 0, end: 4 },
                },
                { kind: "star", charRange: { start: 4, end: 5 } },
            ];
            expect(matchName("test", atoms)).toBe(true);
            expect(matchName("testing", atoms)).toBe(true);
            expect(matchName("test123", atoms)).toBe(true);
        });

        it("should match star followed by literal", () => {
            const atoms: Atom[] = [
                { kind: "star", charRange: { start: 0, end: 1 } },
                {
                    kind: "literal",
                    text: "test",
                    charRange: { start: 1, end: 5 },
                },
            ];
            expect(matchName("test", atoms)).toBe(true);
            expect(matchName("mytest", atoms)).toBe(true);
            expect(matchName("123test", atoms)).toBe(true);
        });

        it("should match literal with star in middle", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "hello",
                    charRange: { start: 0, end: 5 },
                },
                { kind: "star", charRange: { start: 5, end: 6 } },
                {
                    kind: "literal",
                    text: "world",
                    charRange: { start: 6, end: 11 },
                },
            ];
            expect(matchName("helloworld", atoms)).toBe(true);
            expect(matchName("hello world", atoms)).toBe(true);
            expect(matchName("hello123world", atoms)).toBe(true);
            expect(matchName("helloXYZworld", atoms)).toBe(true);
        });

        it("should match multiple stars", () => {
            const atoms: Atom[] = [
                { kind: "star", charRange: { start: 0, end: 1 } },
                {
                    kind: "literal",
                    text: "test",
                    charRange: { start: 1, end: 5 },
                },
                { kind: "star", charRange: { start: 5, end: 6 } },
            ];
            expect(matchName("test", atoms)).toBe(true);
            expect(matchName("mytest", atoms)).toBe(true);
            expect(matchName("testdata", atoms)).toBe(true);
            expect(matchName("mytestdata", atoms)).toBe(true);
        });
    });

    describe("question mark (?) matching", () => {
        it("should match question mark with single character", () => {
            const atoms: Atom[] = [
                { kind: "qmark", charRange: { start: 0, end: 1 } },
            ];
            expect(matchName("a", atoms)).toBe(true);
            expect(matchName("Z", atoms)).toBe(true);
            expect(matchName("5", atoms)).toBe(true);
        });

        it("should not match question mark with empty string", () => {
            const atoms: Atom[] = [
                { kind: "qmark", charRange: { start: 0, end: 1 } },
            ];
            expect(matchName("", atoms)).toBe(false);
        });

        it("should not match question mark with multiple characters", () => {
            const atoms: Atom[] = [
                { kind: "qmark", charRange: { start: 0, end: 1 } },
            ];
            expect(matchName("ab", atoms)).toBe(false);
        });

        it("should match multiple question marks", () => {
            const atoms: Atom[] = [
                { kind: "qmark", charRange: { start: 0, end: 1 } },
                { kind: "qmark", charRange: { start: 1, end: 2 } },
                { kind: "qmark", charRange: { start: 2, end: 3 } },
            ];
            expect(matchName("abc", atoms)).toBe(true);
            expect(matchName("123", atoms)).toBe(true);
            expect(matchName("ab", atoms)).toBe(false);
            expect(matchName("abcd", atoms)).toBe(false);
        });

        it("should match literal with question mark", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "test",
                    charRange: { start: 0, end: 4 },
                },
                { kind: "qmark", charRange: { start: 4, end: 5 } },
            ];
            expect(matchName("test1", atoms)).toBe(true);
            expect(matchName("testX", atoms)).toBe(true);
            expect(matchName("test", atoms)).toBe(false);
            expect(matchName("test12", atoms)).toBe(false);
        });

        it("should match question mark followed by literal", () => {
            const atoms: Atom[] = [
                { kind: "qmark", charRange: { start: 0, end: 1 } },
                {
                    kind: "literal",
                    text: "test",
                    charRange: { start: 1, end: 5 },
                },
            ];
            expect(matchName("atest", atoms)).toBe(true);
            expect(matchName("Xtest", atoms)).toBe(true);
            expect(matchName("test", atoms)).toBe(false);
            expect(matchName("aatest", atoms)).toBe(false);
        });
    });

    describe("complex patterns", () => {
        it("should match pattern with all wildcard types", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "Data",
                    charRange: { start: 0, end: 4 },
                },
                { kind: "star", charRange: { start: 4, end: 5 } },
                {
                    kind: "literal",
                    text: "Source ",
                    charRange: { start: 5, end: 12 },
                },
                { kind: "qmark", charRange: { start: 12, end: 13 } },
            ];
            expect(matchName("DataSourceA", atoms)).toBe(false);
            expect(matchName("DataSource A", atoms)).toBe(true);
            expect(matchName("Data Source A", atoms)).toBe(true);
            expect(matchName("DataXYZSource 1", atoms)).toBe(true);
        });

        it("should match real-world node names", () => {
            // Pattern: "*Temp*"
            const atoms: Atom[] = [
                { kind: "star", charRange: { start: 0, end: 1 } },
                {
                    kind: "literal",
                    text: "Temp",
                    charRange: { start: 1, end: 5 },
                },
                { kind: "star", charRange: { start: 5, end: 6 } },
            ];
            expect(matchName("Temperature", atoms)).toBe(true);
            expect(matchName("Temp", atoms)).toBe(true);
            expect(matchName("HighTemp", atoms)).toBe(true);
            expect(matchName("TempSensor", atoms)).toBe(true);
            expect(matchName("HighTempValue", atoms)).toBe(true);
        });

        it("should match pattern for node versioning", () => {
            // Pattern: "node_v?"
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "node_v",
                    charRange: { start: 0, end: 6 },
                },
                { kind: "qmark", charRange: { start: 6, end: 7 } },
            ];
            expect(matchName("node_v1", atoms)).toBe(true);
            expect(matchName("node_v2", atoms)).toBe(true);
            expect(matchName("node_v", atoms)).toBe(false);
            expect(matchName("node_v10", atoms)).toBe(false);
        });

        it("should match file extension patterns", () => {
            // Pattern: "*.ts"
            const atoms: Atom[] = [
                { kind: "star", charRange: { start: 0, end: 1 } },
                {
                    kind: "literal",
                    text: ".ts",
                    charRange: { start: 1, end: 4 },
                },
            ];
            expect(matchName("file.ts", atoms)).toBe(true);
            expect(matchName("index.ts", atoms)).toBe(true);
            expect(matchName(".ts", atoms)).toBe(true);
            expect(matchName("file.tsx", atoms)).toBe(false);
        });
    });

    describe("case sensitivity", () => {
        it("should match case-sensitively by default", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "Hello",
                    charRange: { start: 0, end: 5 },
                },
            ];
            expect(matchName("Hello", atoms)).toBe(true);
            expect(matchName("hello", atoms)).toBe(false);
            expect(matchName("HELLO", atoms)).toBe(false);
        });

        it("should match case-insensitively when option is set", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "Hello",
                    charRange: { start: 0, end: 5 },
                },
            ];
            expect(matchName("Hello", atoms, { caseInsensitive: true })).toBe(
                true
            );
            expect(matchName("hello", atoms, { caseInsensitive: true })).toBe(
                true
            );
            expect(matchName("HELLO", atoms, { caseInsensitive: true })).toBe(
                true
            );
            expect(matchName("HeLLo", atoms, { caseInsensitive: true })).toBe(
                true
            );
        });

        it("should handle case-insensitive matching with wildcards", () => {
            const atoms: Atom[] = [
                { kind: "star", charRange: { start: 0, end: 1 } },
                {
                    kind: "literal",
                    text: "Test",
                    charRange: { start: 1, end: 5 },
                },
                { kind: "star", charRange: { start: 5, end: 6 } },
            ];
            expect(matchName("MyTest", atoms, { caseInsensitive: true })).toBe(
                true
            );
            expect(matchName("mytest", atoms, { caseInsensitive: true })).toBe(
                true
            );
            expect(matchName("MYTEST", atoms, { caseInsensitive: true })).toBe(
                true
            );
            expect(
                matchName("TestData", atoms, { caseInsensitive: true })
            ).toBe(true);
        });

        it("should not affect wildcard characters in case-insensitive mode", () => {
            const atoms: Atom[] = [
                { kind: "qmark", charRange: { start: 0, end: 1 } },
                {
                    kind: "literal",
                    text: "test",
                    charRange: { start: 1, end: 5 },
                },
            ];
            expect(matchName("atest", atoms, { caseInsensitive: true })).toBe(
                true
            );
            expect(matchName("ATEST", atoms, { caseInsensitive: true })).toBe(
                true
            );
            expect(matchName("test", atoms, { caseInsensitive: true })).toBe(
                false
            );
        });
    });

    describe("edge cases", () => {
        it("should handle very long strings efficiently", () => {
            const longString = "a".repeat(10000);
            const atoms: Atom[] = [
                { kind: "star", charRange: { start: 0, end: 1 } },
            ];
            expect(matchName(longString, atoms)).toBe(true);
        });

        it("should handle many atoms efficiently", () => {
            // Create pattern with 100 question marks
            const atoms: Atom[] = Array.from({ length: 100 }, (_, i) => ({
                kind: "qmark" as const,
                charRange: { start: i, end: i + 1 },
            }));
            const string = "a".repeat(100);
            expect(matchName(string, atoms)).toBe(true);
        });

        it("should handle consecutive stars", () => {
            const atoms: Atom[] = [
                { kind: "star", charRange: { start: 0, end: 1 } },
                { kind: "star", charRange: { start: 1, end: 2 } },
                {
                    kind: "literal",
                    text: "test",
                    charRange: { start: 2, end: 6 },
                },
            ];
            expect(matchName("test", atoms)).toBe(true);
            expect(matchName("prefixtest", atoms)).toBe(true);
        });

        it("should handle special characters in literals", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "test-123_foo.bar",
                    charRange: { start: 0, end: 16 },
                },
            ];
            expect(matchName("test-123_foo.bar", atoms)).toBe(true);
        });

        it("should handle unicode characters", () => {
            const atoms: Atom[] = [
                {
                    kind: "literal",
                    text: "hello",
                    charRange: { start: 0, end: 5 },
                },
                { kind: "star", charRange: { start: 5, end: 6 } },
            ];
            expect(matchName("hello世界", atoms)).toBe(true);
            expect(matchName("hello🌍", atoms)).toBe(true);
        });

        it("should handle empty literal", () => {
            const atoms: Atom[] = [
                { kind: "literal", text: "", charRange: { start: 0, end: 0 } },
            ];
            expect(matchName("", atoms)).toBe(true);
            expect(matchName("a", atoms)).toBe(false);
        });

        it("should match pattern that requires backtracking", () => {
            // Pattern: "*a*b*c"
            const atoms: Atom[] = [
                { kind: "star", charRange: { start: 0, end: 1 } },
                { kind: "literal", text: "a", charRange: { start: 1, end: 2 } },
                { kind: "star", charRange: { start: 2, end: 3 } },
                { kind: "literal", text: "b", charRange: { start: 3, end: 4 } },
                { kind: "star", charRange: { start: 4, end: 5 } },
                { kind: "literal", text: "c", charRange: { start: 5, end: 6 } },
            ];
            expect(matchName("abc", atoms)).toBe(true);
            expect(matchName("aXbYc", atoms)).toBe(true);
            expect(matchName("aaaabbbccc", atoms)).toBe(true);
            expect(matchName("XaXXbXXc", atoms)).toBe(true);
        });
    });
});
