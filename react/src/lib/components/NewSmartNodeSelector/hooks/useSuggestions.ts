import React from "react";
import { SmartNodeSelectorContext } from "../SmartNodeSelector";

export function useSuggestions() {
    const context = React.useContext(SmartNodeSelectorContext);

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

            return context.suggestionEngine.getSuggestions(tag.value);
        },
        [
            context.state.focusedAddress,
            context.state.tags,
            context.suggestionEngine,
        ]
    );

    return suggestions;
}
