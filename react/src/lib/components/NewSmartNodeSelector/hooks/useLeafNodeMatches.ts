import React from "react";
import type { IndexedNode } from "../core";
import type { QueryItem } from "../core/StateManager/types";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";

export function useLeafNodeMatches(queryItem: QueryItem): IndexedNode[] {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);

    const matchedLeafNodes = React.useMemo(() => {
        const evaluationResult =
            dataContext.stateManager.getMatchedNodesForQuery(queryItem.query);
        if (evaluationResult === null) {
            return [];
        }
        return Array.from(evaluationResult.matches).filter(
            (node) => node.isLeaf
        );
    }, [dataContext.stateManager, queryItem.query]);

    return matchedLeafNodes;
}
