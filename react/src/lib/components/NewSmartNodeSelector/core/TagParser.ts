/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
    QueryNode,
    PathQuery,
    PathSegment,
    CharWildcardSegment,
    GlobSegment,
    SetSegment,
} from "./types/Query";

/**
 * Parses validated tag strings into Query AST
 * Handles all wildcard types, set notation, and OR operations
 */
export class TagParser {
    private _delimiter: string;

    constructor(delimiter: string = ":") {
        this._delimiter = delimiter;
    }

    /**
     * Parse a tag string into a Query AST
     */
    parse(tag: string): QueryNode {
        return this.parsePathQuery(tag);
    }

    /**
     * Parse path query (e.g., "A:B:C" or "A:*:**")
     */
    private parsePathQuery(tag: string): PathQuery {
        const segments = this.splitPath(tag);
        const pathSegments: PathSegment[] = [];

        for (const segment of segments) {
            pathSegments.push(this.parseSegment(segment));
        }

        return {
            type: "PATH",
            segments: pathSegments,
        };
    }

    /**
     * Split path by delimiter, respecting set notation braces
     */
    private splitPath(tag: string): string[] {
        const segments: string[] = [];
        let current = "";
        let inBraces = false;

        for (let i = 0; i < tag.length; i++) {
            const char = tag[i];

            if (char === "{") {
                inBraces = true;
                current += char;
            } else if (char === "}") {
                inBraces = false;
                current += char;
            } else if (char === this._delimiter && !inBraces) {
                segments.push(current);
                current = "";
            } else {
                current += char;
            }
        }

        if (current !== "") {
            segments.push(current);
        }

        return segments;
    }

    /**
     * Parse individual segment
     */
    private parseSegment(segment: string): PathSegment {
        // Deep wildcard: **
        if (segment === "**") {
            return { type: "DEEP_WILDCARD" };
        }

        // Single-level wildcard: *
        if (segment === "*") {
            return { type: "WILDCARD" };
        }

        // Set notation with braces: {A,B,C} - INTERSECTION
        if (segment.startsWith("{") && segment.endsWith("}")) {
            return this.parseSetSegment(segment, ",", "INTERSECTION");
        }

        // UNION with pipe: A|B
        if (segment.includes("|")) {
            return this.parseSetSegment(segment, "|", "UNION");
        }

        // INTERSECTION with ampersand: A&B
        if (segment.includes("&")) {
            return this.parseSetSegment(segment, "&", "INTERSECTION");
        }

        // Check for wildcards in segment
        if (segment.includes("*") || segment.includes("?")) {
            return this.parseWildcardSegment(segment);
        }

        // Literal segment
        return {
            type: "LITERAL",
            value: segment,
        };
    }

    /**
     * Parse set notation segment: {A,B,C}, A|B, or A&B
     */
    private parseSetSegment(
        segment: string,
        delimiter: string,
        operation: "UNION" | "INTERSECTION"
    ): SetSegment {
        let content: string;

        // Remove braces if present
        if (segment.startsWith("{") && segment.endsWith("}")) {
            content = segment.slice(1, -1);
        } else {
            content = segment;
        }

        // Split by delimiter and trim
        const values = content.split(delimiter).map((v) => v.trim());

        return {
            type: "SET",
            values,
            operation,
        };
    }

    /**
     * Parse segment with wildcards (? or *)
     * Determines if it's a char wildcard or glob pattern
     */
    private parseWildcardSegment(
        segment: string
    ): CharWildcardSegment | GlobSegment {
        // If contains only ? and literal chars, it's a char wildcard
        if (!segment.includes("*")) {
            return {
                type: "CHAR_WILDCARD",
                pattern: this.charWildcardToRegex(segment),
                original: segment,
            };
        }

        // Otherwise it's a glob pattern
        return {
            type: "GLOB",
            pattern: this.globToRegex(segment),
            original: segment,
        };
    }

    /**
     * Convert char wildcard pattern to regex
     * "Node-?" -> /^Node-.$/
     */
    private charWildcardToRegex(pattern: string): RegExp {
        let regex = "^";

        for (const char of pattern) {
            if (char === "?") {
                regex += ".";
            } else {
                regex += this.escapeRegex(char);
            }
        }

        regex += "$";
        return new RegExp(regex);
    }

    /**
     * Convert glob pattern to regex
     * "Sub*node" -> /^Sub.*node$/
     */
    private globToRegex(pattern: string): RegExp {
        let regex = "^";

        for (let i = 0; i < pattern.length; i++) {
            const char = pattern[i];

            if (char === "*") {
                regex += ".*";
            } else if (char === "?") {
                regex += ".";
            } else {
                regex += this.escapeRegex(char);
            }
        }

        regex += "$";
        return new RegExp(regex);
    }

    /**
     * Escape special regex characters
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
}
