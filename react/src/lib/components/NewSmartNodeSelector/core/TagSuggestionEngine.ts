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

/**
 * Suggestion result for autocomplete
 */
export interface Suggestion {
    /** Display text for the suggestion */
    displayText: string;

    /** Full completed tag if user accepts this suggestion */
    completedTag: string;

    /** Type of suggestion */
    type: "node" | "partial" | "wildcard";

    /** Optional metadata for rendering */
    metadata?: {
        description?: string;
        nodeCount?: number;
        path?: string;
    };
}

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
     * Examples:
     * - Input: "Meta" -> suggests "Metadata 1", "Metadata 2"
     * - Input: "Metadata 1:Sub" -> suggests "Metadata 1:Submetadata 1"
     * - Input: "Metadata 1:Submetadata 1:" -> suggests all children
     */
    getSuggestions(
        partialTag: string,
        maxSuggestions: number = 10
    ): Suggestion[] {
        if (!this._buildResult) {
            return [];
        }

        // Handle empty input - suggest root nodes
        if (!partialTag || partialTag.trim() === "") {
            return this._buildResult.roots
                .slice(0, maxSuggestions)
                .map((node) => ({
                    displayText: node.name,
                    completedTag: node.name,
                    type: "node" as const,
                    metadata: {
                        description: node.description,
                        path: node.pathString,
                    },
                }));
        }

        // Split by delimiter to find completed segments and partial last segment
        const segments = partialTag.split(this._delimiter);
        const completedSegments = segments.slice(0, -1);
        const partialSegment = segments[segments.length - 1];

        // If tag ends with delimiter, we're starting a new segment
        const isNewSegment = partialTag.endsWith(this._delimiter);

        if (isNewSegment) {
            // Get children of the completed path
            return this.getSuggestionsForNewSegment(
                completedSegments,
                maxSuggestions
            );
        } else {
            // Get suggestions for completing current partial segment
            return this.getSuggestionsForPartialSegment(
                completedSegments,
                partialSegment,
                maxSuggestions
            );
        }
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
                    displayText: node.name,
                    completedTag: node.name,
                    type: "node" as const,
                    metadata: {
                        description: node.description,
                        path: node.pathString,
                    },
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
            displayText: child.name,
            completedTag: prefix + child.name,
            type: "node" as const,
            metadata: {
                description: child.description,
                nodeCount: matchedNodes.length,
            },
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
            .map((node) => ({
                displayText: node.name,
                completedTag: prefix + node.name,
                type: "node" as const,
                metadata: {
                    description: node.description,
                    path: node.pathString,
                },
            }));

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
                displayText: "* (any single level)",
                completedTag: "*",
                type: "wildcard" as const,
                metadata: {
                    description: "Matches any node at this level",
                },
            },
            {
                displayText: "** (any depth)",
                completedTag: "**",
                type: "wildcard" as const,
                metadata: {
                    description: "Matches nodes at any depth below",
                },
            },
            {
                displayText: "? (single character)",
                completedTag: "?",
                type: "wildcard" as const,
                metadata: {
                    description: "Matches any single character (e.g., Node-?)",
                },
            },
            {
                displayText: "{A,B} (set notation)",
                completedTag: "{",
                type: "wildcard" as const,
                metadata: {
                    description:
                        "Match multiple specific values (intersection)",
                },
            },
            {
                displayText: "A|B (union)",
                completedTag: "|",
                type: "wildcard" as const,
                metadata: {
                    description: "Match either value (union of children)",
                },
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
