import React from "react";
import type { IndexedNode } from "../core";
import type { QueryItem } from "../core/StateManager/types";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { Topic } from "../core/StateManager/StateManager";

export function usePreviousQueriesLeafNodeMatches(
    beforeQueryItem: QueryItem
): IndexedNode[] {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);
    const dataRevision = useSubscribeToTopic(
        dataContext.stateManager,
        Topic.DATA_REVISION
    );

    const queryIndex = dataContext.stateManager.getQueryItemIndexById(
        beforeQueryItem.id
    );

    const matchedLeafNodes = React.useMemo(() => {
        const matchedLeafNodes: IndexedNode[] = [];

        if (queryIndex === -1) {
            return [];
        }

        for (let i = 0; i < queryIndex; i++) {
            const item = dataContext.stateManager.getQueryItemByIndex(i);
            if (item === null) {
                continue;
            }
            const evaluationResult =
                dataContext.stateManager.getMatchedNodesForQuery(item.query);
            if (evaluationResult === null) {
                continue;
            }

            matchedLeafNodes.push(
                ...Array.from(evaluationResult.matches).filter(
                    (node) => node.isLeaf
                )
            );
        }

        return matchedLeafNodes;
    }, [dataContext.stateManager, queryIndex, dataRevision]);

    return matchedLeafNodes;
}
