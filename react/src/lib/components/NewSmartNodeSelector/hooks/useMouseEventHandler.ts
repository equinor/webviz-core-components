import React from "react";
import {
    getCaretOffsetFromX,
    mapTruncatedClickToFullOffset,
    type TruncationInfo,
} from "../utils/caretToCoordinateMapping";
import type { StateManager } from "../core/StateManager/StateManager";

export function useMouseEventHandler(
    ref: React.RefObject<HTMLElement>,
    stateManager: StateManager,
    delimiter: string
): void {
    React.useEffect(
        function setupMouseEventHandler() {
            const abortController = new AbortController();

            function handleMouseDown(event: MouseEvent) {
                if (event.button !== 0) return; // Only proceed for left mouse button

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

                // Check if segment is truncated
                const isTruncated =
                    segmentElement.getAttribute("data-segment-truncated") === "true";

                // Map X to character offset within the segment
                let offset: number;
                if (isTruncated) {
                    // Use special mapping for truncated segments
                    const truncationInfo: TruncationInfo = {
                        startText:
                            segmentElement.getAttribute("data-truncation-start") ?? "",
                        hiddenText:
                            segmentElement.getAttribute("data-truncation-hidden") ??
                            "",
                        endText:
                            segmentElement.getAttribute("data-truncation-end") ?? "",
                        ellipsisText:
                            segmentElement.getAttribute("data-truncation-ellipsis") ??
                            "...",
                    };
                    offset = mapTruncatedClickToFullOffset(
                        localX,
                        truncationInfo,
                        segmentElement
                    );
                } else {
                    offset = getCaretOffsetFromX(localX, segmentText, segmentElement);
                }

                const textBeforeSegment = segments
                    .slice(0, segmentIndex)
                    .join(delimiter);

                offset += textBeforeSegment.length;
                if (segmentIndex > 0) {
                    // Account for delimiter length
                    offset += delimiter.length;
                }

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

            function handleMouseMove(event: MouseEvent) {
                if (event.buttons !== 1) return; // Only proceed if mouse button is pressed

                const target = event.target as HTMLElement;

                const currentCaretPositions = stateManager.getCaretPositions();

                // Find the closest segment element
                const segmentElement = target.closest(
                    "[data-segment-index]"
                ) as HTMLElement;

                if (!segmentElement) {
                    return;
                }
                const queryId = segmentElement.getAttribute(
                    "data-segment-query-id"
                );
                const segmentIndexStr =
                    segmentElement.getAttribute("data-segment-index");

                if (!queryId || segmentIndexStr === null) {
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

                // Check if segment is truncated
                const isTruncated =
                    segmentElement.getAttribute("data-segment-truncated") === "true";

                // Map X to character offset within the segment
                let offset: number;
                if (isTruncated) {
                    // Use special mapping for truncated segments
                    const truncationInfo: TruncationInfo = {
                        startText:
                            segmentElement.getAttribute("data-truncation-start") ?? "",
                        hiddenText:
                            segmentElement.getAttribute("data-truncation-hidden") ??
                            "",
                        endText:
                            segmentElement.getAttribute("data-truncation-end") ?? "",
                        ellipsisText:
                            segmentElement.getAttribute("data-truncation-ellipsis") ??
                            "...",
                    };
                    offset = Math.max(
                        0,
                        Math.min(
                            segmentText.length,
                            mapTruncatedClickToFullOffset(
                                localX,
                                truncationInfo,
                                segmentElement
                            )
                        )
                    );
                } else {
                    offset = Math.max(
                        0,
                        Math.min(
                            segmentText.length,
                            getCaretOffsetFromX(localX, segmentText, segmentElement)
                        )
                    );
                }

                const textBeforeSegment = segments
                    .slice(0, segmentIndex)
                    .join(delimiter);

                offset += textBeforeSegment.length;
                if (segmentIndex > 0) {
                    // Account for delimiter length
                    offset += delimiter.length;
                }

                let anchorOffset = offset;

                if (
                    currentCaretPositions.length === 1 &&
                    currentCaretPositions[0].queryId === queryId
                ) {
                    // If there is an existing caret position in this segment, use its offset as anchor
                    anchorOffset = currentCaretPositions[0].anchorOffset;
                }

                // Update caret position
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
            ref.current?.addEventListener("mousemove", handleMouseMove, {
                signal: abortController.signal,
            });

            return function cleanup() {
                abortController.abort();
            };
        },
        [ref, stateManager, delimiter]
    );
}
