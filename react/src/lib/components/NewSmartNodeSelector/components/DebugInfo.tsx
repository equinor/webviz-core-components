import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";

export function DebugInfo(): React.ReactElement {
    const context = React.useContext(SmartNodeSelectorDataContext);

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
                {JSON.stringify(context.stateManager, null, 2)}
            </pre>
        </div>
    );
}
