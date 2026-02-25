import React from "react";
import type { StateManager } from "../core/StateManager/StateManager";
import {
    getCaretOffsetFromX,
    mapTruncatedClickToFullOffset,
    type TruncationInfo,
} from "../utils/caretToCoordinateMapping";

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

                const currentCaretPositions =
                    stateManager.getQueryTextSelections();

                // Find the closest segment element
                const segmentElement = target.closest(
                    "[data-segment-index]"
                ) as HTMLElement;

                if (!segmentElement) {
                    // Clicking outside a segment should set caret to end
                    // This will trigger hasFocus=true, which will make HiddenTextarea focus
                    event.preventDefault();
                    stateManager.setTextFocusOffsetToEndOfLastItem();
                    return;
                }

                const queryId = segmentElement.getAttribute(
                    "data-segment-query-id"
                );
                const segmentIndexStr =
                    segmentElement.getAttribute("data-segment-index");

                if (!queryId || segmentIndexStr === null) {
                    event.preventDefault();
                    stateManager.setTextFocusOffsetToEndOfLastItem();
                    return;
                }

                const segmentIndex = parseInt(segmentIndexStr, 10);

                const selectionMode = stateManager.getSelectionMode();
                if (selectionMode === "query") {
                    // In query mode, clicking any segment enters segment mode
                    stateManager.enterSegmentSelection(queryId, segmentIndex);
                    event.preventDefault();
                    return;
                }
                if (selectionMode === "segment") {
                    const currentSeg = stateManager.getSegmentSelection();
                    const isActiveSegment =
                        currentSeg?.queryId === queryId &&
                        currentSeg?.focus === segmentIndex;
                    if (!isActiveSegment) {
                        // Different segment → enter segment mode for that one
                        stateManager.enterSegmentSelection(
                            queryId,
                            segmentIndex
                        );
                        event.preventDefault();
                        return;
                    }
                    // Active segment clicked → fall through to text-mode caret positioning
                }
                if (selectionMode === "text") {
                    // Clicking a segment on a different query (or no query focused) →
                    // enter segment mode rather than jumping straight to text mode
                    const focusedQueryId =
                        currentCaretPositions.length === 1
                            ? currentCaretPositions[0].queryId
                            : null;
                    if (focusedQueryId !== queryId) {
                        stateManager.enterSegmentSelection(
                            queryId,
                            segmentIndex
                        );
                        event.preventDefault();
                        return;
                    }
                    // Same query → fall through to text-mode caret positioning
                }

                // Get query item and segment text
                const queryItem = stateManager.getQueryItemById(queryId);
                if (!queryItem) return;

                const segments = stateManager.getParsedQuery(
                    queryItem.query
                )?.segments;
                if (!segments) return;

                const segment = segments[segmentIndex];

                const range = segment.charRange;
                const segmentText = queryItem.query.slice(
                    range.start,
                    range.end
                );

                // Calculate local X position relative to segment
                const rect = segmentElement.getBoundingClientRect();
                const localX = event.clientX - rect.left;

                // Check if segment is truncated
                const isTruncated =
                    segmentElement.getAttribute("data-segment-truncated") ===
                    "true";

                // Map X to character offset within the segment
                let offset: number;
                if (isTruncated) {
                    // Use special mapping for truncated segments
                    const truncationInfo: TruncationInfo = {
                        startText:
                            segmentElement.getAttribute(
                                "data-truncation-start"
                            ) ?? "",
                        hiddenText:
                            segmentElement.getAttribute(
                                "data-truncation-hidden"
                            ) ?? "",
                        endText:
                            segmentElement.getAttribute(
                                "data-truncation-end"
                            ) ?? "",
                        ellipsisText:
                            segmentElement.getAttribute(
                                "data-truncation-ellipsis"
                            ) ?? "...",
                    };
                    offset = mapTruncatedClickToFullOffset(
                        localX,
                        truncationInfo,
                        segmentElement
                    );
                } else {
                    offset = getCaretOffsetFromX(
                        localX,
                        segmentText,
                        segmentElement
                    );
                }

                const textBeforeSegment = queryItem.query.slice(0, range.start);
                offset += textBeforeSegment.length;

                let anchorOffset = offset;

                if (
                    selection &&
                    currentCaretPositions.length === 1 &&
                    currentCaretPositions[0].queryId === queryId
                ) {
                    // If there is an existing caret position in this segment, use its offset as anchor
                    anchorOffset = currentCaretPositions[0].anchor;
                }

                // Update caret position - this will trigger hasFocus change
                // which will cause HiddenTextarea to focus
                stateManager.setQueryTextSelection({
                    queryId: queryId,
                    focus: offset,
                    anchor: anchorOffset,
                });

                event.preventDefault();

                window.addEventListener("mousemove", handleMouseMove, {
                    signal: abortController.signal,
                });
                window.addEventListener("mouseup", handleMouseUp, {
                    signal: abortController.signal,
                    once: true,
                });
            }

            function handleMouseMove(event: MouseEvent) {
                if (event.buttons !== 1) return; // Only proceed if mouse button is pressed

                const currentCaretPositions =
                    stateManager.getQueryTextSelections();

                // We need an existing selection to extend from
                if (currentCaretPositions.length !== 1) {
                    return;
                }

                const currentSelection = currentCaretPositions[0];
                const queryId = currentSelection.queryId;
                const anchorOffset = currentSelection.anchor;

                // Get query item
                const queryItem = stateManager.getQueryItemById(queryId);
                if (!queryItem) return;

                // Find the query chip element using the queryId from the anchor
                const queryChipElement = ref.current?.querySelector(
                    `[data-querychip-id="${queryId}"]`
                ) as HTMLElement | null;

                if (!queryChipElement) return;

                const chipRect = queryChipElement.getBoundingClientRect();

                // Calculate offset based on x position relative to the chip
                let offset: number;

                if (event.clientX <= chipRect.left) {
                    // Cursor is at or to the left of the chip - select to start
                    offset = 0;
                } else if (event.clientX >= chipRect.right) {
                    // Cursor is at or to the right of the chip - select to end
                    offset = queryItem.query.length;
                } else {
                    // Cursor is within the chip - find the segment under the cursor
                    const target = event.target as HTMLElement;
                    const segmentElement = target.closest(
                        "[data-segment-index]"
                    ) as HTMLElement;

                    if (!segmentElement) {
                        return;
                    }

                    const segmentQueryId = segmentElement.getAttribute(
                        "data-segment-query-id"
                    );
                    const segmentIndexStr =
                        segmentElement.getAttribute("data-segment-index");

                    // Only process if we're still in the same query
                    if (
                        segmentQueryId !== queryId ||
                        segmentIndexStr === null
                    ) {
                        return;
                    }

                    const segmentIndex = parseInt(segmentIndexStr, 10);

                    const segments = stateManager.getParsedQuery(
                        queryItem.query
                    )?.segments;
                    if (!segments) return;

                    const segment = segments[segmentIndex];
                    const range = segment.charRange;
                    const segmentText = queryItem.query.slice(
                        range.start,
                        range.end
                    );

                    // Calculate local X position relative to segment
                    const rect = segmentElement.getBoundingClientRect();
                    const localX = event.clientX - rect.left;

                    // Check if segment is truncated
                    const isTruncated =
                        segmentElement.getAttribute(
                            "data-segment-truncated"
                        ) === "true";

                    // Map X to character offset within the segment
                    if (isTruncated) {
                        // Use special mapping for truncated segments
                        const truncationInfo: TruncationInfo = {
                            startText:
                                segmentElement.getAttribute(
                                    "data-truncation-start"
                                ) ?? "",
                            hiddenText:
                                segmentElement.getAttribute(
                                    "data-truncation-hidden"
                                ) ?? "",
                            endText:
                                segmentElement.getAttribute(
                                    "data-truncation-end"
                                ) ?? "",
                            ellipsisText:
                                segmentElement.getAttribute(
                                    "data-truncation-ellipsis"
                                ) ?? "...",
                        };
                        offset = mapTruncatedClickToFullOffset(
                            localX,
                            truncationInfo,
                            segmentElement
                        );
                    } else {
                        offset = getCaretOffsetFromX(
                            localX,
                            segmentText,
                            segmentElement
                        );
                    }

                    // Convert segment-local offset to query-global offset
                    const textBeforeSegment = queryItem.query.slice(
                        0,
                        range.start
                    );
                    offset += textBeforeSegment.length;
                }

                // Update caret position with the anchor preserved
                stateManager.setQueryTextSelection({
                    queryId: queryId,
                    focus: offset,
                    anchor: anchorOffset,
                });

                event.preventDefault();
            }

            function handleMouseUp() {
                window.removeEventListener("mousemove", handleMouseMove);
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
