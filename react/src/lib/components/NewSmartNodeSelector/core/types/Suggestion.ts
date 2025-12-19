import type { IndexedNode } from "./TreeNode";

export type Suggestion = {
    /** Display name for the suggestion */
    name: string;

    /** Optional description to show alongside the name */
    description?: string;

    /** Filterable metadata (e.g., type, category, tags) */
    filterableMetadata?: Record<string, string>;

    /** Display metadata (e.g., icons, colors, custom render data) */
    displayMetadata?: Record<string, unknown>;

    /** Reference to the underlying indexed node */
    node?: IndexedNode;

    /** Optional: match score/relevance for sorting */
    score?: number;

    /** Optional: highlighted parts of the name (for search highlighting) */
    highlights?: Array<{ start: number; end: number }>;
};
