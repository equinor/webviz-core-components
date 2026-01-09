import type { TreeAccessor } from "../types/tree";

export function convertToSet<Node>(iterable: Iterable<Node>): Set<Node> {
    // If it's already a Set, return as is to avoid unnecessary copying
    // Avoid O(n) if O(1) is possible
    return iterable instanceof Set ? iterable : new Set(iterable);
}

export function collectAllChildren<Node>(
    frontier: Set<Node>,
    tree: TreeAccessor<Node>
): Set<Node> {
    const result = new Set<Node>();

    for (const node of frontier) {
        for (const child of tree.getChildren(node)) {
            result.add(child);
        }
    }

    return result;
}

export function collectCommonChildren<Node>(
    frontier: Set<Node>,
    tree: TreeAccessor<Node>
): Set<Node> {
    const frontierArray = Array.from(frontier);

    // If empty frontier, return empty
    if (frontierArray.length === 0) {
        return new Set<Node>();
    }

    // If only one node, return its children
    if (frontierArray.length === 1) {
        const result = new Set<Node>();
        for (const child of tree.getChildren(frontierArray[0])) {
            result.add(child);
        }
        return result;
    }

    // Collect all children nodes, grouped by name
    const childrenByName = new Map<string, { nodes: Node[]; parentCount: number }>();

    for (const parent of frontierArray) {
        const childrenSeen = new Set<string>();

        for (const child of tree.getChildren(parent)) {
            const childName = tree.getName(child);

            // Track this child node
            const existing = childrenByName.get(childName);
            if (existing) {
                existing.nodes.push(child);
                // Only increment parent count once per parent for this name
                if (!childrenSeen.has(childName)) {
                    existing.parentCount++;
                    childrenSeen.add(childName);
                }
            } else {
                childrenByName.set(childName, { nodes: [child], parentCount: 1 });
                childrenSeen.add(childName);
            }
        }
    }

    // Return children whose names appear in ALL parents
    const result = new Set<Node>();
    const requiredCount = frontierArray.length;

    for (const [_, { nodes, parentCount }] of childrenByName) {
        if (parentCount === requiredCount) {
            // Add all node instances with this name
            for (const node of nodes) {
                result.add(node);
            }
        }
    }

    return result;
}

export function collectAllDescendants<Node>(
    frontier: Set<Node>,
    tree: TreeAccessor<Node>
): Set<Node> {
    const result = new Set<Node>();
    const queue: Node[] = [];

    for (const node of frontier) {
        for (const child of tree.getChildren(node)) {
            queue.push(child);
        }
    }

    while (queue.length > 0) {
        const next = queue.pop()!;
        if (result.has(next)) {
            continue;
        }

        result.add(next);

        for (const child of tree.getChildren(next)) {
            if (!result.has(child)) {
                queue.push(child);
            }
        }
    }

    return result;
}
