/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
    TagSuggestionEngine,
    type Suggestion,
    type TreeDataNode,
    type IndexedNode,
} from "./core";
import { Input } from "./components/Input";
import { place } from "@equinor/eds-icons";

export type SmartNodeSelectorClassNames = {
    root?: string;
    tagChip?: string;
    suggestionsPopover?: string;
    suggestionItem?: string;
};

export type SmartNodeSelectorProps = {
    /** Tree data to search */
    data: TreeDataNode[];

    /** Delimiter for path segments (default: ":") */
    delimiter?: string;

    /** Label for the input field */
    label?: string;

    /** Placeholder text for input */
    placeholder?: string;

    /** Initially selected tags */
    value?: string[];

    /** Callback when selected tags change */
    onChange?: (tags: string[]) => void;

    /** Callback when matched nodes change */
    onSelectedNodesChange?: (matches: IndexedNode[]) => void;

    /** Maximum number of suggestions to show */
    maxSuggestions?: number;

    /** Maximum number of nodes that can be selected */
    maxSelectedNodes?: number;

    slots?: SmartNodeSelectorSlots;

    /** CSS class name for root element */
    slotProps?: SmartNodeSelectorSlotProps;
};

const DEFAULT_PROPS = {
    delimiter: ":",
    maxSuggestions: 20,
    placeholder: "Search or select nodes...",
};

type SmartNodeSelectorSlots = {
    root?: React.ElementType;
    tagChip?: React.ElementType;
    suggestionsPopover?: React.ElementType;
    suggestionItem?: React.ElementType;
};

type SmartNodeSelectorSlotProps = {
    root?: React.HTMLAttributes<HTMLDivElement>;
    tagChip?: React.HTMLAttributes<HTMLDivElement>;
    suggestionsPopover?: React.HTMLAttributes<HTMLDivElement>;
    suggestionItem?: React.HTMLAttributes<HTMLDivElement>;
};

export function SmartNodeSelector(props: SmartNodeSelectorProps) {
    const defaultedProps = { ...DEFAULT_PROPS, ...props };

    return (
        <div
            {...props.slotProps?.root}
            style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "8px",
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                alignItems: "center",
            }}
        >
            <Input
                placeholder={defaultedProps.placeholder}
                className={props.slotProps?.root?.className}
            />
        </div>
    );
}
