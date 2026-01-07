import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { Topic } from "../core/StateManager/StateManager";
import { useSubscribeToTopic } from "../core/PubSubDelegate";

export function DebugInfo(): React.ReactElement {
    const context = React.useContext(SmartNodeSelectorDataContext);

    const queryItems = useSubscribeToTopic(
        context.stateManager,
        Topic.QUERY_ITEMS
    );
    const caretPositions = useSubscribeToTopic(
        context.stateManager,
        Topic.CARET_POSITIONS
    );
    const hasFocus = useSubscribeToTopic(context.stateManager, Topic.HAS_FOCUS);
    const focusedSegment = useSubscribeToTopic(
        context.stateManager,
        Topic.FOCUSED_SEGMENT
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
                {JSON.stringify(
                    { queryItems, caretPositions, hasFocus, focusedSegment },
                    null,
                    2
                )}
            </pre>
        </div>
    );
}
