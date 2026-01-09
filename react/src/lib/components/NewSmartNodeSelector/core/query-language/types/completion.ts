import type { Range } from "../../utils/range";

export type CompletionNodeOrigin<Node> =
    | { kind: "single"; node: Node; nodeNameRange: Range }
    | { kind: "multi"; nodes: Set<Node>; count: number };

export type CompletionItem<Node> = {
    label: string;
    insertText: string;
    replaceRange: Range;
    segmentReplaceRange: Range;
    detail?: string;
} & (
    | { kind: "node"; origin: CompletionNodeOrigin<Node> }
    | { kind: "unionFlag" | "operator" | "wildcard" | "group" | "set" }
);
