/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { type TreeDataNode, type IndexedNode } from "./core";
import { QueryChip } from "./components/QueryChip";
import { DebugInfo } from "./components/DebugInfo";
import { CompletionPopover } from "./components/CompletionPopover";
import { HiddenTextarea } from "./components/HiddenTextarea";
import { StateManager, Topic } from "./core/StateManager/StateManager";
import { CaretRenderer } from "./components/CaretAndSelectionRenderer";
import { useMouseEventHandler } from "./hooks/useMouseEventHandler";
import { useSubscribeToTopic } from "./core/PubSubDelegate";
import { CompletionsState } from "./core/CompletionsState";
import {
    makeIndexedNodeAccessor,
    TreeIndexBuilder,
} from "./core/TreeIndexBuilder";
import type { CompletionItem } from "./core/query-language/types/completion";

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

    renderCompletionItem?: (
        completion: CompletionItem<IndexedNode>,
        isSelected: boolean
    ) => React.ReactNode;

    suggestionItemHeight?: number;
};

const DEFAULT_PROPS = {
    delimiter: ":",
    maxSuggestions: 20,
    placeholders: {
        newTag: "New tag...",
        incompleteTag: "Incomplete tag...",
    },
    renderCompletionItem: (
        completion: CompletionItem<IndexedNode>,
        isSelected: boolean
    ) => {
        return (
            <li
                className="suggestion-item"
                style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#e6f0ff" : "transparent",
                }}
            >
                <div style={{ fontWeight: 500 }}>{completion.insertText}</div>
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
    stateManager: StateManager;
    suggestionsState: CompletionsState<IndexedNode>;
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

    const stateManager = React.useMemo(() => {
        const stateManager = new StateManager({
            delimiter: defaultedProps.delimiter,
        });
        stateManager.addQueryItem("Test:Test2");
        return stateManager;
    }, []) as StateManager;

    const treeIndexBuildResult = React.useMemo(() => {
        return new TreeIndexBuilder(defaultedProps.delimiter).build(
            defaultedProps.data
        );
    }, [defaultedProps.data, defaultedProps.delimiter]);

    const treeAccessor = React.useMemo(() => {
        return makeIndexedNodeAccessor(treeIndexBuildResult);
    }, [treeIndexBuildResult]);

    const suggestionsState = React.useMemo(() => {
        return new CompletionsState({
            treeAccessor,
            maxNumCompletions: defaultedProps.maxSuggestions,
        });
    }, [treeIndexBuildResult, defaultedProps.maxSuggestions]);

    useMouseEventHandler(ref, stateManager, defaultedProps.delimiter);

    const queryItems = useSubscribeToTopic(stateManager, Topic.QUERY_ITEMS);
    const hasFocus = useSubscribeToTopic(stateManager, Topic.HAS_FOCUS);

    const dataContext = React.useMemo(
        () => ({
            stateManager,
            suggestionsState,
            placeholders: defaultedProps.placeholders,
            delimiter: defaultedProps.delimiter,
        }),
        [
            stateManager,
            suggestionsState,
            defaultedProps.placeholders,
            defaultedProps.delimiter,
        ]
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
                            border: "1px solid #433f3fff",
                            borderRadius: "4px",
                            padding: "8px",
                            display: "flex",
                            position: "relative",
                            cursor: "text",
                            flexWrap: "wrap",
                            gap: "8px",
                            minHeight: "40px",
                            alignItems: "center",
                            outline: hasFocus ? "2px solid #007aff" : "none",
                            ...(rootProps as any).style,
                        }}
                    >
                        {queryItems?.map((queryItem, index) => (
                            <QueryChip
                                key={queryItem.id}
                                queryItem={queryItem}
                                isLast={index === queryItems.length - 1}
                            />
                        ))}
                        <CaretRenderer mainRef={ref} />
                    </RootComponent>
                    <DebugInfo />
                    <CompletionPopover
                        renderCompletionItem={
                            defaultedProps.renderCompletionItem
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
