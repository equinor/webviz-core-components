import type { Range } from "./range";

export type CompletionItem = {
    label: string;
    insertText: string;
    replaceRange: Range;
    kind: "node" | "operator" | "wildcard" | "group" | "set";
    detail?: string;
};
