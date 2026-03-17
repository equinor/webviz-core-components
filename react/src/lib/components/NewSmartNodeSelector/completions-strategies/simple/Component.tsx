import React from "react";
import type { SimpleCompletionSessionState } from "./Strategy";
import type {
    CompletionItem,
    NodeCompletionItem,
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

function SegmentCompletions(
    props: CompletionStrategyComponentProps<
        IndexedNode,
        SimpleCompletionSessionState
    >
): React.ReactElement {
    const items = React.useMemo(() => {
        return props.completions.filter(isSimpleNodeCompletion);
    }, [props.completions]);

    return (
        <div
            style={{
                maxHeight: props.maxContainerHeight,
                overflow: "auto",
                padding: 8,
            }}
        >
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    paddingBottom: 8,
                    borderBottom: "1px solid #eee",
                    marginBottom: 8,
                }}
            >
                <button type="button" onClick={props.accept}>
                    Apply
                </button>
            </div>

            {items.length === 0 ? (
                <div>No matching nodes</div>
            ) : (
                <div>
                    {items.map((item) => {
                        const id = getCompletionKey(item);
                        const selected = props.state.selectedIds.includes(id);
                        const highlighted = props.state.highlightedId === id;

                        return (
                            <div
                                key={id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: 4,
                                    backgroundColor: highlighted
                                        ? "#def"
                                        : undefined,
                                    cursor: "pointer",
                                }}
                                onMouseEnter={() =>
                                    props.setState((prev) => ({
                                        ...prev,
                                        highlightedId: id,
                                    }))
                                }
                            >
                                <input
                                    type="checkbox"
                                    key={id}
                                    id={id}
                                    checked={selected}
                                    onChange={() => {
                                        props.setState((prev) => ({
                                            ...prev,
                                            highlightedId: id,
                                            selectedIds:
                                                prev.selectedIds.includes(id)
                                                    ? prev.selectedIds.filter(
                                                          (x) => x !== id
                                                      )
                                                    : [...prev.selectedIds, id],
                                        }));
                                    }}
                                />
                                <label style={{ marginLeft: 4 }} htmlFor={id}>
                                    {item.label}
                                </label>
                            </div>
                        );
                    })}
                </div>
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
