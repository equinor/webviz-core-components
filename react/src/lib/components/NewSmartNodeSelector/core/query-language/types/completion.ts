import type { Range } from "../../utils/range";

export type CompletionItemBase = {
    label: string;
    insertText: string;
    replaceRange: Range;
    segmentReplaceRange: Range;
    detail?: string;
};

export type CompletionNodeOrigin<Node> =
    | { kind: "single"; node: Node; nodeNameRange: Range }
    | { kind: "multi"; nodes: Set<Node>; count: number };

export type NodeCompletionItem<Node> = CompletionItemBase & {
    kind: "node";
    origin: CompletionNodeOrigin<Node>;
};

export type SyntaxCompletionItem = CompletionItemBase & {
    kind: "unionFlag" | "operator" | "wildcard" | "group" | "set" | "delimiter";
};

export type CompletionItem<Node> =
    | NodeCompletionItem<Node>
    | SyntaxCompletionItem;
