import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import type { IndexedNode } from "../core";
import type { QueryItem } from "../core/StateManager";

export function useMatches(queryItem: QueryItem): IndexedNode[] {
    const {suggestionEngine} = React.useContext(SmartNodeSelectorDataContext);

    const matches = React.useMemo(
        function computeMatches() {
            return suggestionEngine.getMatches(queryItem.query);
        },
        [suggestionEngine, queryItem]
    );

    return matches;
}
