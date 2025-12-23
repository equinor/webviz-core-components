/**
 * Simple test page for SmartNodeSelector component
 */
import React from "react";
import { SmartNodeSelector } from "../lib";
import { SmartNodeSelector as NewSmartNodeSelector } from "../lib/components/NewSmartNodeSelector/SmartNodeSelector";
import { TagEditor } from "../lib/components/NewSmartNodeSelector/components/TagEditor/tagEditor";

type SmartNodeSelectorState = {
    selectedTags: string[];
    selectedNodes: string[];
    selectedIds: string[];
};

const DATA = [
    {
        id: "1",
        name: "Data Source A",
        description: "First data source",
        color: "#0095FF",
        children: [
            {
                id: "1.1",
                name: "Category 1",
                description: "First category",
                children: [
                    {
                        id: "1.1.1",
                        name: "Item A1",
                        description: "First item in category 1",
                    },
                    {
                        id: "1.1.2",
                        name: "Item A2",
                        description: "Second item in category 1",
                    },
                    {
                        id: "1.1.3",
                        name: "Item A3",
                        description: "Third item in category 1",
                    },
                ],
            },
            {
                id: "1.2",
                name: "Category 2",
                description: "Second category",
                children: [
                    {
                        id: "1.2.1",
                        name: "Item B1",
                        description: "First item in category 2",
                    },
                    {
                        id: "1.2.2",
                        name: "Item B2",
                        description: "Second item in category 2",
                    },
                ],
            },
        ],
    },
    {
        id: "2",
        name: "Data Source B",
        description: "Second data source",
        color: "#FF5555",
        children: [
            {
                id: "2.1",
                name: "Category 1",
                description: "Third category",
                children: [
                    {
                        id: "2.1.1",
                        name: "Item C1",
                        description: "First item in category 3",
                    },
                    {
                        id: "2.1.2",
                        name: "Item C2",
                        description: "Second item in category 3",
                    },
                    {
                        id: "2.1.3",
                        name: "Item C3",
                        description: "Third item in category 3",
                    },
                ],
            },
        ],
    },
];

const SmartNodeSelectorTest: React.FC = () => {
    const [state, setState] = React.useState<SmartNodeSelectorState>({
        selectedNodes: [],
        selectedIds: [],
        selectedTags: [],
    });

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
            <h1>SmartNodeSelector Test Page</h1>
            <p>A simple test page for the SmartNodeSelector component</p>

            <div style={{ marginTop: "20px" }}>
                <SmartNodeSelector
                    id="SmartNodeSelector"
                    key="SmartNodeSelector"
                    numMetaNodes={2}
                    delimiter=":"
                    placeholder="Search or select nodes..."
                    selectedTags={state.selectedTags}
                    caseInsensitiveMatching={true}
                    setProps={setState}
                    label="Smart Node Selector"
                    data={DATA}
                />
            </div>

            <div
                style={{
                    marginTop: "30px",
                    padding: "15px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                }}
            >
                <h3>Selection State:</h3>

                <div style={{ marginTop: "10px" }}>
                    <strong>Selected Nodes:</strong>
                    {state.selectedNodes.length > 0 ? (
                        <ul style={{ marginTop: "5px" }}>
                            {state.selectedNodes.map((node, index) => (
                                <li key={`node-${index}`}>{node}</li>
                            ))}
                        </ul>
                    ) : (
                        <div
                            style={{
                                marginTop: "5px",
                                fontStyle: "italic",
                                color: "#666",
                            }}
                        >
                            None selected
                        </div>
                    )}
                </div>

                <div style={{ marginTop: "15px" }}>
                    <strong>Selected Tags:</strong>
                    {state.selectedTags.length > 0 ? (
                        <ul style={{ marginTop: "5px" }}>
                            {state.selectedTags.map((tag, index) => (
                                <li key={`tag-${index}`}>{tag}</li>
                            ))}
                        </ul>
                    ) : (
                        <div
                            style={{
                                marginTop: "5px",
                                fontStyle: "italic",
                                color: "#666",
                            }}
                        >
                            None selected
                        </div>
                    )}
                </div>

                <div style={{ marginTop: "15px" }}>
                    <strong>Selected IDs:</strong>
                    {state.selectedIds.length > 0 ? (
                        <ul style={{ marginTop: "5px" }}>
                            {state.selectedIds.map((id, index) => (
                                <li key={`id-${index}`}>{id}</li>
                            ))}
                        </ul>
                    ) : (
                        <div
                            style={{
                                marginTop: "5px",
                                fontStyle: "italic",
                                color: "#666",
                            }}
                        >
                            None selected
                        </div>
                    )}
                </div>
            </div>
            <h3>New SmartNodeSelector</h3>
            <NewSmartNodeSelector data={DATA} />
        </div>
    );
};

export default SmartNodeSelectorTest;
