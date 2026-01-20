/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TreeAccessor } from "./query-language/types/tree";
import type { IndexedNode, TreeDataNode, TrieNode } from "./types/TreeNode";

/**
 * Builds indexed tree structures from user-provided data
 * Creates:
 * - Flat array of IndexedNodes with parent/child pointers
 * - Trie structure for efficient pattern matching
 * - Hash maps for O(1) lookups
 */
export class TreeIndexBuilder {
    private _nodeIdCounter: number;
    private _delimiter: string;

    constructor(delimiter: string = ":") {
        this._nodeIdCounter = 0;
        this._delimiter = delimiter;
    }

    /**
     * Build complete indexed structure from tree data
     */
    build(data: TreeDataNode[]): BuildResult {
        this._nodeIdCounter = 0;

        const byId = new Map<string, IndexedNode>();
        const byPath = new Map<string, IndexedNode>();
        const roots: IndexedNode[] = [];
        const rootTrie = this.createTrieNode("", null, 0);

        // Recursively process tree
        this.processNodes(data, null, [], rootTrie, byId, byPath, roots);

        return {
            nodes: Array.from(byId.values()),
            byId,
            byPath,
            trie: rootTrie,
            roots,
        };
    }

    /**
     * Recursively process tree nodes
     */
    private processNodes(
        nodes: TreeDataNode[],
        parent: IndexedNode | null,
        parentPath: string[],
        parentTrieNode: TrieNode,
        byId: Map<string, IndexedNode>,
        byPath: Map<string, IndexedNode>,
        roots: IndexedNode[]
    ): void {
        for (const node of nodes) {
            // 1. Build path
            const path = [...parentPath, node.name];
            const pathString = path.join(this._delimiter);
            const id = node.id || this.generateId();
            const depth = path.length - 1; // 0-indexed depth

            // 2. Get or create trie node
            const trieNode = this.getOrCreateTrieNode(
                parentTrieNode,
                node.name,
                parentTrieNode.depth + 1
            );

            // 3. Create indexed node (without children array yet)
            const indexed: IndexedNode = {
                id,
                name: node.name,
                description: node.description,
                path,
                pathString,
                depth,
                parent,
                children: [], // Will be filled by recursion
                isLeaf: !node.children || node.children.length === 0,
                filterableMetadata: node.filterableMetadata || {},
                displayMetadata: node.displayMetadata || {},
            };

            // 4. Add to indices
            byId.set(id, indexed);
            byPath.set(pathString, indexed);
            trieNode.nodes.push(indexed);

            // 5. Link to parent
            if (parent) {
                parent.children.push(indexed);
            } else {
                roots.push(indexed);
            }

            // 6. Recurse for children
            if (node.children && node.children.length > 0) {
                this.processNodes(
                    node.children,
                    indexed,
                    path,
                    trieNode,
                    byId,
                    byPath,
                    roots
                );
            }
        }
    }

    /**
     * Get existing or create new trie node
     */
    private getOrCreateTrieNode(
        parent: TrieNode,
        segment: string,
        depth: number
    ): TrieNode {
        let node = parent.children.get(segment);
        if (!node) {
            node = this.createTrieNode(segment, parent, depth);
            parent.children.set(segment, node);
        }
        return node;
    }

    /**
     * Create a new trie node
     */
    private createTrieNode(
        segment: string,
        parent: TrieNode | null,
        depth: number
    ): TrieNode {
        return {
            segment,
            nodes: [],
            children: new Map(),
            parent,
            depth,
        };
    }

    /**
     * Generate unique ID for node
     */
    private generateId(): string {
        return `node-${this._nodeIdCounter++}`;
    }
}

/**
 * Result of building tree index
 */
export interface BuildResult {
    /** All nodes in flat array */
    nodes: IndexedNode[];

    /** Map: node ID */
    byId: Map<string, IndexedNode>;

    /** Map: path string */
    byPath: Map<string, IndexedNode>;

    /** Root trie node */
    trie: TrieNode;

    /** Root indexed nodes */
    roots: IndexedNode[];
}

export function makeIndexedNodeAccessor(
    index: BuildResult
): TreeAccessor<IndexedNode> {
    const rootNode: IndexedNode = {
        id: "VIRTUAL_ROOT",
        name: "",
        children: index.roots,
        depth: -1,
        parent: null,
        description: "",
        path: [],
        pathString: "",
        isLeaf: false,
        filterableMetadata: {},
        displayMetadata: {},
    };

    return {
        getRoot: () => rootNode,
        getName: (node: IndexedNode) => {
            return node.name;
        },
        getChildren: (node: IndexedNode) => {
            return node.children;
        },
        isLeaf: (node: IndexedNode) => {
            return node.isLeaf;
        },
        getFilterableMetadata: (node: IndexedNode) => {
            return node.filterableMetadata;
        },
    };
}
