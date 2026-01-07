export interface TreeAccessor<Node> {
    getRoot(): Node;
    getName(node: Node): string;
    getChildren(node: Node): Iterable<Node>;
}
