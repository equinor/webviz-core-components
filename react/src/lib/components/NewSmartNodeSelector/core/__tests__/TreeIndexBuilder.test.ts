/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TreeIndexBuilder } from "../TreeIndexBuilder";
import type { TreeDataNode } from "../types/TreeNode";

describe("TreeIndexBuilder", () => {
    describe("build()", () => {
        it("should build indices from simple tree", () => {
            const data: TreeDataNode[] = [
                {
                    name: "A",
                    children: [
                        {
                            name: "B",
                            children: [{ name: "C" }],
                        },
                    ],
                },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            // Should have 3 nodes total
            expect(result.nodes).toHaveLength(3);

            // Should have correct IDs
            expect(result.byId.size).toBe(3);

            // Should have correct paths
            expect(result.byPath.has("A")).toBe(true);
            expect(result.byPath.has("A:B")).toBe(true);
            expect(result.byPath.has("A:B:C")).toBe(true);

            // Should have 1 root
            expect(result.roots).toHaveLength(1);
            expect(result.roots[0].name).toBe("A");
        });

        it("should preserve user-provided IDs", () => {
            const data: TreeDataNode[] = [
                {
                    id: "custom-1",
                    name: "A",
                    children: [{ id: "custom-2", name: "B" }],
                },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            expect(result.byId.has("custom-1")).toBe(true);
            expect(result.byId.has("custom-2")).toBe(true);
        });

        it("should generate IDs when not provided", () => {
            const data: TreeDataNode[] = [
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            // Should have generated IDs
            expect(result.nodes[0].id).toMatch(/^node-/);
            expect(result.nodes[1].id).toMatch(/^node-/);
        });

        it("should build correct parent-child relationships", () => {
            const data: TreeDataNode[] = [
                {
                    name: "A",
                    children: [
                        { name: "B1" },
                        { name: "B2" },
                    ],
                },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            const nodeA = result.byPath.get("A")!;
            const nodeB1 = result.byPath.get("A:B1")!;
            const nodeB2 = result.byPath.get("A:B2")!;

            // A should have 2 children
            expect(nodeA.children).toHaveLength(2);
            expect(nodeA.children[0].name).toBe("B1");
            expect(nodeA.children[1].name).toBe("B2");

            // B1 and B2 should have A as parent
            expect(nodeB1.parent).toBe(nodeA);
            expect(nodeB2.parent).toBe(nodeA);

            // A should have no parent (root)
            expect(nodeA.parent).toBeNull();
        });

        it("should correctly identify leaf nodes", () => {
            const data: TreeDataNode[] = [
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            const nodeA = result.byPath.get("A")!;
            const nodeB = result.byPath.get("A:B")!;

            expect(nodeA.isLeaf).toBe(false);
            expect(nodeB.isLeaf).toBe(true);
        });

        it("should set correct depths", () => {
            const data: TreeDataNode[] = [
                {
                    name: "A",
                    children: [
                        {
                            name: "B",
                            children: [{ name: "C" }],
                        },
                    ],
                },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            expect(result.byPath.get("A")!.depth).toBe(0);
            expect(result.byPath.get("A:B")!.depth).toBe(1);
            expect(result.byPath.get("A:B:C")!.depth).toBe(2);
        });

        it("should preserve description", () => {
            const data: TreeDataNode[] = [
                {
                    name: "A",
                    description: "This is node A",
                },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            const nodeA = result.byPath.get("A")!;
            expect(nodeA.description).toBe("This is node A");
        });

        it("should preserve filterableMetadata", () => {
            const data: TreeDataNode[] = [
                {
                    name: "A",
                    filterableMetadata: {
                        category: "test",
                        type: "node",
                    },
                },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            const nodeA = result.byPath.get("A")!;
            expect(nodeA.filterableMetadata).toEqual({
                category: "test",
                type: "node",
            });
        });

        it("should preserve displayMetadata", () => {
            const data: TreeDataNode[] = [
                {
                    name: "A",
                    displayMetadata: {
                        color: "#ff0000",
                        count: 42,
                        isActive: true,
                    },
                },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            const nodeA = result.byPath.get("A")!;
            expect(nodeA.displayMetadata).toEqual({
                color: "#ff0000",
                count: 42,
                isActive: true,
            });
        });

        it("should handle multiple roots", () => {
            const data: TreeDataNode[] = [
                { name: "A" },
                { name: "B" },
                { name: "C" },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            expect(result.roots).toHaveLength(3);
            expect(result.roots[0].name).toBe("A");
            expect(result.roots[1].name).toBe("B");
            expect(result.roots[2].name).toBe("C");
        });

        it("should use custom delimiter", () => {
            const data: TreeDataNode[] = [
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ];

            const builder = new TreeIndexBuilder("/");
            const result = builder.build(data);

            expect(result.byPath.has("A/B")).toBe(true);
            expect(result.byPath.get("A/B")!.pathString).toBe("A/B");
        });

        it("should build trie structure", () => {
            const data: TreeDataNode[] = [
                {
                    name: "A",
                    children: [
                        { name: "B", children: [{ name: "C" }] },
                    ],
                },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            // Root trie should be empty segment
            expect(result.trie.segment).toBe("");
            expect(result.trie.depth).toBe(0);

            // Should have "A" as child
            const trieA = result.trie.children.get("A");
            expect(trieA).toBeDefined();
            expect(trieA!.segment).toBe("A");
            expect(trieA!.depth).toBe(1);

            // "A" should have "B" as child
            const trieB = trieA!.children.get("B");
            expect(trieB).toBeDefined();
            expect(trieB!.segment).toBe("B");
            expect(trieB!.depth).toBe(2);

            // "B" should have "C" as child
            const trieC = trieB!.children.get("C");
            expect(trieC).toBeDefined();
            expect(trieC!.segment).toBe("C");
            expect(trieC!.depth).toBe(3);
        });

        it("should link indexed nodes to trie nodes", () => {
            const data: TreeDataNode[] = [
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            const trieA = result.trie.children.get("A")!;
            const trieB = trieA.children.get("B")!;

            // Trie nodes should reference indexed nodes
            expect(trieA.nodes).toHaveLength(1);
            expect(trieA.nodes[0].name).toBe("A");

            expect(trieB.nodes).toHaveLength(1);
            expect(trieB.nodes[0].name).toBe("B");
        });

        it("should handle nodes with same name at different depths", () => {
            const data: TreeDataNode[] = [
                {
                    name: "A",
                    children: [
                        {
                            name: "X",
                            children: [{ name: "C" }],
                        },
                    ],
                },
                {
                    name: "B",
                    children: [
                        {
                            name: "X",
                            children: [{ name: "D" }],
                        },
                    ],
                },
            ];

            const builder = new TreeIndexBuilder(":");
            const result = builder.build(data);

            // Both X nodes should exist
            expect(result.byPath.has("A:X")).toBe(true);
            expect(result.byPath.has("B:X")).toBe(true);

            // They should be different nodes
            const xUnderA = result.byPath.get("A:X")!;
            const xUnderB = result.byPath.get("B:X")!;
            expect(xUnderA.id).not.toBe(xUnderB.id);
        });
    });
});
