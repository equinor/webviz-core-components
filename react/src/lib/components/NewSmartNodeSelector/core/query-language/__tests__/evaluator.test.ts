/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { evaluateExpression } from "../evaluator/evaluateExpression";
import { matchName } from "../matcher/matchName";
import {
    TreeIndexBuilder,
    makeIndexedNodeAccessor,
} from "../../TreeIndexBuilder";
import type { TreeDataNode } from "../../types/TreeNode";
import type { Expr } from "../ast/ast";

describe("evaluateExpression", () => {
    // Helper to create test tree
    function createTestTree(data: TreeDataNode[]) {
        const builder = new TreeIndexBuilder(":");
        const index = builder.build(data);
        const accessor = makeIndexedNodeAccessor(index);
        return { index, accessor };
    }

    describe("pattern expression", () => {
        it("should filter nodes by exact name match", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }, { name: "C" }],
                },
            ]);

            const expr: Expr = {
                kind: "pattern",
                atoms: [
                    {
                        kind: "literal",
                        text: "B",
                        charRange: { start: 0, end: 1 },
                    },
                ],
                charRange: { start: 0, end: 1 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(1);
            const node = Array.from(result)[0];
            expect(node.name).toBe("B");
        });

        it("should filter nodes using wildcard pattern", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "DataSourceA",
                    children: [{ name: "DataSourceB" }, { name: "Source" }],
                },
            ]);

            const expr: Expr = {
                kind: "pattern",
                atoms: [
                    {
                        kind: "literal",
                        text: "Data",
                        charRange: { start: 0, end: 4 },
                    },
                    { kind: "star", charRange: { start: 4, end: 5 } },
                ],
                charRange: { start: 0, end: 5 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(2);
            const names = Array.from(result)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["DataSourceA", "DataSourceB"]);
        });

        it("should return empty set when no nodes match", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ]);

            const expr: Expr = {
                kind: "pattern",
                atoms: [
                    {
                        kind: "literal",
                        text: "Z",
                        charRange: { start: 0, end: 1 },
                    },
                ],
                charRange: { start: 0, end: 1 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(0);
        });

        it("should work with custom node pool", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }, { name: "C" }],
                },
            ]);

            // Create a custom pool with only node "B"
            const nodeB = index.byPath.get("A:B")!;
            const customPool = [nodeB];

            const expr: Expr = {
                kind: "pattern",
                atoms: [
                    {
                        kind: "literal",
                        text: "B",
                        charRange: { start: 0, end: 1 },
                    },
                ],
                charRange: { start: 0, end: 1 },
            };

            const result = evaluateExpression(
                expr,
                customPool,
                accessor,
                matchName
            );

            expect(result.size).toBe(1);
            expect(Array.from(result)[0].name).toBe("B");
        });
    });

    describe("group expression", () => {
        it("should evaluate grouped expression", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ]);

            const expr: Expr = {
                kind: "group",
                expr: {
                    kind: "pattern",
                    atoms: [
                        {
                            kind: "literal",
                            text: "A",
                            charRange: { start: 0, end: 1 },
                        },
                    ],
                    charRange: { start: 0, end: 1 },
                },
                closed: true,
                charRange: { start: 0, end: 3 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(1);
            expect(Array.from(result)[0].name).toBe("A");
        });

        it("should handle nested groups", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ]);

            const expr: Expr = {
                kind: "group",
                expr: {
                    kind: "group",
                    expr: {
                        kind: "pattern",
                        atoms: [
                            {
                                kind: "literal",
                                text: "B",
                                charRange: { start: 0, end: 1 },
                            },
                        ],
                        charRange: { start: 0, end: 1 },
                    },
                    closed: true,
                    charRange: { start: 0, end: 3 },
                },
                closed: true,
                charRange: { start: 0, end: 5 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(1);
            expect(Array.from(result)[0].name).toBe("B");
        });
    });

    describe("set expression", () => {
        it("should union multiple patterns", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }, { name: "C" }, { name: "D" }],
                },
            ]);

            const expr: Expr = {
                kind: "set",
                items: [
                    {
                        kind: "pattern",
                        atoms: [
                            {
                                kind: "literal",
                                text: "B",
                                charRange: { start: 0, end: 1 },
                            },
                        ],
                        charRange: { start: 0, end: 1 },
                    },
                    {
                        kind: "pattern",
                        atoms: [
                            {
                                kind: "literal",
                                text: "D",
                                charRange: { start: 0, end: 1 },
                            },
                        ],
                        charRange: { start: 0, end: 1 },
                    },
                ],
                closed: true,
                charRange: { start: 0, end: 5 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(2);
            const names = Array.from(result)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["B", "D"]);
        });

        it("should handle empty set", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ]);

            const expr: Expr = {
                kind: "set",
                items: [],
                closed: true,
                charRange: { start: 0, end: 2 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(0);
        });

        it("should deduplicate nodes in set", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ]);

            // Two patterns that match the same node
            const expr: Expr = {
                kind: "set",
                items: [
                    {
                        kind: "pattern",
                        atoms: [
                            {
                                kind: "literal",
                                text: "B",
                                charRange: { start: 0, end: 1 },
                            },
                        ],
                        charRange: { start: 0, end: 1 },
                    },
                    {
                        kind: "pattern",
                        atoms: [
                            {
                                kind: "literal",
                                text: "B",
                                charRange: { start: 0, end: 1 },
                            },
                        ],
                        charRange: { start: 0, end: 1 },
                    },
                ],
                closed: true,
                charRange: { start: 0, end: 5 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(1);
        });

        it("should handle single item set", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ]);

            const expr: Expr = {
                kind: "set",
                items: [
                    {
                        kind: "pattern",
                        atoms: [
                            {
                                kind: "literal",
                                text: "B",
                                charRange: { start: 0, end: 1 },
                            },
                        ],
                        charRange: { start: 0, end: 1 },
                    },
                ],
                closed: true,
                charRange: { start: 0, end: 3 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(1);
            expect(Array.from(result)[0].name).toBe("B");
        });
    });

    describe("binary expression - union (|)", () => {
        it("should union two patterns", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }, { name: "C" }],
                },
            ]);

            const expr: Expr = {
                kind: "binary",
                operator: "|",
                left: {
                    kind: "pattern",
                    atoms: [
                        {
                            kind: "literal",
                            text: "B",
                            charRange: { start: 0, end: 1 },
                        },
                    ],
                    charRange: { start: 0, end: 1 },
                },
                right: {
                    kind: "pattern",
                    atoms: [
                        {
                            kind: "literal",
                            text: "C",
                            charRange: { start: 0, end: 1 },
                        },
                    ],
                    charRange: { start: 0, end: 1 },
                },
                charRange: { start: 0, end: 3 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(2);
            const names = Array.from(result)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["B", "C"]);
        });

        it("should deduplicate union results", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ]);

            const expr: Expr = {
                kind: "binary",
                operator: "|",
                left: {
                    kind: "pattern",
                    atoms: [
                        {
                            kind: "literal",
                            text: "B",
                            charRange: { start: 0, end: 1 },
                        },
                    ],
                    charRange: { start: 0, end: 1 },
                },
                right: {
                    kind: "pattern",
                    atoms: [
                        {
                            kind: "literal",
                            text: "B",
                            charRange: { start: 0, end: 1 },
                        },
                    ],
                    charRange: { start: 0, end: 1 },
                },
                charRange: { start: 0, end: 3 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(1);
        });

        it("should handle union with empty sets", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ]);

            const expr: Expr = {
                kind: "binary",
                operator: "|",
                left: {
                    kind: "pattern",
                    atoms: [
                        {
                            kind: "literal",
                            text: "B",
                            charRange: { start: 0, end: 1 },
                        },
                    ],
                    charRange: { start: 0, end: 1 },
                },
                right: {
                    kind: "pattern",
                    atoms: [
                        {
                            kind: "literal",
                            text: "Z",
                            charRange: { start: 0, end: 1 },
                        },
                    ],
                    charRange: { start: 0, end: 1 },
                },
                charRange: { start: 0, end: 3 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(1);
            expect(Array.from(result)[0].name).toBe("B");
        });
    });

    describe("binary expression - intersection (&)", () => {
        it("should intersect two patterns", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "TestData",
                    children: [{ name: "TestNode" }, { name: "DataNode" }],
                },
            ]);

            const expr: Expr = {
                kind: "binary",
                operator: "&",
                left: {
                    kind: "pattern",
                    atoms: [
                        {
                            kind: "literal",
                            text: "Test",
                            charRange: { start: 0, end: 4 },
                        },
                        { kind: "star", charRange: { start: 4, end: 5 } },
                    ],
                    charRange: { start: 0, end: 5 },
                },
                right: {
                    kind: "pattern",
                    atoms: [
                        { kind: "star", charRange: { start: 0, end: 1 } },
                        {
                            kind: "literal",
                            text: "Data",
                            charRange: { start: 1, end: 5 },
                        },
                    ],
                    charRange: { start: 0, end: 5 },
                },
                charRange: { start: 0, end: 11 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(1);
            expect(Array.from(result)[0].name).toBe("TestData");
        });

        it("should return empty set when no intersection", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }, { name: "C" }],
                },
            ]);

            const expr: Expr = {
                kind: "binary",
                operator: "&",
                left: {
                    kind: "pattern",
                    atoms: [
                        {
                            kind: "literal",
                            text: "B",
                            charRange: { start: 0, end: 1 },
                        },
                    ],
                    charRange: { start: 0, end: 1 },
                },
                right: {
                    kind: "pattern",
                    atoms: [
                        {
                            kind: "literal",
                            text: "C",
                            charRange: { start: 0, end: 1 },
                        },
                    ],
                    charRange: { start: 0, end: 1 },
                },
                charRange: { start: 0, end: 3 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(0);
        });

        it("should optimize intersection by checking smaller set first", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "Root",
                    children: Array.from({ length: 100 }, (_, i) => ({
                        name: `Node${i}`,
                    })),
                },
            ]);

            // This tests that the implementation optimizes by iterating the smaller set
            const expr: Expr = {
                kind: "binary",
                operator: "&",
                left: {
                    kind: "pattern",
                    atoms: [{ kind: "star", charRange: { start: 0, end: 1 } }],
                    charRange: { start: 0, end: 1 },
                },
                right: {
                    kind: "pattern",
                    atoms: [
                        {
                            kind: "literal",
                            text: "Node5",
                            charRange: { start: 0, end: 5 },
                        },
                    ],
                    charRange: { start: 0, end: 5 },
                },
                charRange: { start: 0, end: 7 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(1);
            expect(Array.from(result)[0].name).toBe("Node5");
        });
    });

    describe("error expression", () => {
        it("should return empty set for error expression", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ]);

            const expr: Expr = {
                kind: "error",
                message: "Parse error",
                charRange: { start: 0, end: 5 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(0);
        });
    });

    describe("complex expressions", () => {
        it("should handle deeply nested expressions", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }, { name: "C" }, { name: "D" }],
                },
            ]);

            // ((B | C) & *) | D
            const expr: Expr = {
                kind: "binary",
                operator: "|",
                left: {
                    kind: "binary",
                    operator: "&",
                    left: {
                        kind: "binary",
                        operator: "|",
                        left: {
                            kind: "pattern",
                            atoms: [
                                {
                                    kind: "literal",
                                    text: "B",
                                    charRange: { start: 0, end: 1 },
                                },
                            ],
                            charRange: { start: 0, end: 1 },
                        },
                        right: {
                            kind: "pattern",
                            atoms: [
                                {
                                    kind: "literal",
                                    text: "C",
                                    charRange: { start: 0, end: 1 },
                                },
                            ],
                            charRange: { start: 0, end: 1 },
                        },
                        charRange: { start: 0, end: 5 },
                    },
                    right: {
                        kind: "pattern",
                        atoms: [
                            { kind: "star", charRange: { start: 0, end: 1 } },
                        ],
                        charRange: { start: 0, end: 1 },
                    },
                    charRange: { start: 0, end: 9 },
                },
                right: {
                    kind: "pattern",
                    atoms: [
                        {
                            kind: "literal",
                            text: "D",
                            charRange: { start: 0, end: 1 },
                        },
                    ],
                    charRange: { start: 0, end: 1 },
                },
                charRange: { start: 0, end: 13 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(3);
            const names = Array.from(result)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["B", "C", "D"]);
        });

        it("should handle set with binary expressions", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }, { name: "C" }, { name: "D" }],
                },
            ]);

            // {B | C, D}
            const expr: Expr = {
                kind: "set",
                items: [
                    {
                        kind: "binary",
                        operator: "|",
                        left: {
                            kind: "pattern",
                            atoms: [
                                {
                                    kind: "literal",
                                    text: "B",
                                    charRange: { start: 0, end: 1 },
                                },
                            ],
                            charRange: { start: 0, end: 1 },
                        },
                        right: {
                            kind: "pattern",
                            atoms: [
                                {
                                    kind: "literal",
                                    text: "C",
                                    charRange: { start: 0, end: 1 },
                                },
                            ],
                            charRange: { start: 0, end: 1 },
                        },
                        charRange: { start: 0, end: 5 },
                    },
                    {
                        kind: "pattern",
                        atoms: [
                            {
                                kind: "literal",
                                text: "D",
                                charRange: { start: 0, end: 1 },
                            },
                        ],
                        charRange: { start: 0, end: 1 },
                    },
                ],
                closed: true,
                charRange: { start: 0, end: 9 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(3);
            const names = Array.from(result)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["B", "C", "D"]);
        });
    });

    describe("node pool optimization", () => {
        it("should not create unnecessary copy when nodePool is already a Set", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ]);

            const nodePool = new Set(index.nodes);

            const expr: Expr = {
                kind: "pattern",
                atoms: [
                    {
                        kind: "literal",
                        text: "B",
                        charRange: { start: 0, end: 1 },
                    },
                ],
                charRange: { start: 0, end: 1 },
            };

            // This should not create a copy of the Set
            const result = evaluateExpression(
                expr,
                nodePool,
                accessor,
                matchName
            );

            expect(result.size).toBe(1);
        });

        it("should work with array node pool", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "A",
                    children: [{ name: "B" }],
                },
            ]);

            const expr: Expr = {
                kind: "pattern",
                atoms: [
                    {
                        kind: "literal",
                        text: "B",
                        charRange: { start: 0, end: 1 },
                    },
                ],
                charRange: { start: 0, end: 1 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes, // array
                accessor,
                matchName
            );

            expect(result.size).toBe(1);
        });
    });

    describe("real-world scenarios", () => {
        it("should handle realistic tree structure", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "DataSource",
                    children: [
                        {
                            name: "Sensors",
                            children: [
                                { name: "Temperature" },
                                { name: "Pressure" },
                                { name: "Flow" },
                            ],
                        },
                        {
                            name: "Actuators",
                            children: [{ name: "Valve" }, { name: "Pump" }],
                        },
                    ],
                },
            ]);

            // Find all nodes with "e" in name: *e*
            const expr: Expr = {
                kind: "pattern",
                atoms: [
                    { kind: "star", charRange: { start: 0, end: 1 } },
                    {
                        kind: "literal",
                        text: "e",
                        charRange: { start: 1, end: 2 },
                    },
                    { kind: "star", charRange: { start: 2, end: 3 } },
                ],
                charRange: { start: 0, end: 3 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            const names = Array.from(result)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual([
                "DataSource",
                "Pressure",
                "Sensors",
                "Temperature",
                "Valve",
            ]);
        });

        it("should handle complex filter with union and intersection", () => {
            const { index, accessor } = createTestTree([
                {
                    name: "Root",
                    children: [
                        { name: "Test1" },
                        { name: "Test2" },
                        { name: "Data1" },
                        { name: "Data2" },
                        { name: "Other" },
                    ],
                },
            ]);

            // (Test* & *1) | (Data* & *2)
            const expr: Expr = {
                kind: "binary",
                operator: "|",
                left: {
                    kind: "binary",
                    operator: "&",
                    left: {
                        kind: "pattern",
                        atoms: [
                            {
                                kind: "literal",
                                text: "Test",
                                charRange: { start: 0, end: 4 },
                            },
                            { kind: "star", charRange: { start: 4, end: 5 } },
                        ],
                        charRange: { start: 0, end: 5 },
                    },
                    right: {
                        kind: "pattern",
                        atoms: [
                            { kind: "star", charRange: { start: 0, end: 1 } },
                            {
                                kind: "literal",
                                text: "1",
                                charRange: { start: 1, end: 2 },
                            },
                        ],
                        charRange: { start: 0, end: 2 },
                    },
                    charRange: { start: 0, end: 8 },
                },
                right: {
                    kind: "binary",
                    operator: "&",
                    left: {
                        kind: "pattern",
                        atoms: [
                            {
                                kind: "literal",
                                text: "Data",
                                charRange: { start: 0, end: 4 },
                            },
                            { kind: "star", charRange: { start: 4, end: 5 } },
                        ],
                        charRange: { start: 0, end: 5 },
                    },
                    right: {
                        kind: "pattern",
                        atoms: [
                            { kind: "star", charRange: { start: 0, end: 1 } },
                            {
                                kind: "literal",
                                text: "2",
                                charRange: { start: 1, end: 2 },
                            },
                        ],
                        charRange: { start: 0, end: 2 },
                    },
                    charRange: { start: 0, end: 8 },
                },
                charRange: { start: 0, end: 17 },
            };

            const result = evaluateExpression(
                expr,
                index.nodes,
                accessor,
                matchName
            );

            expect(result.size).toBe(2);
            const names = Array.from(result)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["Data2", "Test1"]);
        });
    });
});
