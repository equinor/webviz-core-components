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

export type SegmentCompletionItem<Node> = CompletionItemBase & {
    kind: "segment";
    origin: CompletionNodeOrigin<Node>;
};

export type SyntaxCompletionItem = CompletionItemBase & {
    kind:
        | "unionFlag"
        | "operator"
        | "wildcard"
        | "group"
        | "set"
        | "delimiter"
        | "attributeFilter";
};

export type AttributeNameCompletionItem = CompletionItemBase & {
    kind: "attributeName";
};

export type AttributeValueCompletionItem<Node> = CompletionItemBase & {
    kind: "attributeValue";
    origin: CompletionNodeOrigin<Node>;
};

export type CompletionItem<Node> =
    | NodeCompletionItem<Node>
    | SegmentCompletionItem<Node>
    | SyntaxCompletionItem
    | AttributeNameCompletionItem
    | AttributeValueCompletionItem<Node>;
