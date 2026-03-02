import React from "react";

import { CompletionsTopic } from "../core/CompletionsState";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { Topic } from "../core/StateManager/StateManager";
import { useElementBoundingRect } from "../hooks/useElementBoundingRect";
import {
    SmartNodeSelectorDataContext,
    type SmartNodeSelectorDataContextType,
} from "../SmartNodeSelector";

export type CompletionsPopoverProps = {
    mainRef: React.RefObject<HTMLDivElement>;
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

    const completions = useSubscribeToTopic(
        completionsState,
        CompletionsTopic.COMPLETIONS
    );

    const selectedIndex = useSubscribeToTopic(
        completionsState,
        CompletionsTopic.SELECTED_INDEX
    );

    const caretContext = useSubscribeToTopic(
        completionsState,
        CompletionsTopic.CARET_CONTEXT
    );

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

    React.useEffect(
        function onFocusedAddressChange() {
            if (focusedSegment === null) {
                popoverRef.current?.hidePopover();
                setAnchorElement(null);
                return;
            }

            const inputElement = props.mainRef.current?.querySelector(
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
        [focusedSegment, props.mainRef]
    );

    const completionsPopoverFocused = useSubscribeToTopic(
        stateManager,
        Topic.COMPLETIONS_POPOVER_FOCUSED
    );

    React.useEffect(
        function focusPopoverWhenActive() {
            if (completionsPopoverFocused) {
                popoverRef.current?.focus({ preventScroll: true });
            }
        },
        [completionsPopoverFocused]
    );

    const CompletionsComponent = completionsState.getComponent();

    const handleSelectCompletion = React.useCallback(
        function handleSelectCompletion(completionIndex: number) {
            completionsState.setSelectedIndex(completionIndex);
            const selectedCompletion = completionsState.getSelectedCompletion();
            if (!selectedCompletion) {
                return;
            }
            const { text, range } = selectedCompletion;
            stateManager.updateFocusedQueryItem(text, range);
        },
        [stateManager, completionsState]
    );

    const handleKeyDown = React.useCallback(
        function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
            switch (e.key) {
                case "ArrowDown":
                    completionsState.selectNext();
                    e.preventDefault();
                    break;
                case "ArrowUp":
                    completionsState.selectPrevious();
                    e.preventDefault();
                    break;
                case "Enter": {
                    const selected = completionsState.getSelectedCompletion();
                    if (selected) {
                        stateManager.updateFocusedQueryItem(
                            selected.text,
                            selected.range
                        );
                    }
                    stateManager.setCompletionsPopoverFocused(false);
                    e.preventDefault();
                    break;
                }
                case "Escape":
                case "Tab":
                    stateManager.setCompletionsPopoverFocused(false);
                    e.preventDefault();
                    break;
            }
        },
        [stateManager, completionsState]
    );

    return (
        <div
            ref={popoverRef}
            popover="manual"
            data-completion-popover
            tabIndex={-1}
            onMouseDown={(e) => {
                // Prevent mousedown from causing textarea to lose focus
                e.preventDefault();
            }}
            onFocus={() => {
                stateManager.setCompletionsPopoverFocused(true);
            }}
            onBlur={(e) => {
                // Only clear when focus leaves the popover entirely
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    stateManager.setCompletionsPopoverFocused(false);
                }
            }}
            onKeyDown={handleKeyDown}
            style={{
                boxSizing: "border-box" as const,
                border: "1px solid #ccc",
                borderRadius: 4,
                backgroundColor: "white",
                boxShadow: "0 2px 8px rgba(42, 42, 42, 0.15)",
                inset: "unset",
            }}
        >
            <CompletionsComponent
                completions={completions}
                maxContainerHeight={maxHeight}
                selectedIndex={selectedIndex}
                onSelectCompletion={handleSelectCompletion}
                caretContext={caretContext}
            />
        </div>
    );
}
