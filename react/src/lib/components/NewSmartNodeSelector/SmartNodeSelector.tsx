/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
    TagSuggestionEngine,
    type TreeDataNode,
    type IndexedNode,
} from "./core";
import { Tag } from "./components/Tag";
import { makeTags as makeInitialTags } from "./utils/makeTags";
import { initializer, reducer } from "./state/reducer";
import type { State } from "./state/type";
import { ActionType, type Action } from "./state/actions";
import { DebugInfo } from "./components/DebugInfo";
import type { Suggestion } from "./core/types/Suggestion";

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
    placeholders?: {
        newTag?: string;
        incompleteTag?: string;
    };

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

    renderSuggestionItem?: (suggestion: Suggestion) => React.ReactNode;

    suggestionItemHeight?: number;
};

const DEFAULT_PROPS = {
    delimiter: ":",
    maxSuggestions: 20,
    placeholders: {
        newTag: "New tag...",
        incompleteTag: "Incomplete tag...",
    },
    renderSuggestionItem: (suggestion: Suggestion) => {
        return (<li style={{padding: "8px 12px", cursor: "pointer"}}><div style={{ fontWeight: 500 }}>{suggestion.name}</div>
                {suggestion.description && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                        {suggestion.description}
                    </div>
                )}
                {suggestion.filterableMetadata && (
                    <div style={{ fontSize: '0.75em', color: '#999', marginTop: '4px' }}>
                        {Object.entries(suggestion.filterableMetadata).map(([key, value]) => (
                            <span key={key} style={{ marginRight: '8px' }}>
                                {key}: {value}
                            </span>
                        ))}
                    </div>
                )}</li>);
            },
    suggestionItemHeight: 48,
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

type SmartNodeSelectorContext = {
    suggestionEngine: TagSuggestionEngine;
    delimiter: string;
    placeholders: {
        newTag: string;
        incompleteTag: string;
    };
    state: State;
    dispatch: React.Dispatch<Action>;
};

export const SmartNodeSelectorContext =
    React.createContext<SmartNodeSelectorContext>(
        {} as SmartNodeSelectorContext
    );

export function SmartNodeSelector(props: SmartNodeSelectorProps) {
    const defaultedProps = React.useMemo(
        () => ({
            ...DEFAULT_PROPS,
            ...props,
            placeholders: {
                ...DEFAULT_PROPS.placeholders,
                ...props.placeholders,
            },
        }),
        [props]
    );

    const [state, dispatch] = React.useReducer(
        reducer,
        { initialTags: makeInitialTags(props.value ?? []) },
        initializer
    );

    const suggestionEngine = React.useMemo(() => {
        return new TagSuggestionEngine(defaultedProps.delimiter);
    }, [defaultedProps.delimiter]);

    React.useEffect(
        function onDataChange() {
            suggestionEngine.setData(defaultedProps.data);
        },
        [defaultedProps.data, suggestionEngine]
    );

    React.useEffect(function onFocusedAddressChange() {
        if (state.focusedAddress === null) {
            suggestionEngine.

    const context = React.useMemo(
        () => ({
            suggestionEngine,
            delimiter: defaultedProps.delimiter,
            placeholders: defaultedProps.placeholders,
            state,
            dispatch,
        }),
        [suggestionEngine, defaultedProps.delimiter, state, dispatch]
    );

    function handleFocusIn(e: React.FocusEvent) {
        const target = e.target;
        if (target.hasAttribute("data-tag-id")) {
            const tagId = target.getAttribute("data-tag-id");
            const segmentIndex = target.getAttribute("data-segment-index");
            if (tagId === null || segmentIndex === null) {
                throw new Error("Missing data attributes on focused element");
            }
            dispatch({
                type: ActionType.CHANGE_FOCUSED_ADDRESS,
                payload: { tagId, segmentIndex: parseInt(segmentIndex) },
            });
        }
    }

    function handleFocusOut(e: React.FocusEvent) {
        // Only clear if focus left the container entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            dispatch({ type: ActionType.CLEAR_FOCUSED_ADDRESS });
        }
    }

    return (
        <SmartNodeSelectorContext.Provider value={context}>
            <div
                {...props.slotProps?.root}
                data-smart-node-selector-root
                onFocusCapture={handleFocusIn}
                onBlurCapture={handleFocusOut}
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
                {state.tags.map((tag, index) => (
                    <Tag key={tag.id} index={index} tag={tag} />
                ))}
            </div>
            <DebugInfo />
        </SmartNodeSelectorContext.Provider>
    );
}
