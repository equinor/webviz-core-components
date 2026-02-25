import type { ParsedQuery } from "../query-language/parse";
import type { QueryItem, SegmentSelection, StatePatch } from "./types";

export type SegmentOperationResult =
    | {
          kind: "moved";
          patch: StatePatch;
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
    navigateSegment(
        snapshot: SegmentSelectionDelegateSnapshot,
        payload: { direction: 1 | -1 }
    ): SegmentOperationResult {
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
        const newIndex = segmentIndex + payload.direction;

        if (newIndex < 0 || newIndex >= segmentCount) {
            // Hit boundary → switch to query selection mode
            const queryIndex = snapshot.getQueryIndexById(queryId);
            if (queryIndex === -1) {
                return { kind: "none" };
            }
            return {
                kind: "moved",
                patch: {
                    selectionMode: "query",
                    querySelection: { anchor: queryIndex, focus: queryIndex },
                },
            };
        }

        return {
            kind: "moved",
            patch: {
                segmentSelection: {
                    queryId,
                    anchor: newIndex,
                    focus: newIndex,
                },
            },
        };
    }

    cycleSibling(
        snapshot: SegmentSelectionDelegateSnapshot,
        payload: { direction: 1 | -1 }
    ): SegmentOperationResult {
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
}
