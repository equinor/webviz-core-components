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
export class SuggestionEngine {
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
     * Returns only leaf nodes (complete paths) - empty array if tag is invalid or no leaf matches found
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
        const allMatches = this._matcher.match(query);

        // Filter to only return leaf nodes (complete paths)
        return allMatches.filter((node) => node.isLeaf);
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
                    completedQuery: node.name,
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
            const afterPath =
                this._delimiter + afterSegments.join(this._delimiter);
            suggestionResults = suggestionResults.map((suggestion) => ({
                ...suggestion,
                completedTag: suggestion.completedQuery + afterPath,
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
                    completedQuery: node.name,
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
            // Path is invalid, return empty suggestions
            return [];
        }

        const query = this._parser.parse(completedPath);
        const matchedNodes = this._matcher.match(query);

        if (matchedNodes.length === 0) {
            return [];
        }

        // Determine the operation type from the last segment
        const lastSegment = query.segments[query.segments.length - 1];
        const isIntersection =
            lastSegment.type === "SET" &&
            lastSegment.operation === "INTERSECTION";

        // Collect children based on operation type
        let children: IndexedNode[];

        if (isIntersection) {
            // INTERSECTION: only include children that exist in ALL matched nodes
            const childrenByName = new Map<string, number>();
            const childrenMap = new Map<string, IndexedNode>();

            for (const node of matchedNodes) {
                for (const child of node.children) {
                    const count = childrenByName.get(child.name) || 0;
                    childrenByName.set(child.name, count + 1);
                    if (!childrenMap.has(child.name)) {
                        childrenMap.set(child.name, child);
                    }
                }
            }

            // Only include children that appear under ALL matched nodes
            children = Array.from(childrenMap.values()).filter(
                (child) =>
                    childrenByName.get(child.name) === matchedNodes.length
            );
        } else {
            // UNION: collect all unique children from matched nodes
            const childrenMap = new Map<string, IndexedNode>();

            for (const node of matchedNodes) {
                for (const child of node.children) {
                    if (!childrenMap.has(child.name)) {
                        childrenMap.set(child.name, child);
                    }
                }
            }

            children = Array.from(childrenMap.values());
        }

        const prefix = completedPath + this._delimiter;

        return children.slice(0, maxSuggestions).map((child) => ({
            name: child.name,
            completedQuery: prefix + child.name,
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

        // Parse the partial segment to extract the actual search term
        // Handle cases like "{A", "A|B", "A&", etc.
        const searchTerm = this.extractSearchTerm(partialSegment);

        // Extract base path before operators (e.g., "Data Source " from "Data Source (")
        const basePath = this.extractBasePath(partialSegment);

        // Determine which nodes to search for matches at the current level
        let candidateNodes: IndexedNode[];

        // Get the nodes at the current level
        if (completedSegments.length === 0) {
            // We're at the root level
            candidateNodes = this._buildResult.roots;
        } else {
            // Get parent nodes from completed segments
            const completedPath = completedSegments.join(this._delimiter);
            const validationResult = this._validator.validate(completedPath);

            if (!validationResult.valid) {
                return [];
            }

            const query = this._parser.parse(completedPath);
            const parentNodes = this._matcher.match(query);

            if (parentNodes.length === 0) {
                return [];
            }

            // Determine the operation type from the last segment
            const lastSegment = query.segments[query.segments.length - 1];
            const isIntersection =
                lastSegment.type === "SET" &&
                lastSegment.operation === "INTERSECTION";

            // Collect children based on operation type
            if (isIntersection) {
                // INTERSECTION: only include children that exist in ALL matched nodes
                const childrenByName = new Map<string, number>();
                const childrenMap = new Map<string, IndexedNode>();

                for (const node of parentNodes) {
                    for (const child of node.children) {
                        const count = childrenByName.get(child.name) || 0;
                        childrenByName.set(child.name, count + 1);
                        if (!childrenMap.has(child.name)) {
                            childrenMap.set(child.name, child);
                        }
                    }
                }

                // Only include children that appear under ALL matched nodes
                candidateNodes = Array.from(childrenMap.values()).filter(
                    (child) =>
                        childrenByName.get(child.name) === parentNodes.length
                );
            } else {
                // UNION: collect all unique children from matched parent nodes
                const childrenMap = new Map<string, IndexedNode>();
                for (const node of parentNodes) {
                    for (const child of node.children) {
                        if (!childrenMap.has(child.name)) {
                            childrenMap.set(child.name, child);
                        }
                    }
                }

                candidateNodes = Array.from(childrenMap.values());
            }
        }

        // Build the full search prefix: basePath + searchTerm
        const fullSearchTerm = basePath + searchTerm;

        // Check if we should suppress suggestions in certain contexts
        const lastChar = partialSegment[partialSegment.length - 1] || "";

        // After closing bracket with complete query, don't suggest anything
        const openParens = (partialSegment.match(/\(/g) || []).length;
        const closeParens = (partialSegment.match(/\)/g) || []).length;
        const openBraces = (partialSegment.match(/\{/g) || []).length;
        const closeBraces = (partialSegment.match(/\}/g) || []).length;
        const isInsideBracket =
            openParens > closeParens || openBraces > closeBraces;

        if ((lastChar === ")" || lastChar === "}") && !isInsideBracket) {
            return [];
        }

        // When inside a group/set with a base path like "Data Source (" or "Data Source (A|"
        // we want to suggest children of nodes matching the base path
        const endsWithOperator = /[|&,]$/.test(partialSegment);
        if (isInsideBracket && basePath && (searchTerm === "" || endsWithOperator)) {
            // Get nodes matching the base path
            const basePathMatches = candidateNodes.filter((node) =>
                node.name.toLowerCase() === basePath.trim().toLowerCase()
            );

            if (basePathMatches.length > 0) {
                // Collect all unique children from base path matches
                const childrenMap = new Map<string, IndexedNode>();
                for (const node of basePathMatches) {
                    for (const child of node.children) {
                        if (!childrenMap.has(child.name)) {
                            childrenMap.set(child.name, child);
                        }
                    }
                }

                const prefix =
                    completedSegments.length > 0
                        ? completedSegments.join(this._delimiter) + this._delimiter
                        : "";

                const operatorContext = basePath
                    ? partialSegment.substring(basePath.length)
                    : partialSegment;

                const children = Array.from(childrenMap.values());
                return children.slice(0, maxSuggestions).map((child) => ({
                    name: child.name,
                    completedQuery: prefix + basePath + operatorContext + child.name,
                    type: "partial" as const,
                    description: child.description ?? "",
                    node: child,
                    contextPrefix: basePath + operatorContext,
                    insertText: child.name,
                }));
            }
        }

        // After just opening brackets with no text, don't show all nodes (prevent memory issue)
        if (fullSearchTerm === "" && partialSegment.match(/^[{(]+$/)) {
            return [];
        }

        // Otherwise, show node suggestions
        // Filter candidates by full search term (case-insensitive prefix match)
        // Exclude exact matches (if user typed "Data Source A", don't suggest "Data Source A")
        const lowerFullSearchTerm = fullSearchTerm.toLowerCase();
        const matches = candidateNodes.filter((node) => {
            const lowerNodeName = node.name.toLowerCase();
            return (
                lowerNodeName.startsWith(lowerFullSearchTerm) &&
                lowerNodeName !== lowerFullSearchTerm
            );
        });

        // Build suggestions
        const prefix =
            completedSegments.length > 0
                ? completedSegments.join(this._delimiter) + this._delimiter
                : "";

        // Calculate the operator context (everything in partial segment before search term, minus base path)
        const segmentPrefix = partialSegment.substring(
            0,
            partialSegment.length - searchTerm.length
        );
        const operatorContext = basePath
            ? segmentPrefix.substring(basePath.length)
            : segmentPrefix;

        const suggestions: Suggestion[] = matches
            .slice(0, maxSuggestions)
            .map((node) => {
                // The suggestion name is the part AFTER the base path
                const suggestionName = node.name.substring(basePath.length);

                // Calculate highlights for matched prefix within the suggestion
                const highlights =
                    searchTerm.length > 0
                        ? [{ start: 0, end: searchTerm.length }]
                        : undefined;

                // Determine suggestion type:
                // - "partial" if there's an operator context (e.g., "(A|") - inline completion
                // - "node" otherwise - complete node suggestion
                const suggestionType = operatorContext
                    ? ("partial" as const)
                    : ("node" as const);

                return {
                    name: suggestionName,
                    completedQuery:
                        prefix + basePath + operatorContext + suggestionName,
                    type: suggestionType,
                    description: node.description ?? "",
                    node: node,
                    highlights,
                    // Context prefix shows the base path + operator context
                    contextPrefix: basePath + operatorContext || undefined,
                    // Insert text is just the suggestion name (the part after base path)
                    insertText: suggestionName,
                };
            });

        return suggestions;
    }

    /**
     * Extract the base path from a partial segment (the node name before operators)
     *
     * Examples:
     * - "Data Source (" -> "Data Source "
     * - "Data Source {" -> "Data Source "
     * - "(A|" -> ""
     * - "Node-1 (A&" -> "Node-1 "
     */
    private extractBasePath(partialSegment: string): string {
        // Find the first occurrence of an operator character
        const operatorMatch = partialSegment.match(/[{(]/);

        if (!operatorMatch || operatorMatch.index === undefined) {
            // No operators found, return empty string
            return "";
        }

        // Return everything before the first operator (including trailing space)
        return partialSegment.substring(0, operatorMatch.index);
    }

    /**
     * Extract the actual search term from a partial segment that may contain
     * union/intersection operators
     *
     * Examples:
     * - "{A" -> "A"
     * - "A|B" -> "B"
     * - "{A,B,C" -> "C"
     * - "(A&B&C" -> "C"
     * - "(A|B)" -> "" (empty after closing paren)
     */
    private extractSearchTerm(partialSegment: string): string {
        // Find the last occurrence of special characters that mark the start of a new term
        // Include closing parens/braces as they end a term
        const separatorPattern = /[{(,|&)}]/;
        const parts = partialSegment.split(separatorPattern);

        // Return the last part (the current search term)
        return parts[parts.length - 1];
    }

    /**
     * Get wildcard pattern suggestions
     * Can be called by UI components to show wildcard syntax help separately from node suggestions
     */
    getWildcardSuggestions(prefix: string = ""): Suggestion[] {
        return [
            {
                name: "* (any single level)",
                completedQuery: prefix + "*",
                type: "wildcard" as const,
                description: "Matches any node at this level",
            },
            {
                name: "** (any depth)",
                completedQuery: prefix + "**",
                type: "wildcard" as const,
                description: "Matches nodes at any depth below",
            },
            {
                name: "? (single character)",
                completedQuery: prefix + "?",
                type: "wildcard" as const,
                description: "Matches any single character (e.g., Node-?)",
            },
            {
                name: "{A,B} (set notation)",
                completedQuery: prefix + "{",
                type: "wildcard" as const,
                description: "Match multiple specific values (intersection)",
            },
            {
                name: "A|B (union)",
                completedQuery: prefix + "|",
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
