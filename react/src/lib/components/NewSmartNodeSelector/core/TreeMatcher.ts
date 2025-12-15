/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { BuildResult } from "./TreeIndexBuilder";
import type { IndexedNode } from "./types/TreeNode";
import type { QueryNode, PathSegment } from "./types/Query";

/**
 * Matches Query AST against indexed tree structure
 * Produces lists of matched nodes
 */
export class TreeMatcher {
    private _buildResult: BuildResult;

    constructor(buildResult: BuildResult) {
        this._buildResult = buildResult;
    }

    /**
     * Match a query against the tree
     * Returns array of matched nodes
     */
    match(query: QueryNode): IndexedNode[] {
        return this.matchPathQuery(query);
    }

    /**
     * Match path query against tree
     */
    private matchPathQuery(query: QueryNode): IndexedNode[] {
        // Start from root nodes
        let currentNodes: IndexedNode[] = [...this._buildResult.roots];
        let segmentIndex = 0;

        // For first segment, match against roots directly
        if (query.segments.length > 0) {
            const firstSegment = query.segments[0];

            if (firstSegment.type === "DEEP_WILDCARD") {
                currentNodes = this.matchDeepWildcard(
                    currentNodes,
                    query.segments,
                    0
                );
                // Deep wildcard consumes the rest of the pattern
                return currentNodes;
            }

            // Match first segment against roots
            currentNodes = currentNodes.filter((node) =>
                this.matchesSegment(node, firstSegment)
            );

            if (currentNodes.length === 0) {
                return [];
            }

            segmentIndex = 1; // Move to next segment
        }

        // Match remaining segments
        while (segmentIndex < query.segments.length) {
            const segment = query.segments[segmentIndex];

            // Handle deep wildcard specially
            if (segment.type === "DEEP_WILDCARD") {
                currentNodes = this.matchDeepWildcard(
                    currentNodes,
                    query.segments,
                    segmentIndex
                );
                // Deep wildcard consumes the rest of the pattern
                break;
            }

            // Handle SET segments with special constraint propagation
            if (segment.type === "SET") {
                // Match the SET segment to get parent nodes
                currentNodes = this.matchSetSegmentAtDepth(currentNodes, segment);

                if (currentNodes.length === 0) {
                    return [];
                }

                // If there's a next segment, apply UNION/INTERSECTION logic
                if (segmentIndex + 1 < query.segments.length) {
                    const nextSegment = query.segments[segmentIndex + 1];

                    // Skip deep wildcard handling here - it's handled above
                    if (nextSegment.type !== "DEEP_WILDCARD") {
                        currentNodes = this.matchAfterSet(
                            currentNodes,
                            nextSegment,
                            segment.operation
                        );

                        // Skip the next segment since we just processed it
                        segmentIndex++;
                    }
                }
            } else {
                // Match current segment normally
                currentNodes = this.matchSegmentAtDepth(currentNodes, segment);
            }

            if (currentNodes.length === 0) {
                return [];
            }

            segmentIndex++;
        }

        return currentNodes;
    }

    /**
     * Match a segment at current depth
     * Returns children that match the segment
     *
     * For SET segments with INTERSECTION: only returns children that exist across ALL parent nodes
     * For SET segments with UNION: returns children from ANY parent node
     */
    private matchSegmentAtDepth(
        nodes: IndexedNode[],
        segment: PathSegment
    ): IndexedNode[] {
        // Special handling for SET segments with operation type
        if (segment.type === "SET") {
            return this.matchSetSegmentAtDepth(nodes, segment);
        }

        // For non-SET segments, standard matching
        const results: IndexedNode[] = [];
        const seenIds = new Set<string>();

        for (const node of nodes) {
            // Get all children of this node
            const children = node.children;

            for (const child of children) {
                if (this.matchesSegment(child, segment) && !seenIds.has(child.id)) {
                    seenIds.add(child.id);
                    results.push(child);
                }
            }
        }

        return results;
    }

    /**
     * Match SET segment with proper UNION/INTERSECTION semantics
     *
     * UNION (|): Match children from ANY parent that matches the set values
     * INTERSECTION (&, {,}): Match only children that exist in ALL parents that match the set values
     */
    private matchSetSegmentAtDepth(
        nodes: IndexedNode[],
        segment: PathSegment & { type: "SET" }
    ): IndexedNode[] {
        // First, find all nodes that match the set values
        const matchedParents: IndexedNode[] = [];

        for (const node of nodes) {
            for (const child of node.children) {
                if (segment.values.includes(child.name)) {
                    matchedParents.push(child);
                }
            }
        }

        if (matchedParents.length === 0) {
            return [];
        }

        // If no further segments will be processed, return the matched nodes
        // (This handles the case where SET is the last segment)
        return matchedParents;
    }

