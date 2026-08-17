import React from "react";
import type { SimpleCompletionSessionState } from "./Strategy";
import type {
    CompletionItem,
    NodeCompletionItem,
    SegmentCompletionItem,
    SyntaxCompletionItem,
} from "../../core/query-language/types/completion";
import type { CompletionStrategyComponentProps } from "../interface";
import type { IndexedNode } from "../../core";
import { VirtualizedList } from "../../ui/VirtualizedList";

function getCompletionKey<Node>(item: CompletionItem<Node>): string {
    return `${item.kind}::${item.label}::${item.insertText}::${item.replaceRange.start}::${item.replaceRange.end}`;
}

function isSimpleNodeCompletion<Node>(
    item: CompletionItem<Node>
): item is Extract<CompletionItem<Node>, { kind: "segment" }> {
    return item.kind === "segment" && item.origin.kind === "single";
}

export function SimpleCompletionStrategyComponent(
    props: CompletionStrategyComponentProps<
        IndexedNode,
        SimpleCompletionSessionState
    >
): React.ReactElement {
    if (props.selectionMode === "segment") {
        return <SegmentCompletions {...props} />;
    } else {
        return <TextCompletions {...props} />;
    }
}

type SegmentCompletionContext = {
    selectedIds: string[];
};

function renderSegmentItem(
    item: SegmentCompletionItem<IndexedNode>,
    isHighlighted: boolean,
    context: SegmentCompletionContext
): React.ReactNode {
    const id = getCompletionKey(item);
    const isChecked = context.selectedIds.includes(id);
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                padding: 4,
                height: "100%",
                boxSizing: "border-box",
                backgroundColor: isHighlighted ? "#def" : undefined,
                cursor: "pointer",
            }}
        >
            <input
                type="checkbox"
                checked={isChecked}
                readOnly
                style={{ pointerEvents: "none" }}
            />
            <div style={{ fontWeight: 800, marginLeft: 4 }}>{item.label}</div>
            <span style={{ marginLeft: 8 }}>
                {item.origin.kind === "single"
                    ? item.origin.node.description
                    : `${item.origin.count} matching nodes`}
            </span>
        </div>
    );
}

function SegmentCompletions(
    props: CompletionStrategyComponentProps<
        IndexedNode,
        SimpleCompletionSessionState
    >
): React.ReactElement {
    const items = React.useMemo(() => {
        return props.completions.filter(isSimpleNodeCompletion);
    }, [props.completions]);

    const highlightedIndex = React.useMemo(() => {
        if (props.state.highlightedId === null) return null;
        const idx = items.findIndex(
            (item) => getCompletionKey(item) === props.state.highlightedId
        );
        return idx === -1 ? null : idx;
    }, [props.state.highlightedId, items]);

    // Scroll to first selected item when popover first opens (before focus).
    // Captured once on mount via ref so it doesn't change on re-renders.
    const initialScrollIndexRef = React.useRef<number | null>(null);
    if (initialScrollIndexRef.current === null) {
        for (const id of props.state.selectedIds) {
            const idx = items.findIndex(
                (item) => getCompletionKey(item) === id
            );
            if (idx !== -1) {
                initialScrollIndexRef.current = idx;
                break;
            }
        }
    }
    const initialScrollIndex = initialScrollIndexRef.current;

    const context = React.useMemo(
        () => ({ selectedIds: props.state.selectedIds }),
        [props.state.selectedIds]
    );

    const ITEM_HEIGHT = 32;
    const HEADER_HEIGHT = 41; // button row height

    return (
        <div
            style={{
                maxHeight: props.maxContainerHeight,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    padding: 8,
                    borderBottom: "1px solid #eee",
                    flexShrink: 0,
                }}
            >
                <button type="button" onClick={props.accept}>
                    Apply
                </button>
            </div>

            {items.length === 0 ? (
                <div style={{ padding: 8 }}>No matching nodes</div>
            ) : (
                <VirtualizedList
                    items={items}
                    itemHeight={ITEM_HEIGHT}
                    maxHeight={Math.min(
                        props.maxContainerHeight - HEADER_HEIGHT,
                        ITEM_HEIGHT * 15
                    )}
                    renderItem={renderSegmentItem}
                    context={context}
                    selectedIndex={highlightedIndex}
                    initialScrollIndex={initialScrollIndex}
                    onItemClick={(item) => {
                        const id = getCompletionKey(item);
                        props.setState((prev) => ({
                            ...prev,
                            highlightedId: id,
                            selectedIds: prev.selectedIds.includes(id)
                                ? prev.selectedIds.filter((x) => x !== id)
                                : [...prev.selectedIds, id],
                        }));
                    }}
                    onItemHover={(item) => {
                        const id = getCompletionKey(item);
                        props.setState((prev) => ({
                            ...prev,
                            highlightedId: id,
                        }));
                    }}
                />
            )}
        </div>
    );
}

