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
