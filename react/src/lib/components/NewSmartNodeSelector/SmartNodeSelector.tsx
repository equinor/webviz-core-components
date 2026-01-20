/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { merge } from "lodash";
import React from "react";
import { AdvancedCompletionAdapter } from "./completion-adapters/advanced/AdvancedCompletionAdapter";
import type { CompletionsAdapter } from "./completion-adapters/interface";
import { type IndexedNode, type TreeDataNode } from "./core";
import { CompletionsState } from "./core/CompletionsState";
import { useSubscribeToTopic } from "./core/PubSubDelegate";
import { StateManager, Topic } from "./core/StateManager/StateManager";
import {
    makeIndexedNodeAccessor,
    TreeIndexBuilder,
} from "./core/TreeIndexBuilder";
import { useMouseEventHandler } from "./hooks/useMouseEventHandler";
import { CaretAndSelectionRenderer } from "./ui/CaretAndSelectionRenderer";
import { CompletionsPopover } from "./ui/CompletionsPopover";
import { DebugInfo } from "./ui/DebugInfo";
import { HiddenTextarea } from "./ui/HiddenTextarea";
import { QueryChip } from "./ui/QueryChip";
import type { DeepRequired } from "./utils/deepRequired";
import type { InputModifier } from "./input-modifiers/interface";
import type { InactiveSegmentRenderer } from "./inactive-segment-renderer/interface";

export type SmartNodeSelectorClassNames = {
    root?: string;
    tagChip?: string;
    suggestionsPopover?: string;
    suggestionItem?: string;
};

export type SmartNodeSelectorOptions = {
    completionsAdapter?: CompletionsAdapter;
    inputModifier?: InputModifier;
    ui: {
        inactiveSegmentRenderer?: InactiveSegmentRenderer<IndexedNode>;
    };
    lexical?: {
        segmentDelimiter?: string;
        // Add options for special chars
    };
    importExport?: {
        // Options for import/export functionality
        queryDelimiter?: string;
    };
    queryChips?: {
        truncation?: {
            enable?: boolean;
            maxSegmentChars?: number;
        };
    };
    matching?: {
        caseInsensitive?: boolean;
    };
    mode: "simple" | "advanced";
};

export type SmartNodeSelectorProps<
    TSlots extends SmartNodeSelectorSlots = SmartNodeSelectorSlots,
