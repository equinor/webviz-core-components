import { parseQuery } from "../parse";
import { evaluateQuery } from "../evaluator/evaluateQuery";
import type { TreeAccessor } from "../types/tree";
import { matchName } from "../matcher/matchName";

describe("Union mode with + prefix", () => {
    interface TestNode {
        name: string;
        children: TestNode[];
    }

    // Tree structure:
    // Root
    //   ├─ ParentA
    //   │   ├─ CommonChild
    //   │   └─ ChildOnlyInA
    //   └─ ParentB
    //       ├─ CommonChild
    //       └─ ChildOnlyInB

    const tree: TestNode[] = [
        {
            name: "Root",
            children: [
                {
                    name: "ParentA",
                    children: [
                        { name: "CommonChild", children: [] },
                        { name: "ChildOnlyInA", children: [] },
                    ],
                },
                {
                    name: "ParentB",
                    children: [
                        { name: "CommonChild", children: [] },
                        { name: "ChildOnlyInB", children: [] },
                    ],
                },
            ],
        },
    ];

    const root: TestNode = {
        name: "__ROOT__",
        children: tree,
    };

    const accessor: TreeAccessor<TestNode> = {
        getRoot: () => root,
        getName: (node) => node.name,
        getChildren: (node) => node.children,
    };

    it("should use intersection (default) - only common children", () => {
        // Query: Root:(ParentA|ParentB):*
        // This should match only children whose NAMES appear in BOTH ParentA and ParentB
        const parsed = parseQuery("Root:(ParentA|ParentB):*", {
            delimiter: ":",
        });

        expect(parsed.diagnostics.length).toBe(0);

        const result = evaluateQuery(parsed, accessor, matchName);

        expect(result.status).toBe("ok");
        if (result.status === "ok") {
            const resultNames = Array.from(result.matches)
                .map((node) => node.name)
                .sort();

            // Should match both instances of CommonChild (name exists in both parents)
            expect(resultNames).toEqual(["CommonChild", "CommonChild"]);
        }
    });

    it("should use union with + prefix - all children from any parent", () => {
        // Query: Root:+(ParentA|ParentB):*
        // The + prefix on segment 2 means: when collecting children for segment 3,
        // get ALL children from ANY matched parent (union)
        const parsed = parseQuery("Root:+(ParentA|ParentB):*", {
            delimiter: ":",
        });

        expect(parsed.diagnostics.length).toBe(0);

        const result = evaluateQuery(parsed, accessor, matchName);

        expect(result.status).toBe("ok");
        if (result.status === "ok") {
            const resultNames = Array.from(result.matches)
                .map((node) => node.name)
                .sort();

            // Should match all 4 child node instances from both parents
            expect(resultNames).toEqual([
                "ChildOnlyInA",
                "ChildOnlyInB",
                "CommonChild",
                "CommonChild",
            ]);
        }
    });

    it("should handle + prefix with single parent (no difference)", () => {
        // When there's only one parent, intersection and union are the same
        const parsedDefault = parseQuery("Root:ParentA:*", { delimiter: ":" });
        const parsedUnion = parseQuery("Root:+ParentA:*", { delimiter: ":" });

        const resultDefault = evaluateQuery(parsedDefault, accessor, matchName);
        const resultUnion = evaluateQuery(parsedUnion, accessor, matchName);

        expect(resultDefault.status).toBe("ok");
        expect(resultUnion.status).toBe("ok");

        if (resultDefault.status === "ok" && resultUnion.status === "ok") {
            const namesDefault = Array.from(resultDefault.matches)
                .map((node) => node.name)
                .sort();
            const namesUnion = Array.from(resultUnion.matches)
                .map((node) => node.name)
                .sort();

            // Both should return the same results
            expect(namesDefault).toEqual(namesUnion);
            expect(namesDefault).toEqual(["ChildOnlyInA", "CommonChild"]);
        }
    });
});
