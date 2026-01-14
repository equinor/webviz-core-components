import React from "react";

import type { IndexedNode } from "../core";
import { CompletionsTopic } from "../core/CompletionsState";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import type {
    CompletionItem,
    NodeCompletionItem,
    SyntaxCompletionItem,
} from "../core/query-language/types/completion";
import { Topic } from "../core/StateManager/StateManager";
import {
    SmartNodeSelectorDataContext,
    type SmartNodeSelectorDataContextType,
} from "../SmartNodeSelector";
import { VirtualizedList } from "./VirtualizedList";
import { useElementBoundingRect } from "../hooks/useElementBoundingRect";

export type CompletionsPopoverProps = {
    renderSyntaxCompletionItems: (
        completions: SyntaxCompletionItem[],
        onClick: (completion: SyntaxCompletionItem) => void,
        selectedIndex: number | null
    ) => React.ReactNode;
    renderNodeCompletionItem: (
        completion: NodeCompletionItem<IndexedNode>,
        isSelected: boolean
    ) => React.ReactNode;
    completionItemHeight: number;
    maxNumberCompletions: number;
};

export function CompletionsPopover(
    props: CompletionsPopoverProps
): React.ReactElement {
    const { stateManager, completionsState }: SmartNodeSelectorDataContextType =
        React.useContext(SmartNodeSelectorDataContext);

    const popoverRef = React.useRef<HTMLDivElement>(null);

    const [anchorElement, setAnchorElement] =
        React.useState<HTMLElement | null>(null);
    const [maxHeight, setMaxHeight] = React.useState<number>(0);
    const directionRef = React.useRef<"down" | "up">("down");

    const updatePosition = React.useCallback(
        function updatePosition() {
            if (!anchorElement || !popoverRef.current) {
                return;
            }

            const rect = anchorElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const margin = 4;

            const spaceBelow = viewportHeight - (rect.bottom + margin);
            const spaceAbove = rect.top - margin;

            const direction =
                spaceBelow >= 150 || spaceBelow >= spaceAbove ? "down" : "up";
            const newMaxHeight = direction === "down" ? spaceBelow : spaceAbove;

            directionRef.current = direction;

            // Only update state if maxHeight changed or forced (for VirtualizedList re-render)
            setMaxHeight((prev) => {
                if (newMaxHeight !== prev) {
                    return newMaxHeight;
                }
                return prev;
            });

            const containerElement = anchorElement.closest(
                "[data-smart-node-selector-root]"
            );
            const containerRect = containerElement?.getBoundingClientRect();

            // Directly update the popover's style for smooth positioning
            const popoverElement = popoverRef.current;
            popoverElement.style.position = "fixed";
            popoverElement.style.left = `${containerRect ? containerRect.left : rect.left}px`;
            popoverElement.style.width = containerRect?.width
                ? `${containerRect.width}px`
                : "";
            popoverElement.style.maxHeight = `${newMaxHeight}px`;
            popoverElement.style.right = "unset";

            if (direction === "down") {
                popoverElement.style.top = `${rect.bottom + margin}px`;
                popoverElement.style.bottom = "unset";
            } else {
                popoverElement.style.bottom = `${viewportHeight - rect.top + margin}px`;
                popoverElement.style.top = "unset";
            }
        },
        [anchorElement]
    );

    useElementBoundingRect(anchorElement, updatePosition);

    const focusedSegment = useSubscribeToTopic(
        stateManager,
        Topic.FOCUSED_SEGMENT
    );

    const nodeCompletions = useSubscribeToTopic(
        completionsState,
        CompletionsTopic.NODE_COMPLETIONS
    ) as NodeCompletionItem<IndexedNode>[];

    const syntaxCompletions = useSubscribeToTopic(
        completionsState,
        CompletionsTopic.SYNTAX_COMPLETIONS
    ) as SyntaxCompletionItem[];

    const selectedIndex = useSubscribeToTopic(
        completionsState,
        CompletionsTopic.SELECTED_INDEX
    );

    React.useEffect(
        function onFocusedAddressChange() {
            if (focusedSegment === null) {
                popoverRef.current?.hidePopover();
                setAnchorElement(null);
                return;
            }

            const inputElement = document.querySelector(
                `[data-querychip-id="${focusedSegment.queryId}"]`
            ) as HTMLElement | null;
            if (inputElement) {
                setAnchorElement(inputElement);
                popoverRef.current?.showPopover();
            } else {
                popoverRef.current?.hidePopover();
                setAnchorElement(null);
            }
        },
        [focusedSegment]
    );

    const handleItemClick = React.useCallback(
        function handleItemClick(completion: CompletionItem<IndexedNode>) {
            const focusedSegment = stateManager.getFocusedSegment();
            if (focusedSegment === null) {
                return;
            }
            stateManager.updateQueryItem(
                focusedSegment.queryId,
                completion.insertText,
                completion.replaceRange
            );
            stateManager.setCaretPositionToEndOfQueryItem(
                focusedSegment.queryId
            );
        },
        [stateManager]
    );

    return (
        <div
            ref={popoverRef}
            popover="manual"
            data-completion-popover
            onMouseDown={(e) => {
                // Prevent mousedown from causing textarea to lose focus
                e.preventDefault();
            }}
            style={{
                boxSizing: "border-box" as const,
                border: "1px solid #ccc",
                borderRadius: 4,
                backgroundColor: "white",
                boxShadow: "0 2px 8px rgba(42, 42, 42, 0.15)",
                inset: "unset",
            }}
        >
            {props.renderSyntaxCompletionItems(
                syntaxCompletions,
                handleItemClick,
                selectedIndex !== null && selectedIndex < 0
                    ? Math.abs(selectedIndex) - 1
                    : null
            )}
            <div style={{ padding: 4, overflow: "auto" }}>
                <VirtualizedList
                    items={nodeCompletions}
                    itemHeight={props.completionItemHeight}
                    maxHeight={Math.min(
                        maxHeight - 24,
                        props.completionItemHeight * props.maxNumberCompletions
                    )}
                    renderItem={props.renderNodeCompletionItem}
                    onItemClick={handleItemClick}
                    selectedIndex={selectedIndex}
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
        </div>
    );
}
