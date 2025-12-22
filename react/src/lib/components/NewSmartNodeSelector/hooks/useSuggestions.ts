import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";

export function useSuggestions() {
    const context = React.useContext(SmartNodeSelectorDataContext);

    const suggestions = React.useMemo(
        function computeSuggestions() {
            if (context.state.focusedAddress === null) {
                return [];
            }

            const tag = context.state.tags.find(
                (t) => t.id === context.state.focusedAddress?.tagId
            );

            if (!tag) {
                return [];
            }

            return context.suggestionEngine.getSuggestions(
                tag.value,
                context.state.focusedAddress.segmentIndex,
                10
            );
        },
        [
            context.state.focusedAddress,
            context.state.tags,
            context.suggestionEngine,
        ]
    );

    return suggestions;
}
