/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * User-provided tree node structure
 */
export interface TreeDataNode {
    id?: string;
    name: string;

    /** Searchable description (queried alongside name) */
    description?: string;

    /**
     * Filterable metadata - indexed for querying (Phase 2)
     * All values must be strings
     */
    filterableMetadata?: Record<string, string>;

    /**
     * Display metadata - for rendering only, not indexed
     * Can contain any data type (colors, icons, computed values, etc.)
     */
    displayMetadata?: Record<string, unknown>;

    children?: TreeDataNode[];
}

/**
 * Internal indexed node representation
 * Optimized for fast lookups and traversal
 */
export interface IndexedNode {
    /** Unique identifier (from user data or generated) */
    id: string;

    /** Node name (single segment) */
    name: string;

    /** Searchable description (queried alongside name) */
    description?: string;

    /** Full path as array ["A", "B", "C"] */
    path: string[];

    /** Full path as string "A:B:C" (for fast comparison) */
    pathString: string;

    /** Depth in tree (0 = root) */
    depth: number;

    /** Parent node reference (null for roots) */
    parent: IndexedNode | null;

    /** Direct children */
    children: IndexedNode[];

    /** Is this a leaf node? */
    isLeaf: boolean;

    /** Filterable metadata (for Phase 2 querying) */
    filterableMetadata: Record<string, string>;

    /** Display metadata (for rendering) */
    displayMetadata: Record<string, unknown>;
}

/**
 * Trie node for efficient pattern matching
 */
export interface TrieNode {
    /** Segment name at this level */
    segment: string;

    /** All indexed nodes at this path */
    nodes: IndexedNode[];

    /** Child trie nodes (segment name → TrieNode) */
    children: Map<string, TrieNode>;

    /** Parent trie node (null for root) */
    parent: TrieNode | null;

    /** Depth in trie */
    depth: number;
}
