import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { Topic, useSubscribeToStateManagerTopicValue } from "../core/StateManager";

export function DebugInfo(): React.ReactElement {
    const context = React.useContext(SmartNodeSelectorDataContext);

    const queryItems = useSubscribeToStateManagerTopicValue(
        context.stateManager,
        Topic.QUERY_ITEMS
    );
    const caretPositions = useSubscribeToStateManagerTopicValue(
        context.stateManager,
        Topic.CARET_POSITIONS
    );
    const hasFocus = useSubscribeToStateManagerTopicValue(
        context.stateManager,
        Topic.HAS_FOCUS
    );


    return (
        <div
            style={{
                padding: 8,
                border: "1px solid #ccc",
                backgroundColor: "#f9f9f9",
            }}
        >
            <h4>Debug Info</h4>
            <pre
                style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    fontSize: 12,
                }}
            >
                {JSON.stringify({ queryItems, caretPositions, hasFocus }, null, 2)}
            </pre>
        </div>
    );
}
