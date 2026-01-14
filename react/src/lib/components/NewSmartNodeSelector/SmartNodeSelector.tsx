/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { CaretRenderer } from "./components/CaretAndSelectionRenderer";
import { CompletionsPopover } from "./components/CompletionsPopover";
import { DebugInfo } from "./components/DebugInfo";
import { HiddenTextarea } from "./components/HiddenTextarea";
import { QueryChip } from "./components/QueryChip";
import { type IndexedNode, type TreeDataNode } from "./core";
import { CompletionsState } from "./core/CompletionsState";
import { useSubscribeToTopic } from "./core/PubSubDelegate";
import { StateManager, Topic } from "./core/StateManager/StateManager";
import {
    makeIndexedNodeAccessor,
    TreeIndexBuilder,
} from "./core/TreeIndexBuilder";
import type {
    NodeCompletionItem,
    SyntaxCompletionItem,
} from "./core/query-language/types/completion";
import { useMouseEventHandler } from "./hooks/useMouseEventHandler";
import { merge } from "lodash";
import type { DeepRequired } from "./utils/deepRequired";

export type SmartNodeSelectorClassNames = {
    root?: string;
    tagChip?: string;
    suggestionsPopover?: string;
    suggestionItem?: string;
};

export type SmartNodeSelectorOptions = {
    completions?: {
        maxNumberCompletions?: number;
        renderSyntaxCompletionItems?: (
            completions: SyntaxCompletionItem[],
            onClick: (completion: SyntaxCompletionItem) => void,
            selectedIndex: number | null
        ) => React.ReactNode;
        renderNodeCompletionItem?: (
            completion: NodeCompletionItem<IndexedNode>,
            isSelected: boolean
        ) => React.ReactNode;
        completionItemHeight?: number;
    };
    lexical?: {
        delimiter?: string;
        // Add options for special chars
    };
    queryChips?: {
        truncation?: {
            enable?: boolean;
            maxSegmentChars?: number;
        };
    };
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
    completionsState: CompletionsState<IndexedNode>;
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
    completions: {
        renderSyntaxCompletionItems: (
            completions: SyntaxCompletionItem[],
            onClick: (completion: SyntaxCompletionItem) => void,
            selectedIndex: number | null
        ) => {
            function makeTitle(completion: SyntaxCompletionItem): string {
                if (completion.kind === "group") {
                    if (completion.insertText === "(") {
                        return "Open a new group";
                    } else if (completion.insertText === ")") {
                        return "Close the current group";
                    }
                } else if (completion.kind === "set") {
                    if (completion.insertText === "{") {
                        return "Open a new set for unions";
                    } else if (completion.insertText === "}") {
                        return "Close the current set";
                    }
                } else if (completion.kind === "unionFlag") {
                    if (completion.insertText === "+") {
                        return "Union flag: create a union of the children of all the matched nodes";
                    }
                } else if (completion.kind === "wildcard") {
                    if (completion.insertText === "*") {
                        return "Wildcard: matches any single segment";
                    } else if (completion.insertText === "**") {
                        return "Deep wildcard: matches any number of segments";
                    } else if (completion.insertText === "?") {
                        return "Wildcard: matches any single character in a segment";
                    }
                } else if (completion.kind === "delimiter") {
                    return "Delimiter: use to start new segment";
                } else if (completion.kind === "operator") {
                    if (completion.insertText === "|") {
                        return "OR operator: matches either side";
                    } else if (completion.insertText === ",") {
                        return "Separator for set items";
                    }
                }
                return "";
            }

            return (
                <ul
                    style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 4,
                        display: "flex",
                        gap: "8px",
                        borderBottom: "1px solid #ccc",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        alignItems: "center",
                    }}
                >
                    {completions.map((completion, index) => (
                        <li
                            key={index}
                            className="suggestion-item"
                            style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "1em",
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                                backgroundColor:
                                    selectedIndex === index
                                        ? "#235de4ff"
                                        : "#f5f5f5",
                                color:
                                    selectedIndex === index ? "white" : "black",
                            }}
                            title={makeTitle(completion)}
                            onClick={() => onClick(completion)}
                        >
                            {completion.insertText}
                        </li>
                    ))}
                </ul>
            );
        },
        renderNodeCompletionItem: (
            completion: NodeCompletionItem<IndexedNode>,
            isSelected: boolean
        ) => {
            let label: string | React.ReactNode = completion.insertText;
            let detail: React.ReactNode = null;

            if (completion.origin.kind === "single") {
                const name = completion.origin.node.name;
                const range = completion.origin.nodeNameRange;
                const left = name.slice(0, range.start);
                const mid = name.slice(range.start, range.end);
                const right = name.slice(range.end);
                label = (
                    <span style={{ color: "rgba(199, 199, 199, 1)" }}>
                        {left}
                        <span style={{ color: "black" }}>{mid}</span>
                        {right}
                    </span>
                );
                detail = completion.origin.node.description;
            } else if (completion.origin.kind === "multi") {
                detail = `${completion.origin.count} matching nodes`;
            }

            return (
                <li
                    className="suggestion-item"
                    style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        backgroundColor: isSelected ? "#e6f0ff" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        gap: "1em",
                    }}
                >
                    <div style={{ fontWeight: 800 }}>{label}</div>
                    {detail && (
                        <div style={{ fontSize: "smaller", color: "#666" }}>
                            {detail}
                        </div>
                    )}
                </li>
            );
        },
        completionItemHeight: 48,
        maxNumberCompletions: 10,
    },
    lexical: {
        delimiter: ":",
    },
    queryChips: {
        truncation: {
            enable: false,
            maxSegmentChars: 15,
        },
    },
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
            delimiter: defaultedOptions.lexical.delimiter,
        });
        stateManager.addQueryItem("");
        return stateManager;
    }, []) as StateManager;

    const treeIndexBuildResult = React.useMemo(() => {
        return new TreeIndexBuilder(defaultedOptions.lexical.delimiter).build(
            props.data
        );
    }, [props.data, defaultedOptions.lexical.delimiter]);

    const treeAccessor = React.useMemo(() => {
        return makeIndexedNodeAccessor(treeIndexBuildResult);
    }, [treeIndexBuildResult]);

    const completionsState = React.useMemo(() => {
        return new CompletionsState({
            treeAccessor,
            maxNumCompletions:
                defaultedOptions.completions.maxNumberCompletions,
        });
    }, [treeAccessor, defaultedOptions.completions.maxNumberCompletions]);

    React.useEffect(() => {
        stateManager.updateBuildResult(treeIndexBuildResult);
    }, [stateManager, treeIndexBuildResult]);

    useMouseEventHandler(ref, stateManager, defaultedOptions.lexical.delimiter);

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
            delimiter: defaultedOptions.lexical.delimiter,
        }),
        [
            stateManager,
            completionsState,
            props.placeholders,
            defaultedOptions.lexical.delimiter,
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
                                />
                            ))}
                            <CaretRenderer mainRef={ref} />
                        </RootComponent>
                        <DebugInfo />
                        <CompletionsPopover
                            renderNodeCompletionItem={
                                defaultedOptions.completions
                                    .renderNodeCompletionItem
                            }
                            renderSyntaxCompletionItems={
                                defaultedOptions.completions
                                    .renderSyntaxCompletionItems
                            }
                            completionItemHeight={
                                defaultedOptions.completions
                                    .completionItemHeight
                            }
                            maxNumberCompletions={
                                defaultedOptions.completions
                                    .maxNumberCompletions
                            }
                        />
                    </div>
                </SmartNodeSelectorOptionsContext.Provider>
            </SmartNodeSelectorSlotsContext.Provider>
        </SmartNodeSelectorDataContext.Provider>
    );
}
