import React from "react";
import type { IndexedNode } from "../core";
import type { QueryItem } from "../core/StateManager/types";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { Topic } from "../core/StateManager/StateManager";

export function useLeafNodeMatches(queryItem: QueryItem): IndexedNode[] {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);
    const dataRevision = useSubscribeToTopic(
        dataContext.stateManager,
        Topic.DATA_REVISION
    );

    const matchedLeafNodes = React.useMemo(function computeMatchedLeafNodes() {
        const evaluationResult =
            dataContext.stateManager.getMatchedNodesForQuery(queryItem.query);
        if (evaluationResult === null) {
            return [];
        }
        return Array.from(evaluationResult.matches).filter(
            (node) => node.isLeaf
        );
    }, [dataContext.stateManager, queryItem.query, dataRevision]);

    return matchedLeafNodes;
}
