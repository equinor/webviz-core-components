/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface TreeDataNode {
    id?: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    children?: Array<TreeDataNode>;
}

export interface TreeDataNodeMetaData {
    id?: string;
    description?: string;
    color?: string;
    icon?: string;
    numChildren: number;
}
