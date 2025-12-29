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
import { initializer, makeReducer } from "./state/reducer";
import type { State } from "./state/type";
import { ActionType, type Action } from "./state/actions";
import { DebugInfo } from "./components/DebugInfo";
import type { Suggestion } from "./core/types/Suggestion";
import { SuggestionPopover } from "./components/SuggestionPopover";

export type SmartNodeSelectorClassNames = {
    root?: string;
    tagChip?: string;
    suggestionsPopover?: string;
    suggestionItem?: string;
};

export type SmartNodeSelectorProps<
    TSlots extends SmartNodeSelectorSlots = SmartNodeSelectorSlots,
> = {
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

    slots?: TSlots;

    /** CSS class name for root element */
    slotProps?: SmartNodeSelectorSlotProps<TSlots>;

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
        return (
            <li style={{ padding: "8px 12px", cursor: "pointer" }}>
                <div style={{ fontWeight: 500 }}>
                    {suggestion.contextPrefix && (
                        <span style={{ color: "#999", fontWeight: 400 }}>
                            {suggestion.contextPrefix}
                        </span>
                    )}
                    <span>{suggestion.name}</span>
                </div>
                {suggestion.description && (
                    <div style={{ fontSize: "0.85em", color: "#666" }}>
                        {suggestion.description}
                    </div>
                )}
                {suggestion.node?.filterableMetadata &&
                    Object.keys(suggestion.node.filterableMetadata).length >
                        0 && (
                        <div
                            style={{
                                fontSize: "0.75em",
                                color: "#999",
                                marginTop: "4px",
                            }}
                        >
                            {Object.entries(
                                suggestion.node.filterableMetadata
                            ).map(([key, value]) => (
                                <span key={key} style={{ marginRight: "8px" }}>
                                    {key}: {value}
                                </span>
                            ))}
                        </div>
                    )}
            </li>
        );
    },
    suggestionItemHeight: 48,
};

type SmartNodeSelectorSlots = {
    root?: React.ElementType;
    tagChip?: React.ElementType;
    matchesCounter?: React.ElementType;
    suggestionsPopover?: React.ElementType;
    suggestionItem?: React.ElementType;
};

type SmartNodeSelectorSlotProps<
    TSlots extends SmartNodeSelectorSlots = SmartNodeSelectorSlots,
> = {
    [K in keyof TSlots]?: React.ComponentPropsWithoutRef<
        TSlots[K] extends React.ElementType ? TSlots[K] : never
    >;
};

type SmartNodeSelectorDataContext = {
    suggestionEngine: TagSuggestionEngine;
    delimiter: string;
    placeholders: {
        newTag: string;
        incompleteTag: string;
    };
    state: State;
    dispatch: React.Dispatch<Action>;
};

export const SmartNodeSelectorDataContext =
    React.createContext<SmartNodeSelectorDataContext>(
        {} as SmartNodeSelectorDataContext
    );

// Complete slots definition with defaults
type CompleteSlots = Required<SmartNodeSelectorSlots>;
type CompleteSlotProps = SmartNodeSelectorSlotProps<CompleteSlots>;

type SmartNodeSelectorSlotsContextValue = {
    slots: CompleteSlots;
    slotProps: CompleteSlotProps;
};

// Default slot components
const DEFAULT_SLOTS: CompleteSlots = {
    root: "ul",
    tagChip: "li",
    matchesCounter: "span",
    suggestionsPopover: "div",
    suggestionItem: "div",
};

// Default slot props
const DEFAULT_SLOT_PROPS: CompleteSlotProps = {
    root: {},
    tagChip: {},
    matchesCounter: {},
    suggestionsPopover: {},
    suggestionItem: {},
};

export const SmartNodeSelectorSlotsContext =
    React.createContext<SmartNodeSelectorSlotsContextValue>({
        slots: DEFAULT_SLOTS,
        slotProps: DEFAULT_SLOT_PROPS,
    });

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
        makeReducer({ delimiter: defaultedProps.delimiter }),
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

    const dataContext = React.useMemo(
        () => ({
            suggestionEngine,
            delimiter: defaultedProps.delimiter,
            placeholders: defaultedProps.placeholders,
            state,
            dispatch,
        }),
        [suggestionEngine, defaultedProps.delimiter, state, dispatch]
    );

    const slotsContext = React.useMemo(
        () => ({
            slots: {
                ...DEFAULT_SLOTS,
                ...props.slots,
            },
            slotProps: {
                ...DEFAULT_SLOT_PROPS,
                ...props.slotProps,
            },
        }),
        [props.slots, props.slotProps]
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
                payload: { tagId, segmentIndex: parseInt(segmentIndex), caretIndex: 0 },
            });
        }
    }

    function handleFocusOut(e: React.FocusEvent) {
        const relatedTarget = e.relatedTarget as Node | null;

        // Check if focus is moving to the popover or one of its children
        const popover = document.querySelector("[data-suggestion-popover]");
        const isMovingToPopover =
            relatedTarget && popover?.contains(relatedTarget);

        // Only clear if focus left the container entirely AND is not moving to the popover
        if (!e.currentTarget.contains(relatedTarget) && !isMovingToPopover) {
            dispatch({ type: ActionType.CLEAR_FOCUSED_ADDRESS });
        }
    }

    const RootComponent = slotsContext.slots.root;
    const rootProps = slotsContext.slotProps.root ?? {};

    return (
        <SmartNodeSelectorDataContext.Provider value={dataContext}>
            <SmartNodeSelectorSlotsContext.Provider value={slotsContext}>
                <div onBlurCapture={handleFocusOut}>
                    <RootComponent
                        {...rootProps}
                        data-smart-node-selector-root
                        onFocusCapture={handleFocusIn}
                        style={{
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            padding: "8px",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            alignItems: "center",
                            ...(rootProps as any).style,
                        }}
                    >
                        {state.tags.map((tag, index) => (
                            <Tag key={tag.id} index={index} tag={tag} />
                        ))}
                    </RootComponent>
                    <DebugInfo />
                    <SuggestionPopover
                        renderSuggestionItem={
                            defaultedProps.renderSuggestionItem
                        }
                        suggestionItemHeight={
                            defaultedProps.suggestionItemHeight
                        }
                        maxNumberSuggestions={defaultedProps.maxSuggestions}
                    />
                </div>
            </SmartNodeSelectorSlotsContext.Provider>
        </SmartNodeSelectorDataContext.Provider>
    );
}
