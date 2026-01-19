import React from "react";
import type { IndexedNode } from "../../core";
import type { NodeCompletionItem } from "../../core/query-language/types/completion";
import { VirtualizedList } from "../../ui/VirtualizedList";
import type { CompletionsAdapterComponentProps } from "../interface";

export function SimpleCompletionsComponent(
    props: CompletionsAdapterComponentProps
) {
    const nodeCompletions = React.useMemo(() => {
        return props.completions.filter(
            (comp): comp is NodeCompletionItem<IndexedNode> =>
                comp.kind === "node"
        );
    }, [props.completions]);

    const insideGroup = props.caretContext?.insideGroup ?? false;

    return (
        <>
            <ul
                style={{
                    borderBottom: "1px solid #ccc",
                    marginBottom: 4,
                    padding: "2px 8px",
                }}
            >
                {insideGroup ? (
                    <li
                        className="suggestion-item"
                        style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            backgroundColor:
                                props.selectedIndex === -1
                                    ? "#e6f0ff"
                                    : "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: "1em",
                        }}
                    >
                        <div style={{ fontWeight: 800 }}>Close group</div>
                        <div style={{ fontSize: "smaller", color: "#666" }}>
                            Close the current group
                        </div>
                    </li>
                ) : (
                    <li
                        className="suggestion-item"
                        style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            backgroundColor:
                                props.selectedIndex === -1
                                    ? "#e6f0ff"
                                    : "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: "1em",
                        }}
                    >
                        <div style={{ fontWeight: 800 }}>Start a group</div>
                        <div style={{ fontSize: "smaller", color: "#666" }}>
                            Create a new group to match multiple nodes
                        </div>
                    </li>
                )}
            </ul>
            <div style={{ padding: 4, overflow: "auto" }}>
                <VirtualizedList
                    items={nodeCompletions}
                    itemHeight={48}
                    maxHeight={Math.min(props.maxContainerHeight - 24, 48 * 10)}
                    renderItem={renderNodeCompletionItem}
                    onItemClick={props.onSelectCompletion}
                    selectedIndex={props.selectedIndex}
                />
            </div>
            {nodeCompletions.length === 0 && (
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
            <>
                <span style={{ textDecoration: "underline" }}>{left}</span>
                {mid}
                {right}
            </>
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
