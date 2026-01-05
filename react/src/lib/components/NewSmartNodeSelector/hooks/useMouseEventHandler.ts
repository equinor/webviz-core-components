import React from "react";
import { getCaretOffsetFromX } from "../utils/caretToCoordinateMapping";
import type { StateManager } from "../core/StateManager";

export function useMouseEventHandler(
    ref: React.RefObject<HTMLElement>,
    stateManager: StateManager,
    delimiter: string
): void {
    React.useEffect(
        function setupMouseEventHandler() {
            const abortController = new AbortController();

            function handleMouseDown(event: MouseEvent) {
                const target = event.target as HTMLElement;
                const selection = event.shiftKey;

                const currentCaretPositions = stateManager.getCaretPositions();

                // Find the closest segment element
                const segmentElement = target.closest(
                    "[data-segment-index]"
                ) as HTMLElement;

                if (!segmentElement) {
                    // Clicking outside a segment should set caret to end
                    // This will trigger hasFocus=true, which will make HiddenTextarea focus
                    event.preventDefault();
                    stateManager.setCaretPositionToEndOfLastItem();
                    return;
                }

                const queryId = segmentElement.getAttribute(
                    "data-segment-query-id"
                );
                const segmentIndexStr =
                    segmentElement.getAttribute("data-segment-index");

                if (!queryId || segmentIndexStr === null) {
                    event.preventDefault();
                    stateManager.setCaretPositionToEndOfLastItem();
                    return;
                }

                const segmentIndex = parseInt(segmentIndexStr, 10);

                // Get query item and segment text
                const queryItem = stateManager.getQueryItemById(queryId);
                if (!queryItem) return;

                const segments = queryItem.query.split(delimiter);
                const segmentText = segments[segmentIndex] ?? "";

                // Calculate local X position relative to segment
                const rect = segmentElement.getBoundingClientRect();
                const localX = event.clientX - rect.left;

                // Map X to character offset within the segment
                let offset = getCaretOffsetFromX(
                    localX,
                    segmentText,
                    segmentElement
                );

                let anchorOffset = offset;

                if (
                    selection &&
                    currentCaretPositions.length === 1 &&
                    currentCaretPositions[0].queryId === queryId
                ) {
                    // If there is an existing caret position in this segment, use its offset as anchor
                    anchorOffset = currentCaretPositions[0].anchorOffset;
                }

                // Update caret position - this will trigger hasFocus change
                // which will cause HiddenTextarea to focus
                stateManager.setCaretPosition({
                    queryId: queryId,
                    offset: offset,
                    anchorOffset: anchorOffset,
                });

                event.preventDefault();
            }

            ref.current?.addEventListener("mousedown", handleMouseDown, {
                signal: abortController.signal,
            });

            return function cleanup() {
                abortController.abort();
            };
        },
        [ref, stateManager, delimiter]
    );
}
