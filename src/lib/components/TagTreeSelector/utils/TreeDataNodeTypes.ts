export interface TreeDataNode {
    id?: string,
    name: string,
    description?: string,
    color?: string,
    icon?: string,
    children?: Array<TreeDataNode>
};