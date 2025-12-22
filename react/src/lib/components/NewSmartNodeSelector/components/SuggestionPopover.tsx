import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { useSuggestions } from "../hooks/useSuggestions";
import { VirtualizedList } from "./VirtualizedList";
import type { Suggestion } from "../core/types/Suggestion";
import { ActionType } from "../state/actions";

export type SuggestionPopoverProps = {
    renderSuggestionItem: (suggestion: Suggestion) => React.ReactNode;
    suggestionItemHeight: number;
    maxNumberSuggestions: number;
};

export function SuggestionPopover(
    props: SuggestionPopoverProps
): React.ReactElement {
    const context = React.useContext(SmartNodeSelectorDataContext);

    const popoverRef = React.useRef<HTMLDivElement>(null);

    const suggestions = useSuggestions();

    const [anchorElement, setAnchorElement] =
        React.useState<HTMLElement | null>(null);

    React.useEffect(
        function onFocusedAddressChange() {
            if (context.state.focusedAddress === null) {
                popoverRef.current?.hidePopover();
                setAnchorElement(null);
                return;
            }

            const inputElement = document.querySelector(
                `[data-tag-id="${context.state.focusedAddress.tagId}"]` +
                    `[data-segment-index="${context.state.focusedAddress.segmentIndex}"]`
            ) as HTMLElement | null;
            if (inputElement) {
                setAnchorElement(inputElement);
                popoverRef.current?.showPopover();
            } else {
                popoverRef.current?.hidePopover();
                setAnchorElement(null);
            }
        },
        [context.state.focusedAddress]
    );

    const handleItemClick = React.useCallback(function handleItemClick(
        suggestion: Suggestion
    ) {
        context.dispatch({
            type: ActionType.APPLY_SUGGESTION,
            payload: {
                suggestion,
            },
        });
    }, [context.dispatch]);

    return (
        <div
            ref={popoverRef}
            popover="manual"
            data-suggestion-popover
            style={{
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
                maxHeight={props.suggestionItemHeight * props.maxNumberSuggestions}
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
