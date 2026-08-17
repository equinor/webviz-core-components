/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IndexedNode } from "./TreeNode";

/**
 * Tag = user input string
 */
export type Tag = string;

/**
 * Selection = result of matching a tag against the tree
 */
export interface Selection {
    /** Original tag string */
    tag: Tag;

    /** Is this selection valid? */
    valid: boolean;

    /** Matched node IDs */
    matchedIds: string[];

    /** Matched node names (for display) */
    matchedNodes: string[];

    /** Matched full paths */
    matchedPaths: string[];

    /** Error if invalid */
    error?: SelectionError;
}

/**
 * Selection error types
 */
export interface SelectionError {
    type: "SYNTAX_ERROR" | "NO_MATCHES" | "DUPLICATE";
    message: string;
}

/**
 * Match result (internal)
 */
export type MatchResult =
    | { success: true; nodes: IndexedNode[] }
    | { success: false; error: string };
