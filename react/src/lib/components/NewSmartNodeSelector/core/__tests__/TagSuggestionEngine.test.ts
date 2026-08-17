/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SuggestionEngine } from "../SuggestionEngine";
import type { TreeDataNode } from "../types/TreeNode";

describe("TagSuggestionEngine", () => {
    let engine: SuggestionEngine;
    let tree: TreeDataNode[];

    beforeEach(() => {
        engine = new SuggestionEngine(":");

        tree = [
            {
                id: "1",
                name: "Metadata 1",
                description: "First metadata source",
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
                                ],
                            },
                            {
                                id: "1.1.2",
                                name: "Node 2",
                                children: [
                                    { id: "1.1.2.1", name: "Subnode 1" },
                                    { id: "1.1.2.2", name: "Subnode 2" },
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
                            },
                        ],
                    },
                ],
            },
        ];

        engine.setData(tree);
    });

    describe("getSuggestions()", () => {
        it("should suggest root nodes for empty input", () => {
            const suggestions = engine.getSuggestions("");

            expect(suggestions).toHaveLength(2);
            expect(suggestions[0].name).toBe("Metadata 1");
            expect(suggestions[0].completedQuery).toBe("Metadata 1");
            expect(suggestions[0].type).toBe("node");
            expect(suggestions[1].name).toBe("Metadata 2");
        });

        it("should suggest matching nodes for partial input", () => {
            const suggestions = engine.getSuggestions("Meta");

            expect(suggestions).toHaveLength(2);
            expect(suggestions[0].name).toBe("Metadata 1");
            expect(suggestions[1].name).toBe("Metadata 2");
        });

        it("should filter suggestions by prefix", () => {
            const suggestions = engine.getSuggestions("Metadata 1");

            expect(suggestions).toHaveLength(1);
            expect(suggestions[0].name).toBe("Metadata 1");
        });

        it("should suggest children when tag ends with delimiter", () => {
            const suggestions = engine.getSuggestions("Metadata 1:");

            expect(suggestions).toHaveLength(1);
            expect(suggestions[0].name).toBe("Submetadata 1");
            expect(suggestions[0].completedQuery).toBe(
                "Metadata 1:Submetadata 1"
            );
        });

        it("should suggest nested children", () => {
            const suggestions = engine.getSuggestions(
                "Metadata 1:Submetadata 1:"
            );

            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.map((s) => s.name).sort()).toEqual([
                "Node 2",
                "Node-1",
            ]);
        });

        it("should suggest for partial segment in nested path", () => {
            const suggestions = engine.getSuggestions(
                "Metadata 1:Submetadata 1:Node"
            );

            expect(suggestions.length).toBe(2);
            expect(suggestions.map((s) => s.name).sort()).toEqual([
                "Node 2",
                "Node-1",
            ]);
        });

        it("should handle case-insensitive matching", () => {
            const suggestions = engine.getSuggestions("meta");

            expect(suggestions).toHaveLength(2);
            expect(suggestions[0].name).toBe("Metadata 1");
        });

        it("should limit suggestions to maxSuggestions", () => {
            const suggestions = engine.getSuggestions("", 1);

            expect(suggestions).toHaveLength(1);
        });

        it("should return empty array for non-matching partial", () => {
            const suggestions = engine.getSuggestions("NonExistent");

            expect(suggestions).toHaveLength(0);
        });

        it("should handle wildcards in suggestions", () => {
            const suggestions = engine.getSuggestions("*");

            // Should return wildcard suggestions when partial contains *
            expect(suggestions.length).toBeGreaterThan(0);
        });
    });

    describe("getMatches()", () => {
        it("should return matches for valid complete tag", () => {
            const matches = engine.getMatches(
                "Metadata 1:Submetadata 1:Node-1"
            );

            expect(matches).toHaveLength(1);
            expect(matches[0].name).toBe("Node-1");
            expect(matches[0].id).toBe("1.1.1");
        });

        it("should return empty array for invalid tag", () => {
            const matches = engine.getMatches("{invalid");

            expect(matches).toHaveLength(0);
        });

        it("should return empty array for non-matching tag", () => {
            const matches = engine.getMatches("NonExistent");

            expect(matches).toHaveLength(0);
        });

        it("should support wildcard matching", () => {
            const matches = engine.getMatches("*:Submetadata 1");

            expect(matches).toHaveLength(2);
            expect(matches.every((m) => m.name === "Submetadata 1")).toBe(true);
        });

        it("should support deep wildcard matching", () => {
            const matches = engine.getMatches("**:Subnode 1");

            // Tree has 2 "Subnode 1" nodes (one under Node-1, one under Node 2)
            expect(matches).toHaveLength(2);
            expect(matches.every((m) => m.name === "Subnode 1")).toBe(true);
        });

        it("should support set notation", () => {
            const matches = engine.getMatches(
                "Metadata 1:Submetadata 1:{Node-1,Node 2}"
            );

            expect(matches).toHaveLength(2);
            expect(matches.map((m) => m.name).sort()).toEqual([
                "Node 2",
                "Node-1",
            ]);
        });
    });

    describe("validate()", () => {
        it("should validate correct tag", () => {
            const result = engine.validate("Metadata 1:Submetadata 1");

            expect(result.valid).toBe(true);
        });

        it("should reject empty tag", () => {
            const result = engine.validate("");

            expect(result.valid).toBe(false);
            expect(result.message).toContain("empty");
        });

        it("should reject unmatched braces", () => {
            const result = engine.validate("{incomplete");

            expect(result.valid).toBe(false);
        });
    });

    describe("getAllNodes()", () => {
        it("should return all indexed nodes", () => {
            const nodes = engine.getAllNodes();

            expect(nodes.length).toBeGreaterThan(0);
            expect(nodes.some((n) => n.name === "Metadata 1")).toBe(true);
            expect(nodes.some((n) => n.name === "Subnode 1")).toBe(true);
        });
    });

    describe("getNodeById()", () => {
        it("should return node by id", () => {
            const node = engine.getNodeById("1.1.1");

            expect(node).toBeDefined();
            expect(node?.name).toBe("Node-1");
        });

        it("should return undefined for non-existent id", () => {
            const node = engine.getNodeById("nonexistent");

            expect(node).toBeUndefined();
        });
    });

    describe("getNodeByPath()", () => {
        it("should return node by path", () => {
            const node = engine.getNodeByPath(
                "Metadata 1:Submetadata 1:Node-1"
            );

            expect(node).toBeDefined();
            expect(node?.name).toBe("Node-1");
            expect(node?.id).toBe("1.1.1");
        });

        it("should return undefined for non-existent path", () => {
            const node = engine.getNodeByPath("NonExistent:Path");

            expect(node).toBeUndefined();
        });
    });

    describe("integration tests", () => {
        it("should handle complete workflow: empty -> partial -> complete", () => {
            // Start with empty input
            let suggestions = engine.getSuggestions("");
            expect(suggestions[0].name).toBe("Metadata 1");

            // User types "Meta"
            suggestions = engine.getSuggestions("Meta");
            expect(suggestions.length).toBe(2);

            // User selects "Metadata 1" and adds ":"
            suggestions = engine.getSuggestions("Metadata 1:");
            expect(suggestions[0].name).toBe("Submetadata 1");

            // User completes to full path
            const matches = engine.getMatches(
                "Metadata 1:Submetadata 1:Node-1"
            );
            expect(matches).toHaveLength(1);
            expect(matches[0].name).toBe("Node-1");
        });

        it("should handle wildcard workflow", () => {
            // User wants all Subnode 1 nodes
            const matches = engine.getMatches("**:Subnode 1");

            // Tree has 2 "Subnode 1" nodes (one under Node-1, one under Node 2)
            expect(matches).toHaveLength(2);
            expect(matches.every((m) => m.name === "Subnode 1")).toBe(true);
        });
    });
});
