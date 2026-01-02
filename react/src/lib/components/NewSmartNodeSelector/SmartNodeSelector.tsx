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
import { QueryChip } from "./components/QueryChip";
import { makeTags as makeInitialTags } from "./utils/makeTags";
import { initializer, makeReducer } from "./state/reducer";
import type { State } from "./state/type";
import { ActionType, type Action } from "./state/actions";
import { DebugInfo } from "./components/DebugInfo";
import type { Suggestion } from "./core/types/Suggestion";
import { SuggestionPopover } from "./components/SuggestionPopover";
import { HiddenTextarea } from "./components/HiddenTextarea";
import { StateManager, Topic } from "./core/StateManager";
import { CaretRenderer } from "./components/CaretRenderer";
import { useMouseEventHandler } from "./hooks/useMouseEventHandler";
import { useSubscribeToTopic } from "./core/PubSubDelegate";

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
    queryChip?: React.ElementType;
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

export type SmartNodeSelectorDataContextType = {
    suggestionEngine: TagSuggestionEngine;
    stateManager: StateManager;
    placeholders: {
        newTag: string;
        incompleteTag: string;
    };
    delimiter: string;
};

export const SmartNodeSelectorDataContext =
    React.createContext<SmartNodeSelectorDataContextType>(
        {} as SmartNodeSelectorDataContextType
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
    queryChip: "li",
    matchesCounter: "span",
    suggestionsPopover: "div",
    suggestionItem: "div",
};

// Default slot props
const DEFAULT_SLOT_PROPS: CompleteSlotProps = {
    root: {},
    queryChip: {},
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

    const ref = React.useRef<HTMLDivElement>(null);

    const suggestionEngine = React.useMemo(() => {
        return new TagSuggestionEngine(defaultedProps.delimiter);
    }, [defaultedProps.delimiter]);

    const stateManager = React.useMemo(() => {
        const stateManager = new StateManager({
            delimiter: defaultedProps.delimiter,
        });
        stateManager.addQueryItem("Test:Test2");
        return stateManager;
    }, []) as StateManager;

    useMouseEventHandler(ref, stateManager);

    const queryItems = useSubscribeToTopic(stateManager, Topic.QUERY_ITEMS);
    const hasFocus = useSubscribeToTopic(stateManager, Topic.HAS_FOCUS);

    React.useEffect(
        function onDataChange() {
            suggestionEngine.setData(defaultedProps.data);
        },
        [defaultedProps.data, suggestionEngine]
    );

    const dataContext = React.useMemo(
        () => ({
            suggestionEngine,
            stateManager,
            placeholders: defaultedProps.placeholders,
            delimiter: defaultedProps.delimiter,
        }),
        [suggestionEngine, stateManager, defaultedProps.placeholders]
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

    const RootComponent = slotsContext.slots.root;
    const rootProps = slotsContext.slotProps.root ?? {};

    return (
        <SmartNodeSelectorDataContext.Provider value={dataContext}>
            <SmartNodeSelectorSlotsContext.Provider value={slotsContext}>
                <div>
                    <HiddenTextarea />
                    <RootComponent
                        {...rootProps}
                        ref={ref}
                        data-smart-node-selector-root
                        style={{
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            padding: "8px",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            alignItems: "center",
                            outline: hasFocus ? "2px solid #007aff" : "none",
                            ...(rootProps as any).style,
                        }}
                    >
                        {queryItems?.map((queryItem) => (
                            <QueryChip
                                key={queryItem.id}
                                queryItem={queryItem}
                            />
                        ))}
                        <CaretRenderer mainRef={ref} />
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
