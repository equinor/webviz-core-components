import React from "react";
import type { StateManager } from "../core/StateManager";
import { getCaretOffsetFromX } from "../utils/caretToCoordinateMapping";

export function useMouseEventHandler(
    ref: React.RefObject<HTMLElement>,
    stateManager: StateManager
): void {
    React.useEffect(
        function setupMouseEventHandler() {
            const abortController = new AbortController();

            function handleMouseDown(event: MouseEvent) {
                const target = event.target as HTMLElement;
                const selection = event.shiftKey;

                const currentCaretPositions = stateManager.getCaretPositions();

                // Find the closest query chip element
                const chipElement = target.closest(
                    "[data-querychip-id]"
                ) as HTMLElement;
                if (!chipElement) {
                    // Clicking outside a chip should set caret to end
                    // This will trigger hasFocus=true, which will make HiddenTextarea focus
                    event.preventDefault();
                    stateManager.setCaretPositionToEndOfLastItem();
                    return;
                }

                const queryId = chipElement.getAttribute("data-querychip-id");
                if (!queryId) {
                    event.preventDefault();
                    stateManager.setCaretPositionToEndOfLastItem();
                    return;
                }

                // Find the content element
                const contentElement = chipElement.querySelector(
                    "[data-query-chip-content]"
                ) as HTMLElement;
                if (!contentElement) return;

                // Calculate local X position
                const rect = contentElement.getBoundingClientRect();
                const localX = event.clientX - rect.left;

                // Get query text
                const queryItem = stateManager.getQueryItemById(queryId);
                if (!queryItem) return;

                // Map X to character offset
                let offset = getCaretOffsetFromX(
                    localX,
                    queryItem.query,
                    contentElement
                );

                let anchorOffset = offset;

                if (
                    selection &&
                    currentCaretPositions.length === 1 &&
                    currentCaretPositions[0].queryId === queryId
                ) {
                    // If there is an existing caret position in this chip, use its offset as anchor
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
        [ref, stateManager]
    );
}
