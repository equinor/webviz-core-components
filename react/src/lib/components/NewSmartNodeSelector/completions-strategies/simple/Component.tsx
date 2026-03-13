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
): item is Extract<CompletionItem<Node>, { kind: "segment" }> {
    return item.kind === "segment" && item.origin.kind === "single";
}

export function SimpleCompletionStrategyComponent(
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

                        return (<div key={id} style={{
                            display: "flex",
                            alignItems: "center",
                            padding: 4,
                            backgroundColor: highlighted ? "#def" : undefined,
                            cursor: "pointer",
                        }} onMouseEnter={() => props.setState((prev) => ({ ...prev, highlightedId: id }))}>
                            <input type="checkbox" key={id} id={id} checked={selected} onChange={() => {
                                props.setState((prev) => ({
                                    ...prev,
                                    highlightedId: id,
                                    selectedIds: prev.selectedIds.includes(id)
                                        ? prev.selectedIds.filter((x) => x !== id)
                                        : [...prev.selectedIds, id],
                                }));
                            }} />
                            <label style={{ marginLeft: 4 }} htmlFor={id}>{item.label}</label>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
