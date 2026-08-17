import React from "react";
import type { IndexedNode } from "../../core";
import type { NodeCompletionItem } from "../../core/query-language/types/completion";
import { VirtualizedList } from "../../ui/VirtualizedList";
import type { CompletionsAdapterComponentProps } from "../interface";
import { Checkbox } from "@equinor/eds-core-react";

export function SimpleCompletionsComponent(
    props: CompletionsAdapterComponentProps
) {
    const nodeCompletions = React.useMemo(() => {
        return props.completions.filter(
            (comp): comp is NodeCompletionItem<IndexedNode> =>
                comp.kind === "node"
        );
    }, [props.completions]);

    return (
        <>
            <div style={{ padding: 4, overflow: "auto" }}>
                <VirtualizedList
                    items={nodeCompletions}
                    itemHeight={48}
                    context={props.currentSegmentSelections}
                    maxHeight={Math.min(props.maxContainerHeight - 24, 48 * 10)}
                    renderItem={renderNodeCompletionItem}
                    onItemClick={(_, index) => props.onSelectCompletion(index)}
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
    isSelected: boolean,
    context: IndexedNode[]
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

    const isSelectedInContext = context.some((node) => {
        if (completion.origin.kind === "single") {
            return node === completion.origin.node;
        }
        return false;
    });

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
            <Checkbox checked={isSelectedInContext} readOnly />
            <div style={{ fontWeight: 800 }}>{label}</div>
            {detail && (
                <div style={{ fontSize: "smaller", color: "#666" }}>
                    {detail}
                </div>
            )}
        </li>
    );
}
