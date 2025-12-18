/**
 * Large dataset performance and correctness tests
 * Tests the indexing and matching capabilities with deep tree structures
 */
import { TreeIndexBuilder } from "../TreeIndexBuilder";
import { TreeMatcher } from "../TreeMatcher";
import { TagParser } from "../TagParser";
import { TagSuggestionEngine } from "../TagSuggestionEngine";
import type { TreeDataNode } from "../types/TreeNode";

describe("Large Dataset Tests - Depth 4", () => {
    const DELIMITER = ":";

    /**
     * Generate a large tree structure with configurable depth and branching
     */
    function generateLargeTree(
        depth: number,
        branchingFactor: number,
        nodePrefix = "Node"
    ): TreeDataNode[] {
        let nodeId = 0;

        function generateLevel(
            currentDepth: number,
            parentPath: string
        ): TreeDataNode[] {
            if (currentDepth === 0) {
                return [];
            }

            const nodes: TreeDataNode[] = [];

            for (let i = 0; i < branchingFactor; i++) {
                nodeId++;
                const name = `${nodePrefix}${currentDepth}_${i + 1}`;
                const path = parentPath ? `${parentPath}/${name}` : name;

                const node: TreeDataNode = {
                    id: `id-${nodeId}`,
                    name: name,
                    description: `Description for ${name} at depth ${currentDepth}`,
                };

                // Add children if not at leaf level
                if (currentDepth > 1) {
                    node.children = generateLevel(currentDepth - 1, path);
                }

                nodes.push(node);
            }

            return nodes;
        }

        return generateLevel(depth, "");
    }

    describe("Tree with depth 4 and 5 branches per level", () => {
        let largeTree: TreeDataNode[];
        let builder: TreeIndexBuilder;
        let buildResult: ReturnType<typeof builder.build>;
        let matcher: TreeMatcher;
        let parser: TagParser;
        let engine: TagSuggestionEngine;

        // 5^4 = 625 leaf nodes, plus intermediate nodes = 781 total nodes
        const DEPTH = 4;
        const BRANCHING = 5;

        beforeAll(() => {
            largeTree = generateLargeTree(DEPTH, BRANCHING);
            builder = new TreeIndexBuilder(DELIMITER);
            buildResult = builder.build(largeTree);
            matcher = new TreeMatcher(buildResult);
            parser = new TagParser(DELIMITER);
            engine = new TagSuggestionEngine(DELIMITER);
            engine.setData(largeTree);
        });

        test("generates correct tree structure", () => {
            expect(largeTree).toHaveLength(BRANCHING); // 5 root nodes
            expect(largeTree[0].children).toHaveLength(BRANCHING); // 5 children each
            expect(largeTree[0].children![0].children).toHaveLength(BRANCHING);
            expect(largeTree[0].children![0].children![0].children).toHaveLength(
                BRANCHING
            );
            // Depth 4 - leaf nodes should not have children
            expect(
                largeTree[0].children![0].children![0].children![0].children
            ).toBeUndefined();
        });

        test("calculates correct total node count", () => {
            // Formula: sum of geometric series
            // Total = b + b^2 + b^3 + b^4 where b = branching factor
            // For b=5, d=4: 5 + 25 + 125 + 625 = 780
            const expectedTotal = 5 + 25 + 125 + 625;
            expect(buildResult.nodes.length).toBe(expectedTotal);
        });

        test("indexes all nodes correctly", () => {
            // Check that all nodes have unique IDs
            const ids = buildResult.nodes.map((n) => n.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);

            // Check that all nodes have paths
            buildResult.nodes.forEach((node) => {
                expect(node.path).toBeDefined();
                expect(node.path.length).toBeGreaterThan(0);
                expect(node.path.length).toBeLessThanOrEqual(DEPTH);
            });
        });

        test("match exact leaf node path", () => {
            // Test a deep path: Node4_1:Node3_1:Node2_1:Node1_1
            const tag = "Node4_1:Node3_1:Node2_1:Node1_1";
            const query = parser.parse(tag);
            const matches = matcher.match(query);

            expect(matches).toHaveLength(1);
            expect(matches[0].path.join(":")).toBe(tag);
        });

        test("match wildcard at each level", () => {
            // Level 1: * - matches only root level nodes
            let matches = matcher.match(parser.parse("*"));
            expect(matches.length).toBe(5); // 5 root nodes

            // Level 2: Node4_1:*
            matches = matcher.match(parser.parse("Node4_1:*"));
            expect(matches.length).toBe(5); // 5 children of Node4_1

            // Level 3: Node4_1:Node3_1:*
            matches = matcher.match(parser.parse("Node4_1:Node3_1:*"));
            expect(matches.length).toBe(5); // 5 children of Node4_1:Node3_1

            // Level 4: Node4_1:Node3_1:Node2_1:*
            matches = matcher.match(parser.parse("Node4_1:Node3_1:Node2_1:*"));
            expect(matches.length).toBe(5); // 5 leaf nodes
        });

        test("match prefix at different levels", () => {
            // Prefix "Node4" at root - should match all root nodes starting with Node4
            const matches1 = matcher.match(parser.parse("Node4*"));
            expect(matches1.length).toBe(5); // All 5 root nodes start with Node4

            // Prefix at second level
            const matches2 = matcher.match(parser.parse("Node4_1:Node3*"));
            expect(matches2.length).toBe(5); // All 5 children start with Node3

            // Prefix at third level
            const matches3 = matcher.match(parser.parse("Node4_1:Node3_1:Node2*"));
            expect(matches3.length).toBe(5); // All 5 children start with Node2
        });

        test("suggestions for empty input returns root nodes", () => {
            const suggestions = engine.getSuggestions("", 10);

            expect(suggestions).toHaveLength(5); // 5 root nodes
            suggestions.forEach((s) => {
                expect(s.type).toBe("node");
                // Root nodes with children end with delimiter
                expect(s.completedTag).toContain("Node4_");
            });
        });

        test("suggestions for partial path at depth 2", () => {
            const suggestions = engine.getSuggestions("Node4_1:", 10);

            expect(suggestions.length).toBeGreaterThanOrEqual(5);
            suggestions.forEach((s) => {
                expect(s.completedTag).toMatch(/^Node4_1:Node3_\d/);
            });
        });

        test("suggestions for partial path at depth 3", () => {
            const suggestions = engine.getSuggestions(
                "Node4_1:Node3_1:",
                10
            );

            expect(suggestions.length).toBeGreaterThanOrEqual(5);
            suggestions.forEach((s) => {
                expect(s.completedTag).toMatch(/^Node4_1:Node3_1:Node2_\d/);
            });
        });

        test("suggestions for leaf level (depth 4)", () => {
            const suggestions = engine.getSuggestions(
                "Node4_1:Node3_1:Node2_1:",
                10
            );

            expect(suggestions).toHaveLength(5); // 5 leaf nodes
            suggestions.forEach((s) => {
                expect(s.type).toBe("node");
                // Leaf nodes should NOT end with delimiter
                expect(s.completedTag.endsWith(DELIMITER)).toBe(false);
                expect(s.completedTag).toMatch(
                    /^Node4_1:Node3_1:Node2_1:Node1_\d$/
                );
            });
        });

        test("suggestions with prefix matching at each level", () => {
            // Prefix at level 1
            let suggestions = engine.getSuggestions("Node4_1", 10);
            expect(suggestions.length).toBeGreaterThan(0);

            // Prefix at level 2
            suggestions = engine.getSuggestions("Node4_1:Node3_2", 10);
            expect(suggestions.length).toBeGreaterThan(0);

            // Prefix at level 3
            suggestions = engine.getSuggestions("Node4_1:Node3_1:Node2_3", 10);
            expect(suggestions.length).toBeGreaterThan(0);

            // Prefix at level 4 (leaf level)
            suggestions = engine.getSuggestions(
                "Node4_1:Node3_1:Node2_1:Node1_2",
                10
            );
            expect(suggestions.length).toBeGreaterThan(0);
        });

        test("case-insensitive suggestions but case-sensitive matching", () => {
            // Matching is case-sensitive - lowercase won't match
            const matches = matcher.match(parser.parse("node4_1:node3_1:*"));
            expect(matches.length).toBe(0); // No match - case doesn't match

            // But with correct case it works
            const matchesCorrectCase = matcher.match(parser.parse("Node4_1:Node3_1:*"));
            expect(matchesCorrectCase.length).toBe(5);

            // Suggestions are case-insensitive for PREFIX matching of the LAST segment only
            // But the completed path must still match exactly (case-sensitive)
            const suggestionsWrongCase = engine.getSuggestions("node4_1:node3_1:", 10);
            expect(suggestionsWrongCase.length).toBe(0); // No suggestions - path doesn't exist

            // With correct case for completed path, can use lowercase prefix for last segment
            const suggestionsCorrectPath = engine.getSuggestions("Node4_1:Node3_1:node", 10);
            expect(suggestionsCorrectPath.length).toBe(5); // Finds Node2_* nodes (case-insensitive prefix)
        });

        test("wildcard combinations at different depths", () => {
            // *:Node3_1 - any root, then Node3_1
            let matches = matcher.match(parser.parse("*:Node3_1"));
            expect(matches.length).toBeGreaterThan(0);

            // *:*:Node2_1 - any first two levels, then Node2_1
            matches = matcher.match(parser.parse("*:*:Node2_1"));
            expect(matches.length).toBeGreaterThan(0);

            // *:*:*:Node1_1 - any first three levels, then Node1_1
            matches = matcher.match(parser.parse("*:*:*:Node1_1"));
            expect(matches.length).toBeGreaterThan(0);
        });

        test("node lookup by ID", () => {
            const allNodes = engine.getAllNodes();
            const randomNode = allNodes[100];

            const foundNode = engine.getNodeById(randomNode.id);
            expect(foundNode).toBeDefined();
            expect(foundNode?.id).toBe(randomNode.id);
        });

        test("node lookup by path", () => {
            const path = "Node4_1:Node3_1:Node2_1:Node1_1";
            const node = engine.getNodeByPath(path);

            expect(node).toBeDefined();
            expect(node?.path.join(":")).toBe(path);
        });

        test("validation of valid deep paths", () => {
            const result = engine.validate("Node4_1:Node3_1:Node2_1:Node1_1");
            expect(result.valid).toBe(true);
        });

        test("validation of invalid paths", () => {
            // Current validator only checks syntax, not semantic validity
            // A path with non-existent nodes is syntactically valid but semantically invalid
            // This would need to be caught by checking getMatches() returns empty
            const result = engine.validate(
                "Node4_1:InvalidNode:Node2_1:Node1_1"
            );
            expect(result.valid).toBe(true); // Syntactically valid

            // But it won't match any nodes
            const matches = engine.getMatches("Node4_1:InvalidNode:Node2_1:Node1_1");
            expect(matches.length).toBe(0);
        });

        test("performance: matching with wildcards on large tree", () => {
            const start = performance.now();

            // Perform 100 wildcard matches
            for (let i = 0; i < 100; i++) {
                matcher.match(parser.parse("*:*:*:Node1_1"));
            }

            const end = performance.now();
            const duration = end - start;

            // Should complete 100 matches in under 100ms (1ms per match)
            expect(duration).toBeLessThan(100);
        });

        test("performance: getting suggestions on large tree", () => {
            const start = performance.now();

            // Perform 100 suggestion queries at different depths
            for (let i = 0; i < 25; i++) {
                engine.getSuggestions("", 10);
                engine.getSuggestions("Node4_1:", 10);
                engine.getSuggestions("Node4_1:Node3_1:", 10);
                engine.getSuggestions("Node4_1:Node3_1:Node2_1:", 10);
            }

            const end = performance.now();
            const duration = end - start;

            // Should complete 100 queries in under 100ms
            expect(duration).toBeLessThan(100);
        });
    });

    describe("Very large tree - depth 4 with 10 branches", () => {
        // 10^4 = 10,000 leaf nodes, plus intermediate nodes = 11,110 total nodes
        const DEPTH = 4;
        const BRANCHING = 10;

        let veryLargeTree: TreeDataNode[];
        let engine: TagSuggestionEngine;

        beforeAll(() => {
            veryLargeTree = generateLargeTree(DEPTH, BRANCHING);
            engine = new TagSuggestionEngine(DELIMITER);
            engine.setData(veryLargeTree);
        });

        test("handles very large dataset", () => {
            const allNodes = engine.getAllNodes();
            const expectedTotal = 10 + 100 + 1000 + 10000; // 11,110
            expect(allNodes.length).toBe(expectedTotal);
        });

        test("suggestions work with 10k+ nodes", () => {
            const suggestions = engine.getSuggestions("", 10);
            expect(suggestions).toHaveLength(10); // 10 root nodes
        });

        test("matching works with 10k+ nodes", () => {
            const matches = engine.getMatches("Node4_1:Node3_1:Node2_1:*");
            expect(matches).toHaveLength(10); // 10 leaf nodes
        });

        test("performance: indexing very large tree", () => {
            const start = performance.now();

            const builder = new TreeIndexBuilder(DELIMITER);
            builder.build(veryLargeTree);

            const end = performance.now();
            const duration = end - start;

            // Should index 11k nodes in under 100ms
            expect(duration).toBeLessThan(100);
        });

        test("performance: prefix search in very large tree", () => {
            const start = performance.now();

            // Search for all nodes starting with "Node4_1"
            const suggestions = engine.getSuggestions("Node4_1", 100);

            const end = performance.now();
            const duration = end - start;

            expect(suggestions.length).toBeGreaterThan(0);
            // Should search through 11k nodes in under 10ms
            expect(duration).toBeLessThan(10);
        });
    });

    describe("Edge cases with deep trees", () => {
        test("handles tree with maximum depth at different branches", () => {
            // Create a tree where some branches are deeper than others
            const unevenTree: TreeDataNode[] = [
                {
                    id: "1",
                    name: "Shallow",
                    description: "Shallow branch",
                },
                {
                    id: "2",
                    name: "Deep",
                    description: "Deep branch",
                    children: [
                        {
                            id: "2.1",
                            name: "Level2",
                            children: [
                                {
                                    id: "2.1.1",
                                    name: "Level3",
                                    children: [
                                        {
                                            id: "2.1.1.1",
                                            name: "Level4",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ];

            const engine = new TagSuggestionEngine(DELIMITER);
            engine.setData(unevenTree);

            // Should handle both depths correctly
            const shallowMatches = engine.getMatches("Shallow");
            expect(shallowMatches).toHaveLength(1);

            const deepMatches = engine.getMatches("Deep:Level2:Level3:Level4");
            expect(deepMatches).toHaveLength(1);
        });

        test("handles nodes with same names at different levels", () => {
            const tree: TreeDataNode[] = [
                {
                    id: "1",
                    name: "Item",
                    children: [
                        {
                            id: "1.1",
                            name: "Item",
                            children: [
                                {
                                    id: "1.1.1",
                                    name: "Item",
                                    children: [
                                        {
                                            id: "1.1.1.1",
                                            name: "Item",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ];

            const engine = new TagSuggestionEngine(DELIMITER);
            engine.setData(tree);

            // Should match the full path
            const matches = engine.getMatches("Item:Item:Item:Item");
            expect(matches).toHaveLength(1);
            expect(matches[0].path).toHaveLength(4);
        });
    });
});
