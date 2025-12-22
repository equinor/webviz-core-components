import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import type { IndexedNode } from "../core";

export function useMatches(tagId: string): IndexedNode[] {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);

    const matches = React.useMemo(
        function computeMatches() {
            const tag = dataContext.state.tags.find((t) => t.id === tagId);
            if (!tag) {
                return [];
            }
            return dataContext.suggestionEngine.getMatches(tag.value);
        },
        [dataContext.suggestionEngine, dataContext.state.tags, tagId]
    );

    return matches;
}
