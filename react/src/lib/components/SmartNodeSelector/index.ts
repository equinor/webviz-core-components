/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import TreeData, { MatchType } from "./utils/TreeData";
import TreeNodeSelection from "./utils/TreeNodeSelection";
import SmartNodeSelectorComponent from "./components/SmartNodeSelectorComponent";

import type { TreeDataNode, TreeDataNodeMetaData } from "./utils/TreeDataNodeTypes";
import type { SmartNodeSelectorPropsType } from "./components/SmartNodeSelectorComponent";

export { SmartNodeSelector } from "./SmartNodeSelector";
export {
    SmartNodeSelectorComponent,
    TreeData,
    MatchType,
    TreeNodeSelection,
};

export type { SmartNodeSelectorPropsType, TreeDataNode, TreeDataNodeMetaData };