export function TextCompletions(
    props: CompletionStrategyComponentProps<
        IndexedNode,
        SimpleCompletionSessionState
    >
): React.ReactElement {
    const syntaxCompletions = React.useMemo(() => {
        return props.completions.filter(
            (comp): comp is SyntaxCompletionItem =>
                comp.kind !== "node" && comp.kind !== "segment"
        );
    }, [props.completions]);

    const nodeCompletions = React.useMemo(() => {
        return props.completions.filter(
            (comp): comp is NodeCompletionItem<IndexedNode> =>
                comp.kind === "node"
        );
    }, [props.completions]);

    const nodeSelectedIndex = React.useMemo(() => {
        if (props.state.highlightedId === null) return null;
        const idx = nodeCompletions.findIndex(
            (item) => getCompletionKey(item) === props.state.highlightedId
        );
        return idx === -1 ? null : idx;
    }, [props.state.highlightedId, nodeCompletions]);

    const syntaxSelectedIndex = React.useMemo(() => {
        if (props.state.highlightedId === null) return null;
        const idx = syntaxCompletions.findIndex(
            (item) => getCompletionKey(item) === props.state.highlightedId
        );
        return idx === -1 ? null : idx;
    }, [props.state.highlightedId, syntaxCompletions]);

    const handleSelectCompletion = React.useCallback(
        (item: CompletionItem<IndexedNode>) => {
            const id = getCompletionKey(item);
            props.setState((prev) => ({
                ...prev,
                highlightedId: id,
                selectedIds: [id],
            }));
            props.accept();
        },
        [props]
    );

    return (
        <>
            {renderSyntaxCompletionItems(
                syntaxCompletions,
                handleSelectCompletion,
                syntaxSelectedIndex
            )}
            <div style={{ padding: 4, overflow: "auto" }}>
                <VirtualizedList
                    items={nodeCompletions}
                    itemHeight={48}
                    maxHeight={Math.min(props.maxContainerHeight - 24, 48 * 10)}
                    renderItem={renderNodeCompletionItem}
                    onItemClick={(item) => handleSelectCompletion(item)}
                    selectedIndex={nodeSelectedIndex}
                />
            </div>
            {nodeCompletions.length === 0 && syntaxCompletions.length === 0 && (
                <div
                    style={{
                        padding: "8px 12px",
                        color: "#666",
                        fontStyle: "italic",
                    }}
                >
                    No completions
                </div>
            )}
        </>
    );
}

function renderSyntaxCompletionItems(
    completions: SyntaxCompletionItem[],
    onClick: (item: SyntaxCompletionItem) => void,
    selectedIndex: number | null
): React.ReactNode {
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
                            selectedIndex === index ? "#235de4ff" : "#f5f5f5",
                        color: selectedIndex === index ? "white" : "black",
                    }}
                    title={makeTitle(completion)}
                    onClick={() => onClick(completion)}
                >
                    {completion.insertText}
                </li>
            ))}
        </ul>
    );
}

function renderNodeCompletionItem(
    completion: NodeCompletionItem<IndexedNode>,
    isSelected: boolean
) {
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
}
