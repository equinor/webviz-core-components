/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Query AST root node
 * Only path queries - OR is handled at segment level
 */
export type QueryNode = PathQuery;

/**
 * Path query: "A:B:C"
 */
export interface PathQuery {
    type: "PATH";
    segments: PathSegment[];
}

/**
 * Individual path segment types
 */
export type PathSegment =
    | LiteralSegment
    | WildcardSegment
    | DeepWildcardSegment
    | CharWildcardSegment
    | GlobSegment
    | SetSegment
    | GroupSegment;

/**
 * Exact match: "A"
 */
export interface LiteralSegment {
    type: "LITERAL";
    value: string;
}

/**
 * Single level wildcard: "*"
 */
export interface WildcardSegment {
    type: "WILDCARD";
}

/**
 * Any depth wildcard: "**"
 */
export interface DeepWildcardSegment {
    type: "DEEP_WILDCARD";
}

/**
 * Character wildcard: "Node-?"
 */
export interface CharWildcardSegment {
    type: "CHAR_WILDCARD";
    pattern: RegExp;
    original: string; // Original pattern for debugging
}

/**
 * Glob pattern: "Subnode*"
 */
export interface GlobSegment {
    type: "GLOB";
    pattern: RegExp;
    original: string;
}

/**
 * Set notation: "{A,B}", "A|B", or "A&B"
 *
 * At current level: all three match nodes whose name is A OR B
 *
 * For subsequent segments:
 * - UNION (|): subsequent segments can match children from ANY matched node (combines all possibilities)
 * - INTERSECTION (&, {,}): subsequent segments must match children that exist in ALL matched nodes (only common children)
 *
 * Example: "Node-1|Node 2:*" matches any child of Node-1 or Node 2 (union of all children)
 * Example: "Node-1&Node 2:Subnode 1" matches only if Subnode 1 exists under BOTH Node-1 AND Node 2
 */
export interface SetSegment {
    type: "SET";
    values: string[];
    operation: "UNION" | "INTERSECTION";
}

export interface GroupSegment {
    type: "GROUP";
    segments: PathSegment[];
}