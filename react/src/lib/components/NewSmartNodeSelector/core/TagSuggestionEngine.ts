/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TreeIndexBuilder, type BuildResult } from "./TreeIndexBuilder";
import { TagValidator } from "./TagValidator";
import { TagParser } from "./TagParser";
import { TreeMatcher } from "./TreeMatcher";
import type { TreeDataNode, IndexedNode } from "./types/TreeNode";
import type { Suggestion } from "./types/Suggestion";

/**
 * Main engine for smart node selection
 * Integrates validation, parsing, indexing, and matching
 */
export class TagSuggestionEngine {
    private _delimiter: string;
    private _buildResult: BuildResult | null;
    private _validator: TagValidator;
    private _parser: TagParser;
    private _matcher: TreeMatcher | null;

    constructor(delimiter: string = ":") {
        this._delimiter = delimiter;
        this._buildResult = null;
        this._validator = new TagValidator(delimiter);
        this._parser = new TagParser(delimiter);
        this._matcher = null;
    }

    /**
     * Initialize with tree data
     * Call this whenever the tree data changes
     */
    setData(data: TreeDataNode[]): void {
        const builder = new TreeIndexBuilder(this._delimiter);
        this._buildResult = builder.build(data);
        this._matcher = new TreeMatcher(this._buildResult);
    }

    /**
     * Get matching nodes for a completed tag
     * Returns empty array if tag is invalid or no matches found
     */
    getMatches(tag: string): IndexedNode[] {
        if (!this._matcher || !this._buildResult) {
            return [];
        }

        // Validate tag
        const validationResult = this._validator.validate(tag);
        if (!validationResult.valid) {
            return [];
        }

        // Parse and match
        const query = this._parser.parse(tag);
        return this._matcher.match(query);
    }

    /**
     * Get suggestions for partial input as user types
     *
     * @param partialTag - The current tag value with all segments
     * @param segmentIndex - The index of the segment being edited (0-based)
     * @param maxSuggestions - Maximum number of suggestions to return
     *
     * Examples:
     * - Input: "Meta", segmentIndex: 0 -> suggests "Metadata 1", "Metadata 2"
     * - Input: "Metadata 1:Sub:Child", segmentIndex: 1 -> suggests completions for segment 1
     */
    getSuggestions(
        partialTag: string,
        segmentIndex: number = 0,
        maxSuggestions: number = 10
    ): Suggestion[] {
        if (!this._buildResult) {
            return [];
        }

        // Split the tag into segments
        const segments = partialTag.split(this._delimiter);

        // Get segments before the one being edited
        const beforeSegments = segments.slice(0, segmentIndex);
        // Get the segment being edited
        const currentSegment = segments[segmentIndex] || "";
        // Get segments after the one being edited
        const afterSegments = segments.slice(segmentIndex + 1);

        // Handle empty input at first segment - suggest root nodes
        if (segmentIndex === 0 && (!partialTag || partialTag.trim() === "")) {
            return this._buildResult.roots
                .slice(0, maxSuggestions)
                .map((node) => ({
                    name: node.name,
                    completedTag: node.name,
                    type: "node" as const,
                    description: node.description ?? "",
                    node: node,
                }));
        }

        // Build suggestions based on which segment is being edited
        let suggestionResults: Suggestion[];

        if (currentSegment === "" && segmentIndex > 0) {
            // Empty segment (not first) - suggest children of previous segment
            suggestionResults = this.getSuggestionsForNewSegment(
                beforeSegments,
                maxSuggestions
            );
        } else if (segmentIndex === 0) {
            // Editing first segment
            suggestionResults = this.getSuggestionsForPartialSegment(
                [],
                currentSegment,
                maxSuggestions
            );
        } else {
            // Editing a middle or last segment
            suggestionResults = this.getSuggestionsForPartialSegment(
                beforeSegments,
                currentSegment,
                maxSuggestions
            );
        }

        // Rebuild the full tag path with the suggestion
        // Format: beforeSegments + suggestion + afterSegments
        if (afterSegments.length > 0) {
            const afterPath = this._delimiter + afterSegments.join(this._delimiter);
            suggestionResults = suggestionResults.map((suggestion) => ({
                ...suggestion,
                completedTag: suggestion.completedTag + afterPath,
            }));
        }

        return suggestionResults;
    }

