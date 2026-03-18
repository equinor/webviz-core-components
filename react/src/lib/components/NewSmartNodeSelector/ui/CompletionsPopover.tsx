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

    const sessionState = useSubscribeToTopic(
        completionsState,
        CompletionsTopic.SESSION_STATE
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

    const completionsPopoverFocused = useSubscribeToTopic(
        stateManager,
        Topic.COMPLETIONS_POPOVER_FOCUSED
    );

    React.useEffect(
        function onFocusedAddressChange() {
            if (focusedSegment === null) {
                // When the popover has focus, focusedSegment can transiently
                // become null mid-state-transition (e.g. segment mode moving
                // between segments calls clearQueryTextSelections internally).
                // Hiding the popover in that case moves DOM focus away and
                // breaks the focus chain. Only hide when the popover is not
                // focused, or when the state has genuinely settled to null.
                if (!completionsPopoverFocused) {
                    popoverRef.current?.hidePopover();
                    setAnchorElement(null);
                }
                return;
            }

            const inputElement = props.mainRef.current?.querySelector(
                `[data-querychip-id="${focusedSegment.queryId}"]`
            ) as HTMLElement | null;
            if (inputElement) {
                setAnchorElement(inputElement);
                // showPopover throws InvalidStateError in Chrome 120+ when
                // already showing (e.g. after a caret move that creates a new
                // focusedSegment object with the same values). Ignore safely.
                try {
                    popoverRef.current?.showPopover();
                } catch {
                    // already showing – no-op
                }
            } else {
                popoverRef.current?.hidePopover();
                setAnchorElement(null);
            }
        },
        [focusedSegment, props.mainRef, completionsPopoverFocused]
    );

    React.useEffect(
        function focusPopoverWhenActive() {
            if (completionsPopoverFocused) {
                popoverRef.current?.focus({ preventScroll: true });
                completionsState.focusStrategy();
            }
        },
        [completionsPopoverFocused, completionsState]
    );

    const strategy = completionsState.getStrategy();
    const StrategyComponent = strategy.component;

    const handleAccept = React.useCallback(
        function handleAccept() {
            const appliedCompletion = completionsState.getAppliedCompletion();
            if (!appliedCompletion) {
                return;
            }

            stateManager.applyFocusedCompletion(
                appliedCompletion.text,
                appliedCompletion.range,
                appliedCompletion.moveFocus
            );
            stateManager.setCompletionsPopoverFocused(false);
        },
        [completionsState, stateManager]
    );

    const handleClose = React.useCallback(
        function handleClose() {
            stateManager.setCompletionsPopoverFocused(false);
        },
        [stateManager]
    );

    const handleSetState = React.useCallback(
        function handleSetState(updater: any) {
            if (typeof updater === "function") {
                completionsState.updateSessionState(updater);
            } else {
                completionsState.setSessionState(updater);
            }
        },
        [completionsState]
    );

    const handleKeyDown = React.useCallback(
        function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
            if (sessionState === null) {
                return;
            }

            // Arrow left/right move the caret in the editor while keeping the
            // popover focused so the user can keep navigating completions.
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                stateManager.moveFocus(
                    e.key === "ArrowLeft" ? -1 : 1,
                    e.shiftKey,
                    false
                );
                e.preventDefault();
                return;
            }

            const result = strategy.onKeyDown(e, {
                state: sessionState,
                completions,
                caretContext,
                queryContext: completionsState.getQueryContext(),
                delimiter: completionsState.getDelimiter(),
                selectionMode: completionsState.getSelectionMode(),
                currentSegmentSelections:
                    completionsState.getCurrentSegmentSelections(),
            });

            if (result.nextState !== undefined) {
                completionsState.setSessionState(result.nextState);
            }

            if (result.accept) {
                handleAccept();
            }

            if (result.close) {
                handleClose();
            }

            if (result.focusEditor) {
                stateManager.setCompletionsPopoverFocused(false);
            }

            if (
                result.nextState !== undefined ||
                result.accept ||
                result.close ||
                result.focusEditor
            ) {
                e.preventDefault();
            }
        },
        [
            strategy,
            sessionState,
            completions,
            caretContext,
            completionsState,
            handleAccept,
            handleClose,
            stateManager,
        ]
    );

    const segmentSelections = focusedSegment?.queryId
        ? stateManager.getMatchedNodesForQuerySegment(
              focusedSegment.queryId,
              focusedSegment.segmentIndex
          )?.matches
        : [];

    const shouldRenderStrategy = sessionState !== null;

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
            {shouldRenderStrategy && (
                <StrategyComponent
                    state={sessionState}
                    completions={completions}
                    caretContext={caretContext}
                    queryContext={completionsState.getQueryContext()}
                    delimiter={completionsState.getDelimiter()}
                    maxContainerHeight={maxHeight}
                    currentSegmentSelections={Array.from(
                        segmentSelections ?? []
                    )}
                    setState={handleSetState}
                    accept={handleAccept}
                    close={handleClose}
                    selectionMode={completionsState.getSelectionMode()}
                />
            )}
        </div>
    );
}