> = {
    /** Tree data to search */
    data: TreeDataNode[];

    options?: SmartNodeSelectorOptions;

    /** Label for the input field */
    label?: string;

    /** Placeholder text for input */
    placeholders?: {
        newTag?: string;
        incompleteQuery?: string;
    };

    /** Initially selected tags */
    initialValue?: string[];

    /** Controlled selected tags */
    value?: string[];

    /** Callback when selected tags change */
    onChange?: (tags: string[]) => void;

    /** Callback when matched nodes change */
    onSelectedNodesChange?: (matches: IndexedNode[]) => void;

    /** Maximum number of nodes that can be selected */
    maxSelectedNodes?: number;

    slots?: TSlots;

    /** CSS class name for root element */
    slotProps?: SmartNodeSelectorSlotProps<TSlots>;
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
    completionsState: CompletionsState;
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

const DEFAULT_OPTIONS: DeepRequired<SmartNodeSelectorOptions> = {
    completionsAdapter: new AdvancedCompletionAdapter(),
    inputModifier: (input: string) => input,
    ui: {
        inactiveSegmentRenderer: () => null,
    },
    lexical: {
        segmentDelimiter: ":",
    },
    queryChips: {
        truncation: {
            enable: false,
            maxSegmentChars: 15,
        },
    },
    importExport: {
        queryDelimiter: "\n",
    },
    matching: {
        caseInsensitive: false,
    },
    mode: "advanced",
};

export const SmartNodeSelectorOptionsContext =
    React.createContext<DeepRequired<SmartNodeSelectorOptions>>(
        DEFAULT_OPTIONS
    );

export const SmartNodeSelectorSlotsContext =
    React.createContext<SmartNodeSelectorSlotsContextValue>({
        slots: DEFAULT_SLOTS,
        slotProps: DEFAULT_SLOT_PROPS,
    });

export function SmartNodeSelector(props: SmartNodeSelectorProps) {
    const defaultedOptions = React.useMemo(
        () =>
            merge(
                {},
                DEFAULT_OPTIONS,
                props.options
            ) as DeepRequired<SmartNodeSelectorOptions>,
        [props.options]
    );

    const ref = React.useRef<HTMLDivElement>(null);

    const stateManager = React.useMemo(() => {
        const stateManager = new StateManager({
            segmentDelimiter: defaultedOptions.lexical.segmentDelimiter,
            queryDelimiter: defaultedOptions.importExport.queryDelimiter,
            inputModifier: defaultedOptions.inputModifier,
        });
        for (const tag of props.initialValue ?? []) {
            stateManager.addQueryItem(tag);
        }
        // Make sure we have an empty query item at the end
        stateManager.addQueryItem("");
        return stateManager;
    }, []) as StateManager;

    const completionContext = useSubscribeToTopic(
        stateManager,
        Topic.COMPLETION_CONTEXT
    );

    const treeIndexBuildResult = React.useMemo(() => {
        return new TreeIndexBuilder(
            defaultedOptions.lexical.segmentDelimiter
        ).build(props.data);
    }, [props.data, defaultedOptions.lexical.segmentDelimiter]);

    const treeAccessor = React.useMemo(() => {
        return makeIndexedNodeAccessor(treeIndexBuildResult);
    }, [treeIndexBuildResult]);

    const completionsState = React.useMemo(() => {
        return new CompletionsState({
            treeAccessor,
            completionsAdapter:
                defaultedOptions.completionsAdapter as CompletionsAdapter,
            matchOptions: {
                caseInsensitive: defaultedOptions.matching.caseInsensitive,
            },
            delimiter: defaultedOptions.lexical.segmentDelimiter,
        });
    }, [
        treeAccessor,
        defaultedOptions.completionsAdapter,
        defaultedOptions.matching.caseInsensitive,
    ]);

    React.useEffect(() => {
        if (!completionContext) {
            completionsState.clearCompletions();
            return;
        }

        const parsedQuery = stateManager.getParsedQuery(
            completionContext.queryItem.query
        );
        if (!parsedQuery) {
            completionsState.clearCompletions();
            return;
        }

        completionsState.updateCompletions(
            parsedQuery,
            completionContext.queryTextSelection.focus
        );
    }, [completionContext, completionsState, stateManager]);

    React.useEffect(() => {
        stateManager.updateTreeAccessor(treeAccessor);
    }, [stateManager, treeAccessor]);

    React.useEffect(() => {
        stateManager.updateOptions({
            segmentDelimiter: defaultedOptions.lexical.segmentDelimiter,
            queryDelimiter: defaultedOptions.importExport.queryDelimiter,
            inputModifier: defaultedOptions.inputModifier,
        });
    }, [
        stateManager,
        defaultedOptions.lexical.segmentDelimiter,
        defaultedOptions.importExport.queryDelimiter,
        defaultedOptions.inputModifier,
    ]);

    useMouseEventHandler(
        ref,
        stateManager,
        defaultedOptions.lexical.segmentDelimiter
    );

    const queryItems = useSubscribeToTopic(stateManager, Topic.QUERY_ITEMS);
    const hasFocus = useSubscribeToTopic(stateManager, Topic.HAS_FOCUS);

    const dataContext = React.useMemo(
        () => ({
            stateManager,
            completionsState,
            placeholders: {
                newTag: props.placeholders?.newTag ?? "Type to search...",
                incompleteTag:
                    props.placeholders?.incompleteQuery ?? "Continue typing...",
            },
            delimiter: defaultedOptions.lexical.segmentDelimiter,
        }),
        [
            stateManager,
            completionsState,
            props.placeholders,
            defaultedOptions.lexical.segmentDelimiter,
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
                <SmartNodeSelectorOptionsContext.Provider
                    value={defaultedOptions}
                >
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
                                outline: hasFocus
                                    ? "2px solid #007aff"
                                    : "none",
                                ...(rootProps as any).style,
                            }}
                        >
                            {queryItems?.map((queryItem, index) => (
                                <QueryChip
                                    key={queryItem.id}
                                    queryItem={queryItem}
                                    isLast={index === queryItems.length - 1}
                                    index={index}
                                />
                            ))}
                            <CaretAndSelectionRenderer mainRef={ref} />
                        </RootComponent>
                        <DebugInfo />
                        <CompletionsPopover mainRef={ref} />
                    </div>
                </SmartNodeSelectorOptionsContext.Provider>
            </SmartNodeSelectorSlotsContext.Provider>
        </SmartNodeSelectorDataContext.Provider>
    );
}
