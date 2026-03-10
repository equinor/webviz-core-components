import React from "react";
import type { SimpleCompletionSessionState } from "./Strategy";
import type { CompletionItem } from "../../core/query-language/types/completion";
import type { CompletionStrategyComponentProps } from "../interface";
import type { IndexedNode } from "../../core";

function getCompletionKey<Node>(item: CompletionItem<Node>): string {
    return `${item.kind}::${item.label}::${item.insertText}::${item.replaceRange.start}::${item.replaceRange.end}`;
}

function isSimpleNodeCompletion<Node>(
    item: CompletionItem<Node>
): item is Extract<CompletionItem<Node>, { kind: "node" }> {
    return item.kind === "node" && item.origin.kind === "single";
}

export function SimpleCompletionStrategyComponent(
    props: CompletionStrategyComponentProps<
        IndexedNode,
        SimpleCompletionSessionState
    >
): React.ReactElement {
    const items = props.completions.filter(isSimpleNodeCompletion);

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
                <button
                    type="button"
                    onClick={() =>
                        props.setState((prev) => ({
                            ...prev,
                            operator: "union",
                        }))
                    }
                    style={{
                        fontWeight:
                            props.state.operator === "union"
                                ? "bold"
                                : "normal",
                    }}
                >
                    OR
                </button>
                <button
                    type="button"
                    onClick={() =>
                        props.setState((prev) => ({
                            ...prev,
                            operator: "intersection",
                        }))
                    }
                    style={{
                        fontWeight:
                            props.state.operator === "intersection"
                                ? "bold"
                                : "normal",
                    }}
                >
                    AND
                </button>
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
                            <button
                                key={id}
                                type="button"
                                onClick={() =>
                                    props.setState((prev) => ({
                                        ...prev,
                                        highlightedId: id,
                                        selectedIds: prev.selectedIds.includes(
                                            id
                                        )
                                            ? prev.selectedIds.filter(
                                                  (x) => x !== id
                                              )
                                            : [...prev.selectedIds, id],
                                    }))
                                }
                                style={{
                                    display: "flex",
                                    width: "100%",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "6px 8px",
                                    border: "none",
                                    background: highlighted
                                        ? "#f3f3f3"
                                        : "transparent",
                                    cursor: "pointer",
                                    textAlign: "left",
                                }}
                            >
                                <span>{selected ? "✓" : ""}</span>
                                <span>{item.label}</span>
                                {item.detail && (
                                    <span
                                        style={{
                                            marginLeft: "auto",
                                            opacity: 0.7,
                                        }}
                                    >
                                        {item.detail}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
