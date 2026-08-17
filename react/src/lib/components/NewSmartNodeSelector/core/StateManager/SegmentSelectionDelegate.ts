import type { ParsedQuery } from "../query-language/parse";
import type { QueryItem, SegmentSelection, StatePatch } from "./types";

export type SegmentFocusMoveResult =
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

export type SegmentSelectionDelegateSnapshot = {
    segmentSelection: SegmentSelection | null;
    getQueryById(id: string): QueryItem | null;
    getQueryIndexById(id: string): number;
    getParsedQuery(query: string): ParsedQuery | null;
    getSegmentSiblings(queryId: string, segmentIndex: number): string[];
};

export class SegmentSelectionDelegate {
    moveFocus(
        snapshot: SegmentSelectionDelegateSnapshot,
        payload: { dx: number; selecting: boolean }
    ): SegmentFocusMoveResult {
        const { dx, selecting } = payload;

        const { segmentSelection } = snapshot;
        if (!segmentSelection) {
            return { kind: "none" };
        }

        const { queryId, focus: segmentIndex } = segmentSelection;
        const queryItem = snapshot.getQueryById(queryId);
        if (!queryItem) {
            return { kind: "none" };
        }

        const parsedQuery = snapshot.getParsedQuery(queryItem.query);
        const segmentCount = parsedQuery?.segments.length ?? 1;
        let newIndex = segmentIndex + dx;

        if (newIndex < 0) {
            newIndex = 0;
            if (!selecting) {
                return {
                    kind: "hitBoundary",
                    boundary: "start",
                    queryId,
                };
            }
        } else if (newIndex >= segmentCount) {
            newIndex = segmentCount - 1;
            if (!selecting) {
                return {
                    kind: "hitBoundary",
                    boundary: "end",
                    queryId,
                };
            }
        }

        const newSelection: SegmentSelection = {
            queryId,
            anchor: selecting ? segmentSelection.anchor : newIndex,
            focus: newIndex,
        };

        return {
            kind: "moved",
            patch: {
                segmentSelection: newSelection,
            },
        };
    }

    cycleSibling(
        snapshot: SegmentSelectionDelegateSnapshot,
        payload: { direction: 1 | -1 }
    ): SegmentFocusMoveResult {
        const { segmentSelection } = snapshot;
        if (!segmentSelection) {
            return { kind: "none" };
        }

        const { queryId, focus: segmentIndex } = segmentSelection;
        const queryItem = snapshot.getQueryById(queryId);
        if (!queryItem) {
            return { kind: "none" };
        }

        const parsedQuery = snapshot.getParsedQuery(queryItem.query);
        const segment = parsedQuery?.segments[segmentIndex];
        if (!segment) {
            return { kind: "none" };
        }

        const currentText = queryItem.query.slice(
            segment.charRange.start,
            segment.charRange.end
        );
        const siblings = snapshot.getSegmentSiblings(queryId, segmentIndex);
        const currentIdx = siblings.indexOf(currentText);
        if (currentIdx === -1) {
            if (siblings.length === 0) {
                return { kind: "none" };
            }
            // Pattern / unknown segment — jump to first or last sibling
            const newIdx = payload.direction === 1 ? 0 : siblings.length - 1;
            const newName = siblings[newIdx];
            const newQuery =
                queryItem.query.slice(0, segment.charRange.start) +
                newName +
                queryItem.query.slice(segment.charRange.end);
            return {
                kind: "moved",
                patch: {
                    queryItemUpdates: [
                        {
                            kind: "update",
                            item: { id: queryId, query: newQuery },
                        },
                    ],
                    segmentSelection: {
                        queryId,
                        anchor: segmentIndex,
                        focus: segmentIndex,
                    },
                },
            };
        }

        const newIdx =
            (currentIdx + payload.direction + siblings.length) %
            siblings.length;
        const newName = siblings[newIdx];
        if (newName === currentText) {
            return { kind: "none" };
        }

        const newQuery =
            queryItem.query.slice(0, segment.charRange.start) +
            newName +
            queryItem.query.slice(segment.charRange.end);

        return {
            kind: "moved",
            patch: {
                queryItemUpdates: [
                    {
                        kind: "update",
                        item: { id: queryId, query: newQuery },
                    },
                ],
                segmentSelection: {
                    queryId,
                    anchor: segmentIndex,
                    focus: segmentIndex,
                },
            },
        };
    }

    remove(
        snapshot: SegmentSelectionDelegateSnapshot,
        payload: { direction: 1 | -1 }
    ): SegmentFocusMoveResult {
        const { segmentSelection } = snapshot;
        if (!segmentSelection) {
            return { kind: "none" };
        }

        const { queryId, focus: segmentIndex } = segmentSelection;
        const queryItem = snapshot.getQueryById(queryId);
        if (!queryItem) {
            return { kind: "none" };
        }

        const parsedQuery = snapshot.getParsedQuery(queryItem.query);
        if (!parsedQuery) {
            return { kind: "none" };
        }

        const segmentCount = parsedQuery.segments.length;

        if (segmentCount <= 1) {
            // Removing the only segment — remove the whole query item and
            // fall back to query selection of a neighbouring chip.
            const queryIndex = snapshot.getQueryIndexById(queryId);
            // Prefer previous (backspace) or next (delete). When there is no
            // previous chip (queryIndex === 0), fall back to the next chip,
            // which slides into index 0 after the deletion.
            const neighbourIndex =
                payload.direction === -1 && queryIndex > 0
                    ? queryIndex - 1
                    : queryIndex;
            return {
                kind: "moved",
                patch: {
                    selectionMode: "query",
                    queryItemUpdates: [{ kind: "remove", item: queryItem }],
                    segmentSelection: null,
                    querySelection: {
                        anchor: neighbourIndex,
                        focus: neighbourIndex,
                    },
                },
            };
        }

        // Splice out the segment and its adjacent delimiter from the query string.
        const segment = parsedQuery.segments[segmentIndex];
        let removeStart: number;
        let removeEnd: number;

        if (segmentIndex < segmentCount - 1) {
            // Not the last segment: remove the segment + the delimiter after it.
            removeStart = segment.charRange.start;
            removeEnd = parsedQuery.segments[segmentIndex + 1].charRange.start;
        } else {
            // Last segment: remove the delimiter before it + the segment.
            removeStart = parsedQuery.segments[segmentIndex - 1].charRange.end;
            removeEnd = segment.charRange.end;
        }

        const newQuery =
            queryItem.query.slice(0, removeStart) +
            queryItem.query.slice(removeEnd);

        // direction=-1 (backspace): land on the segment before the deleted one.
        // direction=+1 (delete): land on the same index (next segment slides in),
        //   clamped to the new last segment.
        const newSegmentIndex =
            payload.direction === -1
                ? Math.max(0, segmentIndex - 1)
                : Math.min(segmentIndex, segmentCount - 2);

        return {
            kind: "moved",
            patch: {
                queryItemUpdates: [
                    { kind: "update", item: { id: queryId, query: newQuery } },
                ],
                segmentSelection: {
                    queryId,
                    anchor: newSegmentIndex,
                    focus: newSegmentIndex,
                },
            },
        };
    }
}