    /**
     * Match next segment after a SET segment with proper constraint propagation
     *
     * UNION: Collect children from ANY matched parent
     * INTERSECTION: Collect only children that exist in ALL matched parents
     */
    private matchAfterSet(
        matchedParents: IndexedNode[],
        nextSegment: PathSegment,
        operation: "UNION" | "INTERSECTION"
    ): IndexedNode[] {
        if (operation === "UNION") {
            // UNION: collect children from any parent
            const results: IndexedNode[] = [];
            const seenIds = new Set<string>();

            for (const parent of matchedParents) {
                for (const child of parent.children) {
                    if (this.matchesSegment(child, nextSegment) && !seenIds.has(child.id)) {
                        seenIds.add(child.id);
                        results.push(child);
                    }
                }
            }

            return results;
        } else {
            // INTERSECTION: collect only children that exist in ALL parents
            if (matchedParents.length === 0) {
                return [];
            }

            // Build a map of child name -> list of matching children
            const childrenByName = new Map<string, IndexedNode[]>();

            for (const parent of matchedParents) {
                for (const child of parent.children) {
                    if (this.matchesSegment(child, nextSegment)) {
                        const existing = childrenByName.get(child.name) || [];
                        existing.push(child);
                        childrenByName.set(child.name, existing);
                    }
                }
            }

            // Only include children that appear under ALL matched parents
            const results: IndexedNode[] = [];
            for (const children of childrenByName.values()) {
                if (children.length === matchedParents.length) {
                    // This child exists under all parents - include all instances
                    results.push(...children);
                }
            }

            return results;
        }
    }

    /**
     * Check if a node matches a segment
     */
    private matchesSegment(node: IndexedNode, segment: PathSegment): boolean {
        switch (segment.type) {
            case "LITERAL":
                return node.name === segment.value;

            case "WILDCARD":
                return true; // Matches any single node

            case "CHAR_WILDCARD":
                return segment.pattern.test(node.name);

            case "GLOB":
                return segment.pattern.test(node.name);

            case "SET":
                // Check if node name is in the set values
                return segment.values.includes(node.name);

            case "DEEP_WILDCARD":
                // Should not reach here - handled separately
                return false;
        }
    }

    /**
     * Match deep wildcard pattern
     * Handles "**" which matches any number of levels
     */
    private matchDeepWildcard(
        startNodes: IndexedNode[],
        segments: PathSegment[],
        deepWildcardIndex: number
    ): IndexedNode[] {
        // Get remaining segments after **
        const remainingSegments = segments.slice(deepWildcardIndex + 1);

        // If no segments after **, return all descendants
        if (remainingSegments.length === 0) {
            return this.getAllDescendants(startNodes);
        }

        // Otherwise, find all nodes that match the remaining pattern
        // at any depth below the current nodes
        const results: IndexedNode[] = [];
        const seenIds = new Set<string>();

        for (const startNode of startNodes) {
            // Try matching remaining pattern at every possible depth
            const descendants = this.getAllDescendants([startNode]);

            for (const descendant of descendants) {
                if (seenIds.has(descendant.id)) {
                    continue;
                }

                // Try to match remaining pattern starting from this descendant's parent
                // We need to check if there's a path from descendant going down that matches
                if (this.matchesRemainingPattern(descendant, remainingSegments)) {
                    seenIds.add(descendant.id);
                    results.push(descendant);
                }
            }
        }

        return results;
    }

    /**
     * Check if remaining pattern matches starting from a node
     */
    private matchesRemainingPattern(
        startNode: IndexedNode,
        segments: PathSegment[]
    ): boolean {
        let currentNodes = [startNode];
        let segmentIndex = 0;

        while (segmentIndex < segments.length) {
            const segment = segments[segmentIndex];

            if (segment.type === "DEEP_WILDCARD") {
                // Nested deep wildcard - use recursive matching
                const matched = this.matchDeepWildcard(
                    currentNodes,
                    segments,
                    segmentIndex
                );
                return matched.length > 0;
            }

            // For first segment, check if current node matches
            if (segmentIndex === 0) {
                currentNodes = currentNodes.filter((node) =>
                    this.matchesSegment(node, segment)
                );
            } else {
                currentNodes = this.matchSegmentAtDepth(currentNodes, segment);
            }

            if (currentNodes.length === 0) {
                return false;
            }

            segmentIndex++;
        }

        return currentNodes.length > 0;
    }

    /**
     * Get all descendants of given nodes
     */
    private getAllDescendants(nodes: IndexedNode[]): IndexedNode[] {
        const results: IndexedNode[] = [];
        const seenIds = new Set<string>();

        const collectDescendants = (node: IndexedNode) => {
            for (const child of node.children) {
                if (!seenIds.has(child.id)) {
                    seenIds.add(child.id);
                    results.push(child);
                    collectDescendants(child);
                }
            }
        };

        for (const node of nodes) {
            collectDescendants(node);
        }

        return results;
    }
}
