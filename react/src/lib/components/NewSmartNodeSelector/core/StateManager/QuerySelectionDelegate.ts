import type { QueryItem, QuerySelection, StatePatch } from "./types";

export type QueryFocusMoveResult =
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

export type QuerySelectionDelegateSnapshot = {
    querySelection: QuerySelection | null;
    getNumberOfQueries(): number;
    getQueryItemByIndex(index: number): QueryItem | null;
};

export class QuerySelectionDelegate {
    moveFocus(
        snapshot: QuerySelectionDelegateSnapshot,
        payload: {
            dx: number;
            selecting: boolean;
        }
    ): QueryFocusMoveResult {
        const { dx, selecting } = payload;

        if (snapshot.querySelection === null) {
            return { kind: "none" };
        }

        const numQueries = snapshot.getNumberOfQueries();
        let newFocusIndex = snapshot.querySelection.focus + dx;

        if (newFocusIndex < 0) {
            newFocusIndex = 0;
            if (!selecting) {
                return {
                    kind: "hitBoundary",
                    boundary: "start",
                    queryId: "",
                };
            }
        } else if (newFocusIndex >= numQueries) {
            newFocusIndex = numQueries - 1;
            if (!selecting) {
                return {
                    kind: "hitBoundary",
                    boundary: "end",
                    queryId: "",
                };
            }
        }

        const newSelection: QuerySelection = {
            anchor: selecting ? snapshot.querySelection.anchor : newFocusIndex,
            focus: newFocusIndex,
        };

        return {
            kind: "moved",
            patch: {
                querySelection: newSelection,
            },
        };
    }

    remove(snapshot: QuerySelectionDelegateSnapshot): QueryFocusMoveResult {
        if (snapshot.querySelection === null) {
            return { kind: "none" };
        }

        const numQueries = snapshot.getNumberOfQueries();
        const { anchor: anchorIndex, focus: focusIndex } =
            snapshot.querySelection;

        const newAnchorIndex = Math.min(anchorIndex, focusIndex);
        const newFocusIndex = Math.max(anchorIndex, focusIndex);

        const newSelection: QuerySelection | null =
            newAnchorIndex === 0 && newFocusIndex === numQueries - 1
                ? null
                : {
                      anchor: newAnchorIndex,
                      focus: newAnchorIndex,
                  };

        const queryItemUpdates = [];
        for (let i = newFocusIndex; i >= newAnchorIndex; i--) {
            const item = snapshot.getQueryItemByIndex(i);
            if (item) {
                queryItemUpdates.push({
                    kind: "remove" as const,
                    item,
                });
            }
        }

        return {
            kind: "moved",
            patch: {
                querySelection: newSelection,
                queryItemUpdates,
            },
        };
    }
}
