import React from "react";

import {
    SmartNodeSelectorDataContext,
    type SmartNodeSelectorDataContextType,
} from "../SmartNodeSelector";
import { VirtualizedList } from "./VirtualizedList";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { Topic } from "../core/StateManager/StateManager";
import { CompletionsTopic } from "../core/CompletionsState";
import type { CompletionItem } from "../core/query-language/types/completion";
import type { IndexedNode } from "../core";

export type CompletionPopoverProps = {
    renderCompletionItem: (
        completion: CompletionItem<IndexedNode>,
        isSelected: boolean
    ) => React.ReactNode;
    suggestionItemHeight: number;
    maxNumberSuggestions: number;
};

export function CompletionPopover(
    props: CompletionPopoverProps
): React.ReactElement {
    const { stateManager, suggestionsState }: SmartNodeSelectorDataContextType =
        React.useContext(SmartNodeSelectorDataContext);

    const popoverRef = React.useRef<HTMLDivElement>(null);

    const [anchorElement, setAnchorElement] =
        React.useState<HTMLElement | null>(null);

    const focusedSegment = useSubscribeToTopic(
        stateManager,
        Topic.FOCUSED_SEGMENT
    );

    const suggestions = useSubscribeToTopic(
        suggestionsState,
        CompletionsTopic.COMPLETIONS
    );

    const selectedIndex = useSubscribeToTopic(
        suggestionsState,
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
                completion.insertText
            );
            stateManager.setCaretPositionToEndOfQueryItem(
                focusedSegment.queryId
            );
            suggestionsState.clearSuggestions();
        },
        [stateManager, suggestionsState]
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
                inset: "unset",
                border: "1px solid #ccc",
                borderRadius: 4,
                backgroundColor: "white",
                boxShadow: "0 2px 8px rgba(42, 42, 42, 0.15)",
                padding: 4,
                ...(anchorElement && {
                    position: "absolute",
                    ...calculatePosition(anchorElement),
                }),
            }}
        >
            <VirtualizedList
                items={suggestions}
                itemHeight={props.suggestionItemHeight}
                maxHeight={
                    props.suggestionItemHeight * props.maxNumberSuggestions
                }
                renderItem={props.renderCompletionItem}
                onItemClick={handleItemClick}
                selectedIndex={selectedIndex}
            />
        </div>
    );
}

function calculatePosition(inputElement: HTMLElement) {
    const containerElement = inputElement.closest(
        "[data-smart-node-selector-root]"
    );
    const containerRect = containerElement?.getBoundingClientRect();
    const inputRect = inputElement.getBoundingClientRect();

    return {
        top: inputRect.bottom + window.scrollY + 4,
        left: containerRect
            ? containerRect.left + window.scrollX
            : inputRect.left + window.scrollX,
        width: containerRect?.width,
    };
}
