import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { Topic } from "../core/StateManager/StateManager";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { CompletionsTopic } from "../core/CompletionsState";

export function DebugInfo(): React.ReactElement {
    const context = React.useContext(SmartNodeSelectorDataContext);
    const [position, setPosition] = React.useState({ x: 16, y: 16 });
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

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
    const selectedIndex = useSubscribeToTopic(
        context.completionsState,
        CompletionsTopic.SELECTED_INDEX
    );

    const handleMouseDown = React.useCallback(
        function handleMouseDown(e: React.MouseEvent) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
        },
        [position]
    );

    React.useEffect(
        function setupDragListeners() {
            const handleMouseMove = function handleMouseMove(e: MouseEvent) {
                if (isDragging) {
                    setPosition({
                        x: e.clientX - dragStart.x,
                        y: e.clientY - dragStart.y,
                    });
                }
            };

            const handleMouseUp = function handleMouseUp() {
                setIsDragging(false);
            };

            if (isDragging) {
                document.addEventListener("mousemove", handleMouseMove);
                document.addEventListener("mouseup", handleMouseUp);
            }

            return function cleanup() {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        },
        [isDragging, dragStart]
    );

    return (
        <div
            style={{
                padding: 16,
                border: "2px solid #3f1d1dff",
                backgroundColor: "#fafafa",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: 13,
                position: "fixed",
                left: position.x,
                top: position.y,
                maxHeight: "calc(100vh - 32px)",
                overflowY: "auto",
                zIndex: 10000,
                maxWidth: "calc(100vw - 32px)",
                cursor: isDragging ? "grabbing" : "auto",
            }}
        >
            <div
                onMouseDown={handleMouseDown}
                style={{
                    marginBottom: 16,
                    paddingBottom: 8,
                    borderBottom: "1px solid #e0e0e0",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#333",
                    cursor: "grab",
                    userSelect: "none",
                }}
            >
                Debug Info
            </div>
            <div
                style={{
                    display: "flex",
                    gap: 24,
                    flexWrap: "wrap",
                }}
            >
                <div
                    style={{
                        flex: "1 1 300px",
                        minWidth: 250,
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#666",
                            marginBottom: 8,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                        }}
                    >
                        Query Items ({queryItems.length})
                    </div>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            backgroundColor: "white",
                            borderRadius: 4,
                            overflow: "hidden",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    backgroundColor: "#f5f5f5",
                                }}
                            >
                                <th
                                    style={{
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#666",
                                        borderBottom: "1px solid #e0e0e0",
                                    }}
                                >
                                    ID
                                </th>
                                <th
                                    style={{
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#666",
                                        borderBottom: "1px solid #e0e0e0",
                                    }}
                                >
                                    Query
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {queryItems.map((item, index) => (
                                <tr
                                    key={index}
                                    style={{
                                        borderBottom:
                                            index < queryItems.length - 1
                                                ? "1px solid #f0f0f0"
                                                : "none",
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "8px 12px",
                                            fontFamily: "monospace",
                                            fontSize: 12,
                                            color: "#0066cc",
                                        }}
                                    >
                                        {item.id}
                                    </td>
                                    <td
                                        style={{
                                            padding: "8px 12px",
                                            fontFamily: "monospace",
                                            fontSize: 12,
                                            color: "#333",
                                        }}
                                    >
                                        {"<" + item.query + ">"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div
                    style={{
                        flex: "1 1 350px",
                        minWidth: 300,
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#666",
                            marginBottom: 8,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                        }}
                    >
                        Caret Positions
                    </div>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            backgroundColor: "white",
                            borderRadius: 4,
                            overflow: "hidden",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    backgroundColor: "#f5f5f5",
                                }}
                            >
                                <th
                                    style={{
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#666",
                                        borderBottom: "1px solid #e0e0e0",
                                    }}
                                >
                                    Query Item ID
                                </th>
                                <th
                                    style={{
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#666",
                                        borderBottom: "1px solid #e0e0e0",
                                    }}
                                >
                                    Caret
                                </th>
                                <th
                                    style={{
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#666",
                                        borderBottom: "1px solid #e0e0e0",
                                    }}
                                >
                                    Anchor
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {caretPositions.map((pos, index) => (
                                <tr
                                    key={index}
                                    style={{
                                        borderBottom:
                                            index < caretPositions.length - 1
                                                ? "1px solid #f0f0f0"
                                                : "none",
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "8px 12px",
                                            fontFamily: "monospace",
                                            fontSize: 12,
                                            color: "#0066cc",
                                        }}
                                    >
                                        {pos.queryId}
                                    </td>
                                    <td
                                        style={{
                                            padding: "8px 12px",
                                            fontFamily: "monospace",
                                            fontSize: 12,
                                            color: "#333",
                                        }}
                                    >
                                        {pos.offset}
                                    </td>
                                    <td
                                        style={{
                                            padding: "8px 12px",
                                            fontFamily: "monospace",
                                            fontSize: 12,
                                            color: "#333",
                                        }}
                                    >
                                        {pos.anchorOffset}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div
                    style={{
                        flex: "1 1 250px",
                        minWidth: 200,
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#666",
                                marginBottom: 8,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Focus State
                        </div>
                        <div
                            style={{
                                backgroundColor: "white",
                                padding: 12,
                                borderRadius: 4,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 8,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        color: "#666",
                                    }}
                                >
                                    Has Focus:
                                </span>
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: hasFocus ? "#0066cc" : "#999",
                                    }}
                                >
                                    {hasFocus ? "true" : "false"}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 8,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        color: "#666",
                                    }}
                                >
                                    Query Item ID:
                                </span>
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#0066cc",
                                    }}
                                >
                                    {focusedSegment?.queryId ?? "—"}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        color: "#666",
                                    }}
                                >
                                    Segment:
                                </span>
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#0066cc",
                                    }}
                                >
                                    {focusedSegment?.segmentIndex ?? "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#666",
                                marginBottom: 8,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Selection
                        </div>
                        <div
                            style={{
                                backgroundColor: "white",
                                padding: 12,
                                borderRadius: 4,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        color: "#666",
                                    }}
                                >
                                    Selected Index:
                                </span>
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#0066cc",
                                    }}
                                >
                                    {selectedIndex ?? "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
