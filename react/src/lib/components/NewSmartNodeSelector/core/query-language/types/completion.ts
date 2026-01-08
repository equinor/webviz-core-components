import type { Range } from "./range";

export type CompletionItem<Node> = {
    label: string;
    insertText: string;
    replaceRange: Range;
    detail?: string;
} & (
    | { kind: "node"; node: Node }
    | { kind: "operator" | "wildcard" | "group" | "set" }
);
