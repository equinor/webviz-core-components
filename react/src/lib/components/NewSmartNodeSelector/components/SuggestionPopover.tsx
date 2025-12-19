import React from "react";
import { SmartNodeSelectorContext } from "../SmartNodeSelector";
import { useSuggestions } from "../hooks/useSuggestions";
import { VirtualizedList } from "./VirtualizedList";
import type { Suggestion } from "../core/types/Suggestion";

export type SuggestionPopoverProps = {
    renderSuggestionItem: (suggestion: Suggestion) => React.ReactNode;
};

export function SuggestionPopover(
    props: SuggestionPopoverProps
): React.ReactElement {
    const context = React.useContext(SmartNodeSelectorContext);

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

    return (
        <div
            ref={popoverRef}
            popover="auto"
            style={{
                inset: "unset",
                border: "1px solid #ccc",
                borderRadius: 4,
                backgroundColor: "white",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                padding: 8,
                ...(anchorElement && {
                    position: "absolute",
                    ...calculatePosition(anchorElement),
                }),
            }}
        >
            <VirtualizedList
                items={suggestions}
                itemHeight={30}
                maxHeight={200}
                renderItem={props.renderSuggestionItem}
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
