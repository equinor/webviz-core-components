/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { evaluateQuery } from "../evaluator/evaluateQuery";
import { matchName } from "../matcher";
import { parseQuery } from "../parse";
import {
    TreeIndexBuilder,
    makeIndexedNodeAccessor,
} from "../../TreeIndexBuilder";
import type { TreeDataNode } from "../../types/TreeNode";

describe("evaluateQuery", () => {
    // Helper to create test tree
    function createTestTree(data: TreeDataNode[]) {
        const builder = new TreeIndexBuilder(":");
        const index = builder.build(data);
        const accessor = makeIndexedNodeAccessor(index);
        return { accessor };
    }

    describe("editor mode (default)", () => {
        it("should evaluate simple query successfully", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }, { name: "B" }],
                },
            ]);

            const parsed = parseQuery("Root", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(1);
            expect(Array.from(result.matches)[0].name).toBe("Root");
        });

        it("should evaluate query with wildcards", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [
                        { name: "Test1" },
                        { name: "Test2" },
                        { name: "Other" },
                    ],
                },
            ]);

            const parsed = parseQuery("Root:Test*", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(2);
            const names = Array.from(result.matches)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["Test1", "Test2"]);
        });

        it("should evaluate multi-segment query", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [
                        {
                            name: "A",
                            children: [{ name: "B" }, { name: "C" }],
                        },
                    ],
                },
            ]);

            const parsed = parseQuery("Root:A", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(1);
            expect(Array.from(result.matches)[0].name).toBe("A");
        });

        it("should evaluate deep query", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [
                        {
                            name: "A",
                            children: [{ name: "Target" }],
                        },
                        {
                            name: "B",
                            children: [{ name: "Target" }],
                        },
                    ],
                },
            ]);

            const parsed = parseQuery("Root:**:Target", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(2);
        });

        it("should return empty set when no matches found", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }],
                },
            ]);

            const parsed = parseQuery("NotFound", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(0);
        });

        it("should evaluate query with set expression", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }, { name: "B" }, { name: "C" }],
                },
            ]);

            const parsed = parseQuery("Root:{A,C}", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(2);
            const names = Array.from(result.matches)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["A", "C"]);
        });

        it("should evaluate query with union operator", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }, { name: "B" }],
                },
            ]);

            const parsed = parseQuery("Root:(A|B)", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(2);
            const names = Array.from(result.matches)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["A", "B"]);
        });

        it("should evaluate query with intersection operator", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [
                        { name: "TestData" },
                        { name: "Test" },
                        { name: "Data" },
                    ],
                },
            ]);

            const parsed = parseQuery("Root:(Test*&*Data)", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(1);
            expect(Array.from(result.matches)[0].name).toBe("TestData");
        });

        it("should still evaluate in editor mode even with parse errors", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }],
                },
            ]);

            // Query with unclosed parenthesis
            const parsed = parseQuery("Root:(A", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName, "editor");

            // In editor mode, should still try to evaluate
            expect(result.status).toBe("ok");
        });
    });

    describe("strict mode", () => {
        it("should block evaluation when there are error diagnostics", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }],
                },
            ]);

            // Create a query that will have error diagnostics
            // For example, unclosed parenthesis might create errors
            const parsed = parseQuery("Root:(A", { delimiter: ":" });

            // Force an error diagnostic for testing
            if (parsed.diagnostics.length > 0) {
                parsed.diagnostics[0] = {
                    ...parsed.diagnostics[0],
                    severity: "error",
                };
            } else {
                parsed.diagnostics.push({
                    message: "Test error",
                    severity: "error",
                    charRange: { start: 0, end: 1 },
                });
            }

            const result = evaluateQuery(parsed, accessor, matchName, "strict");

            expect(result.status).toBe("blocked");
            if (result.status === "blocked") {
                expect(result.reason).toBe("parse-errors");
            }
            expect(result.matches.size).toBe(0);
        });

        it("should block evaluation when AST has errors", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }],
                },
            ]);

            const parsed = parseQuery("Root", { delimiter: ":" });

            // Inject an error node into AST
            if (parsed.ast.segments.length > 0) {
                const segment = parsed.ast.segments[0];
                if (segment.kind === "expr") {
                    segment.expr = {
                        kind: "error",
                        message: "Test error",
                        charRange: { start: 0, end: 4 },
                    };
                }
            }

            const result = evaluateQuery(parsed, accessor, matchName, "strict");

            expect(result.status).toBe("blocked");
            if (result.status === "blocked") {
                expect(result.reason).toBe("parse-errors");
            }
            expect(result.matches.size).toBe(0);
        });

        it("should evaluate successfully when there are no errors", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }],
                },
            ]);

            const parsed = parseQuery("Root", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName, "strict");

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(1);
            expect(Array.from(result.matches)[0].name).toBe("Root");
        });

        it("should allow warnings in strict mode", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }],
                },
            ]);

            const parsed = parseQuery("Root", { delimiter: ":" });

            // Add a warning diagnostic
            parsed.diagnostics.push({
                message: "Test warning",
                severity: "warning",
                charRange: { start: 0, end: 4 },
            });

            const result = evaluateQuery(parsed, accessor, matchName, "strict");

            // Warnings should not block evaluation
            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(1);
        });
    });

    describe("complex queries", () => {
        it("should handle realistic tree navigation", () => {
            const { accessor } = createTestTree([
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

            const parsed = parseQuery("DataSource:Sensors:*", {
                delimiter: ":",
            });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(3);
            const names = Array.from(result.matches)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["Flow", "Pressure", "Temperature"]);
        });

        it("should handle deep search across multiple branches", () => {
            const { accessor } = createTestTree([
                {
                    name: "Project",
                    children: [
                        {
                            name: "src",
                            children: [
                                {
                                    name: "components",
                                    children: [{ name: "Button.tsx" }],
                                },
                            ],
                        },
                        {
                            name: "tests",
                            children: [{ name: "Button.test.tsx" }],
                        },
                    ],
                },
            ]);

            const parsed = parseQuery("Project:**:*.tsx", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(2);
            const names = Array.from(result.matches)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["Button.test.tsx", "Button.tsx"]);
        });

        it("should handle complex expression with multiple operators", () => {
            const { accessor } = createTestTree([
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

            const parsed = parseQuery("Root:(Test*&*1|Data*&*2)", {
                delimiter: ":",
            });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(2);
            const names = Array.from(result.matches)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["Data2", "Test1"]);
        });

        it("should handle nested groups", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }, { name: "B" }, { name: "C" }],
                },
            ]);

            const parsed = parseQuery("Root:((A|B))", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(2);
            const names = Array.from(result.matches)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["A", "B"]);
        });
    });

    describe("edge cases", () => {
        it("should handle empty query", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }],
                },
            ]);

            const parsed = parseQuery("", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            // Empty query should return empty set (no complete query)
            expect(result.matches.size).toBe(0);
        });

        it("should handle query with only wildcards", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root1",
                    children: [{ name: "A" }],
                },
                {
                    name: "Root2",
                    children: [{ name: "B" }],
                },
            ]);

            const parsed = parseQuery("*", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(2);
            const names = Array.from(result.matches)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["Root1", "Root2"]);
        });

        it("should handle different delimiter", () => {
            const data = [
                {
                    name: "Root",
                    children: [
                        {
                            name: "A",
                            children: [{ name: "B" }],
                        },
                    ],
                },
            ];

            const builder = new TreeIndexBuilder("/");
            const index = builder.build(data);
            const accessor = makeIndexedNodeAccessor(index);

            const parsed = parseQuery("Root/A", { delimiter: "/" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(1);
            expect(Array.from(result.matches)[0].name).toBe("A");
        });

        it("should handle query matching multiple roots", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root1",
                },
                {
                    name: "Root2",
                },
                {
                    name: "Other",
                },
            ]);

            const parsed = parseQuery("Root*", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(2);
            const names = Array.from(result.matches)
                .map((n) => n.name)
                .sort();
            expect(names).toEqual(["Root1", "Root2"]);
        });

        it("should handle query that breaks mid-path", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [
                        {
                            name: "A",
                            children: [{ name: "B" }],
                        },
                    ],
                },
            ]);

            const parsed = parseQuery("Root:X:B", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName);

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(0);
        });
    });

    describe("mode parameter", () => {
        it("should default to editor mode when mode is not specified", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }],
                },
            ]);

            const parsed = parseQuery("Root", { delimiter: ":" });

            // Add an error diagnostic
            parsed.diagnostics.push({
                message: "Test error",
                severity: "error",
                charRange: { start: 0, end: 4 },
            });

            // No mode specified, should use editor mode
            const result = evaluateQuery(parsed, accessor, matchName);

            // Editor mode should not block
            expect(result.status).toBe("ok");
        });

        it("should use editor mode explicitly", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }],
                },
            ]);

            const parsed = parseQuery("Root", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName, "editor");

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(1);
        });

        it("should use strict mode explicitly", () => {
            const { accessor } = createTestTree([
                {
                    name: "Root",
                    children: [{ name: "A" }],
                },
            ]);

            const parsed = parseQuery("Root", { delimiter: ":" });
            const result = evaluateQuery(parsed, accessor, matchName, "strict");

            expect(result.status).toBe("ok");
            expect(result.matches.size).toBe(1);
        });
    });
});
