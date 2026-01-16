import type {
    QueryItemUpdate,
    QueryTextSelection,
    Segment,
    StatePatch,
} from "./types";

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
            if (!selecting && sel.anchor !== sel.focus) {
                newTextSelections.push({
                    queryId: sel.queryId,
                    focus: sel.focus,
                    anchor: sel.focus,
                });
                continue;
            }

            // Check for boundary conditions
            const newFocusOffset = sel.focus + dx;

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
                        focus: 0,
                        anchor: selecting ? sel.anchor : 0,
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
                        focus: queryLength,
                        anchor: selecting ? sel.anchor : queryLength,
                    });
                    continue;
                }
            }

            newTextSelections.push({
                queryId: sel.queryId,
                focus: newFocusOffset,
                anchor: selecting ? sel.anchor : newFocusOffset,
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
                sel.focus
            );

            if (segment === null) {
                // If no segment found, drop
                continue;
            }

            const newFocusOffset =
                where === "start" ? segment.startOffset : segment.endOffset;

            newTextSelections.push({
                queryId: sel.queryId,
                focus: newFocusOffset,
                anchor: selecting ? sel.anchor : newFocusOffset,
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

        const isSingleSelection = snapshot.queryTextSelections.length === 1;

        const newTextSelections: QueryTextSelection[] = [];
        const queryItemUpdates: QueryItemUpdate[] = [];

        for (const sel of snapshot.queryTextSelections) {
            const queryText = snapshot.getQueryTextById(sel.queryId);
            if (queryText == null) {
                continue;
            }

            // At start of query with backward delete - nothing to do
            if (
                sel.focus === 0 &&
                sel.anchor === 0 &&
                direction === "backward"
            ) {
                if (isSingleSelection) {
                    return {
                        kind: "hitBoundary",
                        boundary: "start",
                        queryId: sel.queryId,
                    };
                }
                newTextSelections.push(sel);
                continue;
            }

            // At end of query with forward delete - nothing to do
            if (
                sel.focus === queryText.length &&
                sel.anchor === queryText.length &&
                direction === "forward"
            ) {
                if (isSingleSelection) {
                    return {
                        kind: "hitBoundary",
                        boundary: "end",
                        queryId: sel.queryId,
                    };
                }
                newTextSelections.push(sel);
                continue;
            }

            // If there's a selection, delete the selected text
            if (sel.anchor !== sel.focus) {
                const start = Math.min(sel.focus, sel.anchor);
                const end = Math.max(sel.focus, sel.anchor);
                const newQuery =
                    queryText.slice(0, start) + queryText.slice(end);

                queryItemUpdates.push({
                    kind: "update",
                    item: { id: sel.queryId, query: newQuery },
                });
                newTextSelections.push({
                    queryId: sel.queryId,
                    focus: start,
                    anchor: start,
                });
                continue;
            }

            // Delete a single character
            const deleteOffset =
                direction === "backward" ? sel.focus - 1 : sel.focus;
            const newQuery =
                queryText.slice(0, deleteOffset) +
                queryText.slice(deleteOffset + 1);
            const newOffset =
                direction === "backward" ? sel.focus - 1 : sel.focus;

            queryItemUpdates.push({
                kind: "update",
                item: { id: sel.queryId, query: newQuery },
            });
            newTextSelections.push({
                queryId: sel.queryId,
                focus: newOffset,
                anchor: newOffset,
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
        const queryItemUpdates: QueryItemUpdate[] = [];

        for (const sel of snapshot.queryTextSelections) {
            const queryText = snapshot.getQueryTextById(sel.queryId);
            if (queryText == null) {
                continue;
            }

            const start = Math.min(sel.focus, sel.anchor);
            const end = Math.max(sel.focus, sel.anchor);

            const before = queryText.slice(0, start);
            const after = queryText.slice(end);
            const newQuery = before + text + after;

            queryItemUpdates.push({
                kind: "update",
                item: { id: sel.queryId, query: newQuery },
            });

            const newOffset = start + text.length;
            newTextSelections.push({
                queryId: sel.queryId,
                focus: newOffset,
                anchor: newOffset,
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