    /**
     * Get suggestions when starting a new segment (tag ends with delimiter)
     */
    private getSuggestionsForNewSegment(
        completedSegments: string[],
        maxSuggestions: number
    ): Suggestion[] {
        if (!this._buildResult || !this._matcher) {
            return [];
        }

        // If no completed segments, suggest roots (shouldn't happen but handle it)
        if (completedSegments.length === 0) {
            return this._buildResult.roots
                .slice(0, maxSuggestions)
                .map((node) => ({
                    name: node.name,
                    completedTag: node.name,
                    type: "node" as const,
                    description: node.description ?? "",
                    node: node,
                }));
        }

        // Build the completed path and try to match it
        const completedPath = completedSegments.join(this._delimiter);

        // Validate and parse the completed path
        const validationResult = this._validator.validate(completedPath);
        if (!validationResult.valid) {
            // Path is invalid, return wildcard suggestions
            return this.getWildcardSuggestions();
        }

        const query = this._parser.parse(completedPath);
        const matchedNodes = this._matcher.match(query);

        if (matchedNodes.length === 0) {
            return [];
        }

        // Collect all unique children from matched nodes
        const childrenMap = new Map<string, IndexedNode>();

        for (const node of matchedNodes) {
            for (const child of node.children) {
                if (!childrenMap.has(child.name)) {
                    childrenMap.set(child.name, child);
                }
            }
        }

        const prefix = completedPath + this._delimiter;
        const children = Array.from(childrenMap.values());

        return children.slice(0, maxSuggestions).map((child) => ({
            name: child.name,
            completedTag: prefix + child.name,
            type: "node" as const,
            description: child.description ?? "",
            nodeCount: matchedNodes.length,
            node: child,
        }));
    }

    /**
     * Get suggestions for completing a partial segment
     */
    private getSuggestionsForPartialSegment(
        completedSegments: string[],
        partialSegment: string,
        maxSuggestions: number
    ): Suggestion[] {
        if (!this._buildResult || !this._matcher) {
            return [];
        }

        // Determine which nodes to search for matches
        let candidateNodes: IndexedNode[];

        if (completedSegments.length === 0) {
            // Searching at root level
            candidateNodes = this._buildResult.roots;
        } else {
            // Get parent nodes from completed path
            const completedPath = completedSegments.join(this._delimiter);
            const validationResult = this._validator.validate(completedPath);

            if (!validationResult.valid) {
                return this.getWildcardSuggestions();
            }

            const query = this._parser.parse(completedPath);
            const matchedNodes = this._matcher.match(query);

            if (matchedNodes.length === 0) {
                return [];
            }

            // Collect all children
            const childrenMap = new Map<string, IndexedNode>();
            for (const node of matchedNodes) {
                for (const child of node.children) {
                    if (!childrenMap.has(child.name)) {
                        childrenMap.set(child.name, child);
                    }
                }
            }

            candidateNodes = Array.from(childrenMap.values());
        }

        // Filter candidates by partial segment (case-insensitive prefix match)
        const lowerPartial = partialSegment.toLowerCase();
        const matches = candidateNodes.filter((node) =>
            node.name.toLowerCase().startsWith(lowerPartial)
        );

        // Build suggestions
        const prefix =
            completedSegments.length > 0
                ? completedSegments.join(this._delimiter) + this._delimiter
                : "";

        const suggestions: Suggestion[] = matches
            .slice(0, maxSuggestions)
            .map((node) => {
                // Calculate highlights for matched prefix
                const highlights =
                    partialSegment.length > 0
                        ? [{ start: 0, end: partialSegment.length }]
                        : undefined;

                return {
                    name: node.name,
                    completedTag: prefix + node.name,
                    type: "node" as const,
                    description: node.description ?? "",
                    node: node,
                    highlights,
                };
            });

        // Add wildcard suggestions if we have room and partial contains special chars
        if (
            suggestions.length < maxSuggestions &&
            (partialSegment.includes("*") || partialSegment.includes("?"))
        ) {
            suggestions.push(...this.getWildcardSuggestions());
        }

        return suggestions;
    }

    /**
     * Get wildcard pattern suggestions
     */
    private getWildcardSuggestions(): Suggestion[] {
        return [
            {
                name: "* (any single level)",
                completedTag: "*",
                type: "wildcard" as const,
                description: "Matches any node at this level",
            },
            {
                name: "** (any depth)",
                completedTag: "**",
                type: "wildcard" as const,
                description: "Matches nodes at any depth below",
            },
            {
                name: "? (single character)",
                completedTag: "?",
                type: "wildcard" as const,
                description: "Matches any single character (e.g., Node-?)",
            },
            {
                name: "{A,B} (set notation)",
                completedTag: "{",
                type: "wildcard" as const,
                description: "Match multiple specific values (intersection)",
            },
            {
                name: "A|B (union)",
                completedTag: "|",
                type: "wildcard" as const,
                description: "Match either value (union of children)",
            },
        ];
    }

    /**
     * Validate a tag and return validation result
     */
    validate(tag: string) {
        return this._validator.validate(tag);
    }

    /**
     * Get all nodes in the tree
     */
    getAllNodes(): IndexedNode[] {
        return this._buildResult?.nodes ?? [];
    }

    /**
     * Get node by ID
     */
    getNodeById(id: string): IndexedNode | undefined {
        return this._buildResult?.byId.get(id);
    }

    /**
     * Get node by path
     */
    getNodeByPath(path: string): IndexedNode | undefined {
        return this._buildResult?.byPath.get(path);
    }
}
