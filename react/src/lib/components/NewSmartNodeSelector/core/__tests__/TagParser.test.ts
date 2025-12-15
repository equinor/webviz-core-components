/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TagParser } from "../TagParser";
import type { PathQuery } from "../types/Query";

describe("TagParser", () => {
    describe("parse()", () => {
        it("should parse simple literal path", () => {
            const parser = new TagParser(":");
            const result = parser.parse("A:B:C") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(3);
            expect(result.segments[0]).toEqual({ type: "LITERAL", value: "A" });
            expect(result.segments[1]).toEqual({ type: "LITERAL", value: "B" });
            expect(result.segments[2]).toEqual({ type: "LITERAL", value: "C" });
        });

        it("should parse single segment", () => {
            const parser = new TagParser(":");
            const result = parser.parse("A") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(1);
            expect(result.segments[0]).toEqual({ type: "LITERAL", value: "A" });
        });

        it("should parse single-level wildcard", () => {
            const parser = new TagParser(":");
            const result = parser.parse("A:*:C") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(3);
            expect(result.segments[0]).toEqual({ type: "LITERAL", value: "A" });
            expect(result.segments[1]).toEqual({ type: "WILDCARD" });
            expect(result.segments[2]).toEqual({ type: "LITERAL", value: "C" });
        });

        it("should parse deep wildcard", () => {
            const parser = new TagParser(":");
            const result = parser.parse("A:**:C") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(3);
            expect(result.segments[0]).toEqual({ type: "LITERAL", value: "A" });
            expect(result.segments[1]).toEqual({ type: "DEEP_WILDCARD" });
            expect(result.segments[2]).toEqual({ type: "LITERAL", value: "C" });
        });

        it("should parse character wildcard", () => {
            const parser = new TagParser(":");
            const result = parser.parse("Node-?") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(1);
            expect(result.segments[0].type).toBe("CHAR_WILDCARD");

            const segment = result.segments[0];
            if (segment.type === "CHAR_WILDCARD") {
                expect(segment.original).toBe("Node-?");
                expect(segment.pattern.test("Node-1")).toBe(true);
                expect(segment.pattern.test("Node-A")).toBe(true);
                expect(segment.pattern.test("Node-")).toBe(false);
                expect(segment.pattern.test("Node-12")).toBe(false);
            }
        });

        it("should parse glob pattern with leading wildcard", () => {
            const parser = new TagParser(":");
            const result = parser.parse("*node") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(1);
            expect(result.segments[0].type).toBe("GLOB");

            const segment = result.segments[0];
            if (segment.type === "GLOB") {
                expect(segment.original).toBe("*node");
                expect(segment.pattern.test("node")).toBe(true);
                expect(segment.pattern.test("subnode")).toBe(true);
                expect(segment.pattern.test("xnode")).toBe(true);
                expect(segment.pattern.test("nodes")).toBe(false);
            }
        });

        it("should parse glob pattern with trailing wildcard", () => {
            const parser = new TagParser(":");
            const result = parser.parse("Sub*") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(1);
            expect(result.segments[0].type).toBe("GLOB");

            const segment = result.segments[0];
            if (segment.type === "GLOB") {
                expect(segment.original).toBe("Sub*");
                expect(segment.pattern.test("Sub")).toBe(true);
                expect(segment.pattern.test("Subnode")).toBe(true);
                expect(segment.pattern.test("SubnodeA")).toBe(true);
                expect(segment.pattern.test("Node")).toBe(false);
            }
        });

        it("should parse glob pattern with middle wildcard", () => {
            const parser = new TagParser(":");
            const result = parser.parse("A*C") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments[0].type).toBe("GLOB");

            const segment = result.segments[0];
            if (segment.type === "GLOB") {
                expect(segment.pattern.test("AC")).toBe(true);
                expect(segment.pattern.test("ABC")).toBe(true);
                expect(segment.pattern.test("AXYZC")).toBe(true);
                expect(segment.pattern.test("AB")).toBe(false);
            }
        });

        it("should parse glob with multiple wildcards", () => {
            const parser = new TagParser(":");
            const result = parser.parse("A*B*C") as PathQuery;

            expect(result.segments[0].type).toBe("GLOB");

            const segment = result.segments[0];
            if (segment.type === "GLOB") {
                expect(segment.pattern.test("ABC")).toBe(true);
                expect(segment.pattern.test("AXBC")).toBe(true);
                expect(segment.pattern.test("ABXC")).toBe(true);
                expect(segment.pattern.test("AXBXC")).toBe(true);
                expect(segment.pattern.test("AB")).toBe(false);
            }
        });

        it("should parse set notation", () => {
            const parser = new TagParser(":");
            const result = parser.parse("A:{B,C,D}:E") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(3);
            expect(result.segments[0]).toEqual({ type: "LITERAL", value: "A" });
            expect(result.segments[1]).toEqual({
                type: "SET",
                values: ["B", "C", "D"],
                operation: "INTERSECTION",
            });
            expect(result.segments[2]).toEqual({ type: "LITERAL", value: "E" });
        });

        it("should parse set notation with whitespace", () => {
            const parser = new TagParser(":");
            const result = parser.parse("{A, B, C}") as PathQuery;

            expect(result.segments[0]).toEqual({
                type: "SET",
                values: ["A", "B", "C"],
                operation: "INTERSECTION",
            });
        });

        it("should parse segment-level OR with pipe", () => {
            const parser = new TagParser(":");
            const result = parser.parse("Root:A|B:Child") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(3);
            expect(result.segments[0]).toEqual({
                type: "LITERAL",
                value: "Root",
            });
            expect(result.segments[1]).toEqual({
                type: "SET",
                values: ["A", "B"],
                operation: "UNION",
            });
            expect(result.segments[2]).toEqual({
                type: "LITERAL",
                value: "Child",
            });
        });

        it("should parse multiple OR values in segment", () => {
            const parser = new TagParser(":");
            const result = parser.parse("Root:A|B|C") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(2);
            expect(result.segments[1]).toEqual({
                type: "SET",
                values: ["A", "B", "C"],
                operation: "UNION",
            });
        });

        it("should parse segment-level INTERSECTION with ampersand", () => {
            const parser = new TagParser(":");
            const result = parser.parse("Root:A&B:Child") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(3);
            expect(result.segments[1]).toEqual({
                type: "SET",
                values: ["A", "B"],
                operation: "INTERSECTION",
            });
        });

        it("should not confuse pipe in braces with segment OR", () => {
            const parser = new TagParser(":");
            const result = parser.parse("{A|B,C}") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(1);
            expect(result.segments[0]).toEqual({
                type: "SET",
                values: ["A|B", "C"],
                operation: "INTERSECTION",
            });
        });

        it("should handle complex mixed pattern", () => {
            const parser = new TagParser(":");
            const result = parser.parse("Root:*:{A,B}:**:Leaf") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(5);
            expect(result.segments[0]).toEqual({
                type: "LITERAL",
                value: "Root",
            });
            expect(result.segments[1]).toEqual({ type: "WILDCARD" });
            expect(result.segments[2]).toEqual({
                type: "SET",
                values: ["A", "B"],
                operation: "INTERSECTION",
            });
            expect(result.segments[3]).toEqual({ type: "DEEP_WILDCARD" });
            expect(result.segments[4]).toEqual({
                type: "LITERAL",
                value: "Leaf",
            });
        });

        it("should work with custom delimiter", () => {
            const parser = new TagParser("/");
            const result = parser.parse("A/B/C") as PathQuery;

            expect(result.type).toBe("PATH");
            expect(result.segments).toHaveLength(3);
            expect(result.segments[0]).toEqual({ type: "LITERAL", value: "A" });
            expect(result.segments[1]).toEqual({ type: "LITERAL", value: "B" });
            expect(result.segments[2]).toEqual({ type: "LITERAL", value: "C" });
        });

        it("should escape special regex characters in literals", () => {
            const parser = new TagParser(":");
            const result = parser.parse("A.B") as PathQuery;

            expect(result.segments[0]).toEqual({
                type: "LITERAL",
                value: "A.B",
            });
        });

        it("should escape special regex characters in char wildcards", () => {
            const parser = new TagParser(":");
            const result = parser.parse("Node.?") as PathQuery;

            expect(result.segments[0].type).toBe("CHAR_WILDCARD");

            const segment = result.segments[0];
            if (segment.type === "CHAR_WILDCARD") {
                expect(segment.pattern.test("Node.A")).toBe(true);
                expect(segment.pattern.test("NodeXA")).toBe(false);
            }
        });

        it("should escape special regex characters in glob patterns", () => {
            const parser = new TagParser(":");
            const result = parser.parse("Node.*") as PathQuery;

            expect(result.segments[0].type).toBe("GLOB");

            const segment = result.segments[0];
            if (segment.type === "GLOB") {
                expect(segment.pattern.test("Node.")).toBe(true);
                expect(segment.pattern.test("Node.ABC")).toBe(true);
                expect(segment.pattern.test("NodeABC")).toBe(false);
            }
        });
    });
});
