/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TreeIndexBuilder } from "../TreeIndexBuilder";
import { TreeMatcher } from "../TreeMatcher";
import { TagParser } from "../TagParser";
import type { TreeDataNode } from "../types/TreeNode";

describe("TreeMatcher", () => {
    let builder: TreeIndexBuilder;
    let parser: TagParser;
    let tree: TreeDataNode[];

    beforeEach(() => {
        builder = new TreeIndexBuilder(":");
        parser = new TagParser(":");

        // Build a test tree similar to App.tsx structure
        tree = [
            {
                id: "1",
                name: "Metadata 1",
                children: [
                    {
                        id: "1.1",
                        name: "Submetadata 1",
                        children: [
                            {
                                id: "1.1.1",
                                name: "Node-1",
                                children: [
                                    { id: "1.1.1.1", name: "Subnode 1" },
                                    { id: "1.1.1.2", name: "Subnode 2" },
                                    { id: "1.1.1.3", name: "Subnode 3" },
                                    { id: "1.1.1.4", name: "Subnode 4" },
                                ],
                            },
                            {
                                id: "1.1.2",
                                name: "Node 2",
                                children: [
                                    { id: "1.1.2.1", name: "Subnode 1" },
                                    { id: "1.1.2.2", name: "Subnode 2" },
                                    { id: "1.1.2.3", name: "Subnode 3" },
                                    { id: "1.1.2.4", name: "Subnode 4" },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                id: "2",
                name: "Metadata 2",
                children: [
                    {
                        id: "2.1",
                        name: "Submetadata 1",
                        children: [
                            {
                                id: "2.1.1",
                                name: "Node 1",
                                children: [
                                    { id: "2.1.1.1", name: "Subnode 1" },
                                    { id: "2.1.1.2", name: "Subnode 2" },
                                    { id: "2.1.1.3", name: "Subnode 3" },
                                ],
                            },
                        ],
                    },
                ],
            },
        ];
    });

    describe("Literal matching", () => {
        it("should match exact path", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("Metadata 1:Submetadata 1:Node-1");
            const results = matcher.match(query);

            expect(results).toHaveLength(1);
            expect(results[0].name).toBe("Node-1");
            expect(results[0].id).toBe("1.1.1");
        });

        it("should match deep path", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse(
                "Metadata 1:Submetadata 1:Node-1:Subnode 2"
            );
            const results = matcher.match(query);

            expect(results).toHaveLength(1);
            expect(results[0].name).toBe("Subnode 2");
            expect(results[0].id).toBe("1.1.1.2");
        });

        it("should return empty array for non-matching path", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("Metadata 1:NonExistent");
            const results = matcher.match(query);

            expect(results).toHaveLength(0);
        });
    });

    describe("Single-level wildcard (*)", () => {
        it("should match any single node at level", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("*:Submetadata 1");
            const results = matcher.match(query);

            expect(results).toHaveLength(2);
            expect(results.map((r) => r.name)).toContain("Submetadata 1");
            expect(results.map((r) => r.id).sort()).toEqual(["1.1", "2.1"]);
        });

        it("should match multiple wildcards in path", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("*:*:*:Subnode 1");
            const results = matcher.match(query);

            expect(results.length).toBeGreaterThan(0);
            expect(results.every((r) => r.name === "Subnode 1")).toBe(true);
        });
    });

    describe("Deep wildcard (**)", () => {
        it("should match at any depth with no following segments", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("Metadata 1:**");
            const results = matcher.match(query);

            // Should match all descendants of Metadata 1
            expect(results.length).toBeGreaterThan(5);
            expect(results.map((r) => r.name)).toContain("Submetadata 1");
            expect(results.map((r) => r.name)).toContain("Node-1");
            expect(results.map((r) => r.name)).toContain("Subnode 1");
        });

        it("should match pattern at any depth", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("**:Subnode 1");
            const results = matcher.match(query);

            // Should find all "Subnode 1" nodes regardless of depth
            expect(results).toHaveLength(3); // One in each Node
            expect(results.every((r) => r.name === "Subnode 1")).toBe(true);
        });

        it("should match complex pattern with deep wildcard", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("Metadata 1:**:Subnode 2");
            const results = matcher.match(query);

            expect(results.length).toBeGreaterThan(0);
            expect(results.every((r) => r.name === "Subnode 2")).toBe(true);
            // Should only match under Metadata 1
            expect(
                results.every((r) => r.pathString.startsWith("Metadata 1:"))
            ).toBe(true);
        });
    });

    describe("Character wildcard (?)", () => {
        it("should match single character", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("Metadata 1:Submetadata 1:Node-?");
            const results = matcher.match(query);

            expect(results).toHaveLength(1);
            expect(results[0].name).toBe("Node-1");
        });

        it("should match multiple character wildcards", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("*:*:*:Subnode ?");
            const results = matcher.match(query);

            // Should match "Subnode 1", "Subnode 2", etc.
            expect(results.length).toBeGreaterThan(0);
            expect(results.every((r) => /^Subnode \d$/.test(r.name))).toBe(
                true
            );
        });
    });

    describe("Glob patterns (*)", () => {
        it("should match leading wildcard", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("*:*:*Node*");
            const results = matcher.match(query);

            // Should match nodes containing "Node"
            expect(results.length).toBeGreaterThan(0);
            expect(
                results.every((r) => r.name.includes("Node"))
            ).toBe(true);
        });

        it("should match trailing wildcard", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("Metadata 1:Sub*");
            const results = matcher.match(query);

            expect(results).toHaveLength(1);
            expect(results[0].name).toBe("Submetadata 1");
        });

        it("should match middle wildcard", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("Metadata 1:*:Node*1");
            const results = matcher.match(query);

            expect(results.length).toBeGreaterThan(0);
            expect(results.every((r) => r.name.startsWith("Node"))).toBe(true);
        });
    });

    describe("Set notation - INTERSECTION ({A,B} and A&B)", () => {
        it("should match node name in set with braces", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("Metadata 1:Submetadata 1:{Node-1,Node 2}");
            const results = matcher.match(query);

            expect(results).toHaveLength(2);
            expect(results.map((r) => r.name).sort()).toEqual([
                "Node 2",
                "Node-1",
            ]);
        });

        it("should only allow common children for INTERSECTION with braces", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            // Both Node-1 and Node 2 have Subnode 1-4
            const query = parser.parse(
                "Metadata 1:Submetadata 1:{Node-1,Node 2}:Subnode 1"
            );
            const results = matcher.match(query);

            // Should match Subnode 1 from both nodes
            expect(results).toHaveLength(2);
            expect(results.every((r) => r.name === "Subnode 1")).toBe(true);
        });

        it("should only allow common children for INTERSECTION with ampersand", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            // Both Node-1 and Node 2 have Subnode 1-4
            const query = parser.parse(
                "Metadata 1:Submetadata 1:Node-1&Node 2:Subnode 2"
            );
            const results = matcher.match(query);

            expect(results).toHaveLength(2);
            expect(results.every((r) => r.name === "Subnode 2")).toBe(true);
        });

        it("should return empty for non-common children in INTERSECTION", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            // Node-1 has Subnode 4, but Node 1 under Metadata 2 only has Subnode 1-3
            const query = parser.parse("*:Submetadata 1:{Node-1,Node 1}:Subnode 4");
            const results = matcher.match(query);

            // Should return empty because Subnode 4 doesn't exist in all matched nodes
            expect(results).toHaveLength(0);
        });
    });

    describe("Set notation - UNION (A|B)", () => {
        it("should match node name in set with pipe", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("Metadata 1:Submetadata 1:Node-1|Node 2");
            const results = matcher.match(query);

            expect(results).toHaveLength(2);
            expect(results.map((r) => r.name).sort()).toEqual([
                "Node 2",
                "Node-1",
            ]);
        });

        it("should allow all children from any matched node for UNION", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            // Node-1 has Subnode 4, Node 1 under Metadata 2 has Subnode 1-3
            // UNION should allow Subnode 4 from either branch
            const query = parser.parse(
                "*:Submetadata 1:Node-1|Node 1:Subnode 4"
            );
            const results = matcher.match(query);

            // Should match Subnode 4 from Node-1 (even though it doesn't exist under Node 1)
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe("Subnode 4");
            expect(results[0].pathString).toContain("Node-1");
        });

        it("should combine all children for UNION", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse(
                "Metadata 1:Submetadata 1:Node-1|Node 2:*"
            );
            const results = matcher.match(query);

            // Should get all children from both nodes
            expect(results.length).toBe(8); // 4 from Node-1 + 4 from Node 2
        });
    });

    describe("Mixed operations", () => {
        it("should handle wildcard in set", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("Metadata 1:Submetadata 1:*:Subnode 1");
            const results = matcher.match(query);

            expect(results).toHaveLength(2);
            expect(results.every((r) => r.name === "Subnode 1")).toBe(true);
        });

        it("should handle complex pattern with multiple features", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("*:*:Node*:Subnode ?");
            const results = matcher.match(query);

            expect(results.length).toBeGreaterThan(0);
            expect(results.every((r) => /^Subnode \d$/.test(r.name))).toBe(
                true
            );
        });
    });

    describe("Edge cases", () => {
        it("should handle single segment query", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("Metadata 1");
            const results = matcher.match(query);

            expect(results).toHaveLength(1);
            expect(results[0].name).toBe("Metadata 1");
        });

        it("should handle empty results gracefully", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("NonExistent:Path");
            const results = matcher.match(query);

            expect(results).toHaveLength(0);
        });

        it("should handle nested deep wildcards", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("Metadata 1:**:**");
            const results = matcher.match(query);

            // Should match all descendants of Metadata 1 at any depth
            expect(results.length).toBeGreaterThan(0);
            // All results should be under Metadata 1
            expect(
                results.every((r) => r.pathString.startsWith("Metadata 1:"))
            ).toBe(true);
        });

        it("should handle nested deep wildcards with leaf", () => {
            const buildResult = builder.build(tree);
            const matcher = new TreeMatcher(buildResult);

            const query = parser.parse("**:**:Subnode 1");
            const results = matcher.match(query);

            // Should match all descendants of Metadata 1 at any depth
            expect(results.length).toBeGreaterThan(0);
            // All results should be under Metadata 1
            expect(
                results.every((r) => r.pathString.endsWith("Subnode 1"))
            ).toBe(true);
            expect(results.length).toBe(3);
        });
    });
});
