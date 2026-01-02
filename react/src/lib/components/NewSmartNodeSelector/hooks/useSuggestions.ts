import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import type { QuerySegment } from "../core/StateManager";

export function useSuggestions(segment: QuerySegment | null = null) {
    const context = React.useContext(SmartNodeSelectorDataContext);

    const suggestions = React.useMemo(
        function computeSuggestions() {
            if (segment === null) {
                return [];
            }

            const queryItem = context.stateManager.getQueryItemById(
                segment?.queryId
            );

            if (!queryItem) {
                return [];
            }

            return context.suggestionEngine.getSuggestions(
                queryItem.query,
                segment.segmentIndex,
                10
            );
        },
        [segment, context.suggestionEngine, context.stateManager]
    );

    return suggestions;
}
