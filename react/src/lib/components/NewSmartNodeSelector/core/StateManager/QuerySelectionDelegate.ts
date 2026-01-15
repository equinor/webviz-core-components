import type { QuerySelection, StatePatch } from "./types";

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
        let newFocusIndex = snapshot.querySelection.focusIndex + dx;

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
            anchorIndex: selecting
                ? snapshot.querySelection.anchorIndex
                : newFocusIndex,
            focusIndex: newFocusIndex,
        };

        return {
            kind: "moved",
            patch: {
                querySelection: newSelection,
            },
        };
    }

    removeAtFocusOffset(
        snapshot: QuerySelectionDelegateSnapshot,
        payload: {
            direction: "backward" | "forward";
        }
    ): QueryFocusMoveResult {
        const { direction } = payload;

        if (snapshot.querySelection === null) {
            return { kind: "none" };
        }

        const numQueries = snapshot.getNumberOfQueries();
        let { anchorIndex, focusIndex } = snapshot.querySelection;

        if (anchorIndex === focusIndex) {
            // No selection, just a caret
            if (direction === "backward") {
                if (focusIndex === 0) {
                    return {
                        kind: "hitBoundary",
                        boundary: "start",
                        queryId: "",
                    };
                }
                focusIndex -= 1;
            } else {
                if (focusIndex === numQueries - 1) {
                    return {
                        kind: "hitBoundary",
                        boundary: "end",
                        queryId: "",
                    };
                }
                focusIndex += 1;
            }
        }

        const newAnchorIndex = Math.min(anchorIndex, focusIndex);
        const newFocusIndex = Math.max(anchorIndex, focusIndex);

        const newSelection: QuerySelection | null =
            newAnchorIndex === 0 && newFocusIndex === numQueries - 1
                ? null
                : {
                      anchorIndex: newAnchorIndex,
                      focusIndex: newAnchorIndex,
                  };

        return {
            kind: "moved",
            patch: {
                querySelection: newSelection,
            },
        };
    }
}
