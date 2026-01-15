import type { QueryTextSelection, Segment, StatePatch } from "./types";

export type TextFocusMoveResult =
    | {
          kind: "moved";
          patch: StatePatch;
      }
    | {
          kind: "hitBoundary";
          boundary: "start" | "end";
          queryId: string;
      }
    | {
          kind: "none";
      };

export type QueryTextSelectionsDelegateSnapshot = {
    queryTextSelections: QueryTextSelection[];
    getQueryLengthById(queryId: string): number | null;
    getQueryTextById(queryId: string): string | null;
    getSegmentForTextOffset(queryId: string, offset: number): Segment | null;
};

export class QueryTextSelectionsDelegate {
    moveFocusOffset(
        snapshot: QueryTextSelectionsDelegateSnapshot,
        payload: {
            dx: number;
            selecting: boolean;
        }
    ): TextFocusMoveResult {
        const { dx, selecting } = payload;
        const singleSelection = snapshot.queryTextSelections.length === 1;

        const newTextSelections: QueryTextSelection[] = [];
        for (const sel of snapshot.queryTextSelections) {
            const queryLength = snapshot.getQueryLengthById(sel.queryId);
            if (queryLength == null) {
                // If ID is invalid, keep as-is (or drop / normalize)
                newTextSelections.push(sel);
                continue;
            }

            // Check if we have selections to collapse
            if (!selecting && sel.anchorOffset !== sel.focusOffset) {
                newTextSelections.push({
                    queryId: sel.queryId,
                    focusOffset: sel.focusOffset,
                    anchorOffset: sel.focusOffset,
                });
                continue;
            }

            // Check for boundary conditions
            const newFocusOffset = sel.focusOffset + dx;

            if (newFocusOffset < 0) {
                if (singleSelection) {
                    return {
                        kind: "hitBoundary",
                        boundary: "start",
                        queryId: sel.queryId,
                    };
                } else {
                    newTextSelections.push({
                        queryId: sel.queryId,
                        focusOffset: 0,
                        anchorOffset: selecting ? sel.anchorOffset : 0,
                    });
                    continue;
                }
            }

            if (newFocusOffset > queryLength) {
                if (singleSelection) {
                    return {
                        kind: "hitBoundary",
                        boundary: "end",
                        queryId: sel.queryId,
                    };
                } else {
                    newTextSelections.push({
                        queryId: sel.queryId,
                        focusOffset: queryLength,
                        anchorOffset: selecting
                            ? sel.anchorOffset
                            : queryLength,
                    });
                    continue;
                }
            }

            newTextSelections.push({
                queryId: sel.queryId,
                focusOffset: newFocusOffset,
                anchorOffset: selecting ? sel.anchorOffset : newFocusOffset,
            });
        }

        return {
            kind: "moved",
            patch: {
                textSelections: newTextSelections,
            },
        };
    }

    setFocusOffsetToBoundaryOfSegment(
        snapshot: QueryTextSelectionsDelegateSnapshot,
        payload: {
            where: "start" | "end";
            selecting: boolean;
        }
    ): TextFocusMoveResult {
        const { where, selecting } = payload;

        const newTextSelections: QueryTextSelection[] = [];
        for (const sel of snapshot.queryTextSelections) {
            const queryLength = snapshot.getQueryLengthById(sel.queryId);
            if (queryLength == null) {
                // If ID is invalid, drop
                continue;
            }

            const segment = snapshot.getSegmentForTextOffset(
                sel.queryId,
                sel.focusOffset
            );

            if (segment === null) {
                // If no segment found, drop
                continue;
            }

            const newFocusOffset =
                where === "start" ? segment.startOffset : segment.endOffset;

            newTextSelections.push({
                queryId: sel.queryId,
                focusOffset: newFocusOffset,
                anchorOffset: selecting ? sel.anchorOffset : newFocusOffset,
            });
        }
        return {
            kind: "moved",
            patch: {
                textSelections: newTextSelections,
            },
        };
    }

    removeAtFocusOffset(
        snapshot: QueryTextSelectionsDelegateSnapshot,
        payload: {
            direction: "backward" | "forward";
        }
    ): TextFocusMoveResult {
        const { direction } = payload;

        const newTextSelections: QueryTextSelection[] = [];
        const queryItemUpdates: { id: string; query: string }[] = [];

        for (const sel of snapshot.queryTextSelections) {
            const queryText = snapshot.getQueryTextById(sel.queryId);
            if (queryText == null) {
                continue;
            }

            // At start of query with backward delete - nothing to do
            if (sel.focusOffset === 0 && sel.anchorOffset === 0 && direction === "backward") {
                newTextSelections.push(sel);
                continue;
            }

            // At end of query with forward delete - nothing to do
            if (sel.focusOffset === queryText.length && sel.anchorOffset === queryText.length && direction === "forward") {
                newTextSelections.push(sel);
                continue;
            }

            // If there's a selection, delete the selected text
            if (sel.anchorOffset !== sel.focusOffset) {
                const start = Math.min(sel.focusOffset, sel.anchorOffset);
                const end = Math.max(sel.focusOffset, sel.anchorOffset);
                const newQuery = queryText.slice(0, start) + queryText.slice(end);

                queryItemUpdates.push({ id: sel.queryId, query: newQuery });
                newTextSelections.push({
                    queryId: sel.queryId,
                    focusOffset: start,
                    anchorOffset: start,
                });
                continue;
            }

            // Delete a single character
            const deleteOffset = direction === "backward" ? sel.focusOffset - 1 : sel.focusOffset;
            const newQuery = queryText.slice(0, deleteOffset) + queryText.slice(deleteOffset + 1);
            const newOffset = direction === "backward" ? sel.focusOffset - 1 : sel.focusOffset;

            queryItemUpdates.push({ id: sel.queryId, query: newQuery });
            newTextSelections.push({
                queryId: sel.queryId,
                focusOffset: newOffset,
                anchorOffset: newOffset,
            });
        }

        return {
            kind: "moved",
            patch: {
                textSelections: newTextSelections,
                queryItemUpdates,
            },
        };
    }

    insertAtFocusOffset(
        snapshot: QueryTextSelectionsDelegateSnapshot,
        payload: {
            text: string;
        }
    ): TextFocusMoveResult {
        const { text } = payload;

        const newTextSelections: QueryTextSelection[] = [];
        const queryItemUpdates: { id: string; query: string }[] = [];

        for (const sel of snapshot.queryTextSelections) {
            const queryText = snapshot.getQueryTextById(sel.queryId);
            if (queryText == null) {
                continue;
            }

            const start = Math.min(sel.focusOffset, sel.anchorOffset);
            const end = Math.max(sel.focusOffset, sel.anchorOffset);

            const before = queryText.slice(0, start);
            const after = queryText.slice(end);
            const newQuery = before + text + after;

            queryItemUpdates.push({ id: sel.queryId, query: newQuery });

            const newOffset = start + text.length;
            newTextSelections.push({
                queryId: sel.queryId,
                focusOffset: newOffset,
                anchorOffset: newOffset,
            });
        }

        return {
            kind: "moved",
            patch: {
                textSelections: newTextSelections,
                queryItemUpdates,
            },
        };
    }
}
