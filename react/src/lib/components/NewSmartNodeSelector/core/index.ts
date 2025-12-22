/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Public API - only export the main engine
export { TagSuggestionEngine } from "./TagSuggestionEngine";

// Export types that users need
export type { TreeDataNode, IndexedNode } from "./types/TreeNode";
export type { ValidationResult } from "./TagValidator";
export type { Suggestion } from "./types/Suggestion";
