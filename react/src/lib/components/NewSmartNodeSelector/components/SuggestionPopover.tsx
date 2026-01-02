import React from "react";

import {
    SmartNodeSelectorDataContext,
    type SmartNodeSelectorDataContextType,
} from "../SmartNodeSelector";
import { useSuggestions } from "../hooks/useSuggestions";
import { VirtualizedList } from "./VirtualizedList";
import type { Suggestion } from "../core/types/Suggestion";
import { ActionType } from "../state/actions";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { Topic } from "../core/StateManager";

export type SuggestionPopoverProps = {
    renderSuggestionItem: (suggestion: Suggestion) => React.ReactNode;
    suggestionItemHeight: number;
    maxNumberSuggestions: number;
};

export function SuggestionPopover(
    props: SuggestionPopoverProps
): React.ReactElement {
    const { stateManager }: SmartNodeSelectorDataContextType = React.useContext(
        SmartNodeSelectorDataContext
    );

    const popoverRef = React.useRef<HTMLDivElement>(null);

    const [anchorElement, setAnchorElement] =
        React.useState<HTMLElement | null>(null);

    const focusedSegment = useSubscribeToTopic(
        stateManager,
        Topic.FOCUSED_SEGMENT
    );

    const suggestions = useSuggestions(focusedSegment);

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

    const handleItemClick = React.useCallback(function handleItemClick(
        suggestion: Suggestion
    ) {}, []);

    return (
        <div
            ref={popoverRef}
            popover="manual"
            data-suggestion-popover
            style={{
                boxSizing: "border-box" as const,
                inset: "unset",
                border: "1px solid #ccc",
                borderRadius: 4,
                backgroundColor: "white",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
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
                renderItem={props.renderSuggestionItem}
                onItemClick={handleItemClick}
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
