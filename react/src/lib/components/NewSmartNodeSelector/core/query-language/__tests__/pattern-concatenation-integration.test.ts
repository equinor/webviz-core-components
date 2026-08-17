import { parseQuery } from "../parse";
import { evaluateQuery } from "../evaluator/evaluateQuery";
import type { TreeAccessor } from "../types/tree";
import { matchName } from "../matcher/matchName";

describe("Pattern concatenation - integration test", () => {
    interface TestNode {
        name: string;
        children: TestNode[];
    }

    const tree: TestNode[] = [
        {
            name: "Root",
            children: [
                { name: "Data Source A", children: [] },
                { name: "Data Source B", children: [] },
                { name: "Data Source C", children: [] },
                { name: "Other Node", children: [] },
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

    it('should match "Data Source (A|B)" correctly', () => {
        const parsed = parseQuery("Root:Data Source (A|B)", { delimiter: ":" });

        expect(parsed.diagnostics.length).toBe(0);

        const result = evaluateQuery(parsed, accessor, matchName);

        expect(result.status).toBe("ok");
        if (result.status === "ok") {
            expect(result.matches.size).toBe(2);

            const resultNames = Array.from(result.matches)
                .map((node) => node.name)
                .sort();
            expect(resultNames).toEqual(["Data Source A", "Data Source B"]);
        }
    });

    it('should not match "Data Source C" with query "Data Source (A|B)"', () => {
        const parsed = parseQuery("Root:Data Source (A|B)", { delimiter: ":" });
        const result = evaluateQuery(parsed, accessor, matchName);

        expect(result.status).toBe("ok");
        if (result.status === "ok") {
            const resultNames = Array.from(result.matches).map(
                (node) => node.name
            );
            expect(resultNames).not.toContain("Data Source C");
            expect(resultNames).not.toContain("Other Node");
        }
    });

    it('should handle complex pattern "Data Source {A,B,C}"', () => {
        const parsed = parseQuery("Root:Data Source {A,B,C}", {
            delimiter: ":",
        });

        expect(parsed.diagnostics.length).toBe(0);

        const result = evaluateQuery(parsed, accessor, matchName);

        expect(result.status).toBe("ok");
        if (result.status === "ok") {
            expect(result.matches.size).toBe(3);

            const resultNames = Array.from(result.matches)
                .map((node) => node.name)
                .sort();
            expect(resultNames).toEqual([
                "Data Source A",
                "Data Source B",
                "Data Source C",
            ]);
        }
    });
});
