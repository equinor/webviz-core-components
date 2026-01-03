import type { IndexedNode } from "./TreeNode";

/**
 * Unified suggestion type for autocomplete
 * Used by both TagSuggestionEngine and UI components
 */
export type Suggestion = {
    /** Display name for the suggestion */
    name: string;

    /** Full completed tag if user accepts this suggestion */
    completedTag: string;

    /** Type of suggestion */
    type: "node" | "partial" | "wildcard";

    /** Description text to display */
    description: string;

    /** Reference to the underlying indexed node (contains metadata, path, etc.) */
    node?: IndexedNode;

    /** Number of nodes matched (for partial/wildcard suggestions) */
    nodeCount?: number;

    /** Optional: match score/relevance for sorting */
    score?: number;

    /** Optional: highlighted parts of the name (for search highlighting) */
    highlights?: Array<{ start: number; end: number }>;

    /**
     * Optional: Context prefix to display (grayed out) before the main suggestion
     * Example: for "Data Source (A|B", contextPrefix would be "Data Source (A|"
     */
    contextPrefix?: string;

    /**
     * Optional: The actual text that will be inserted when this suggestion is applied
     * If not specified, uses the 'name' field
     * Example: for "Data Source (A|B", insertText would be "B"
     */
    insertText?: string;

    isFocused?: boolean;
};
