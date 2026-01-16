/**
 * Simple test page for SmartNodeSelector component
 */
import React from "react";
import { SmartNodeSelector } from "../lib";
import { SmartNodeSelector as NewSmartNodeSelector } from "../lib/components/NewSmartNodeSelector/SmartNodeSelector";
import { TEST_DATA } from "./testdata";

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
                name: "Long name in between to test truncation",
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
                        name: "Item A1",
                        description: "First item in category 1",
                    },
                    {
                        id: "2.1.2",
                        name: "Item A2",
                        description: "Second item in category 1",
                    },
                    {
                        id: "2.1.3",
                        name: "Item A3",
                        description: "Third item in category 1",
                    },
                ],
            },
        ],
    },
];

const TEST_DATA_MAP = {
    simpleTestData: DATA,
    vectorTestData: TEST_DATA,
} as const;

// Helper to extract configurable options (excluding function types)
type ConfigurableOptions = {
    completions?: {
        maxNumberCompletions?: number;
        completionItemHeight?: number;
    };
    lexical?: {
        delimiter?: string;
    };
    queryChips?: {
        truncation?: {
            enable?: boolean;
            maxSegmentChars?: number;
        };
    };
};

/**
 * Dynamic options configurator component
 * Automatically generates form controls based on the options object structure
 */
const OptionsConfigurator: React.FC<{
    options: ConfigurableOptions;
    onChange: (options: ConfigurableOptions) => void;
}> = ({ options, onChange }) => {
    const updateOption = (path: string[], value: any) => {
        const newOptions = JSON.parse(JSON.stringify(options));
        let current = newOptions;
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) {
                current[path[i]] = {};
            }
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        onChange(newOptions);
    };

    const getNestedValue = (obj: any, path: string[]): any => {
        let current = obj;
        for (const key of path) {
            if (current && typeof current === "object" && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }
        return current;
    };

    const renderControl = (
        path: string[],
        value: any,
        label: string
    ): React.ReactNode => {
        const currentValue = getNestedValue(options, path);

        if (typeof value === "boolean") {
            return (
                <div key={path.join(".")} style={{ marginBottom: "12px" }}>
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <span style={{ minWidth: "200px", fontWeight: 500 }}>
                            {label}:
                        </span>
                        <div style={{ display: "flex", gap: "16px" }}>
                            <label style={{ display: "flex", gap: "6px" }}>
                                <input
                                    type="radio"
                                    name={path.join(".")}
                                    checked={currentValue === true}
                                    onChange={() => updateOption(path, true)}
                                />
                                <span>true</span>
                            </label>
                            <label style={{ display: "flex", gap: "6px" }}>
                                <input
                                    type="radio"
                                    name={path.join(".")}
                                    checked={currentValue === false}
                                    onChange={() => updateOption(path, false)}
                                />
                                <span>false</span>
                            </label>
                        </div>
                    </label>
                </div>
            );
        } else if (typeof value === "number") {
            return (
                <div key={path.join(".")} style={{ marginBottom: "12px" }}>
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <span style={{ minWidth: "200px", fontWeight: 500 }}>
                            {label}:
                        </span>
                        <input
                            type="number"
                            value={currentValue ?? value}
                            onChange={(e) =>
                                updateOption(path, Number(e.target.value))
                            }
                            style={{
                                padding: "6px 12px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                width: "150px",
                            }}
                        />
                    </label>
                </div>
            );
        } else if (typeof value === "string") {
            return (
                <div key={path.join(".")} style={{ marginBottom: "12px" }}>
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <span style={{ minWidth: "200px", fontWeight: 500 }}>
                            {label}:
                        </span>
                        <input
                            type="text"
                            value={currentValue ?? value}
                            onChange={(e) => updateOption(path, e.target.value)}
                            style={{
                                padding: "6px 12px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                width: "150px",
                            }}
                        />
                    </label>
                </div>
            );
        }
        return null;
    };

    const renderCategory = (
        categoryName: string,
        categoryObj: any,
        parentPath: string[] = []
    ): React.ReactNode => {
        if (!categoryObj || typeof categoryObj !== "object") {
            return null;
        }

        const entries = Object.entries(categoryObj);
        if (entries.length === 0) {
            return null;
        }

        return (
            <div
                key={[...parentPath, categoryName].join(".")}
                style={{
                    marginBottom: "20px",
                    padding: "16px",
                    backgroundColor: "#fafafa",
                    borderRadius: "6px",
                    border: "1px solid #e0e0e0",
                }}
            >
                <h4
                    style={{
                        margin: "0 0 12px 0",
                        fontSize: "16px",
                        color: "#333",
                        textTransform: "capitalize",
                    }}
                >
                    {categoryName}
                </h4>
                {entries.map(([key, value]) => {
                    const currentPath = [...parentPath, categoryName, key];
                    const label = key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase());

                    if (
                        value &&
                        typeof value === "object" &&
                        !Array.isArray(value)
                    ) {
                        // Nested object - render as sub-category
                        return (
                            <div
                                key={key}
                                style={{
                                    marginLeft: "16px",
                                    marginTop: "12px",
                                    paddingLeft: "16px",
                                    borderLeft: "2px solid #ddd",
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: 600,
                                        marginBottom: "8px",
                                        color: "#555",
                                    }}
                                >
                                    {label}
                                </div>
                                {Object.entries(value).map(
                                    ([subKey, subValue]) => {
                                        const subPath = [
                                            ...parentPath,
                                            categoryName,
                                            key,
                                            subKey,
                                        ];
                                        const subLabel = subKey
                                            .replace(/([A-Z])/g, " $1")
                                            .replace(/^./, (str) =>
                                                str.toUpperCase()
                                            );
                                        return renderControl(
                                            subPath,
                                            subValue,
                                            subLabel
                                        );
                                    }
                                )}
                            </div>
                        );
                    } else {
                        return renderControl(currentPath, value, label);
                    }
                })}
            </div>
        );
    };

    // Default options structure that mirrors SmartNodeSelectorOptions
    const defaultStructure: ConfigurableOptions = {
        completions: {
            maxNumberCompletions: 10,
            completionItemHeight: 48,
        },
        lexical: {
            delimiter: ":",
        },
        queryChips: {
            truncation: {
                enable: false,
                maxSegmentChars: 15,
            },
        },
    };

    return (
        <div
            style={{
                padding: "20px",
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: "1px solid #ddd",
            }}
        >
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>
                Component Options
            </h3>
            {Object.entries(defaultStructure).map(([category, categoryObj]) =>
                renderCategory(category, categoryObj)
            )}
        </div>
    );
};

const SmartNodeSelectorTest: React.FC = () => {
    const [state, setState] = React.useState<SmartNodeSelectorState>({
        selectedNodes: [],
        selectedIds: [],
        selectedTags: [],
    });
    const [testData, setTestData] =
        React.useState<keyof typeof TEST_DATA_MAP>("simpleTestData");
    const [newSelectorOptions, setNewSelectorOptions] =
        React.useState<ConfigurableOptions>({
            completions: {
                maxNumberCompletions: 10,
                completionItemHeight: 48,
            },
            lexical: {
                delimiter: ":",
            },
            queryChips: {
                truncation: {
                    enable: false,
                    maxSegmentChars: 15,
                },
            },
        });

    return (
        <div
            style={{
                padding: "20px",
                maxWidth: "800px",
                height: "200vh",
                margin: "0 auto",
            }}
        >
            <h1>SmartNodeSelector Test Page</h1>
            <p>A simple test page for the SmartNodeSelector component</p>
            Select Test Data:
            <br />
            <div style={{ display: "flex", gap: 8, marginTop: "10px" }}>
                {(
                    Object.keys(TEST_DATA_MAP) as (keyof typeof TEST_DATA_MAP)[]
                ).map((key) => (
                    <>
                        <input
                            key={key}
                            type="radio"
                            id={key}
                            name="testData"
                            value={key}
                            checked={testData === key}
                            onChange={() => setTestData(key)}
                        />
                        <label key={`${key}-label`} htmlFor={key}>
                            {key}
                        </label>
                    </>
                ))}
            </div>
            <div style={{ marginTop: "20px" }}>
                <SmartNodeSelector
                    id="SmartNodeSelector"
                    key="SmartNodeSelector"
                    numMetaNodes={1}
                    delimiter=":"
                    placeholder="Search or select nodes..."
                    selectedTags={state.selectedTags}
                    caseInsensitiveMatching={true}
                    setProps={setState}
                    label="Smart Node Selector"
                    data={TEST_DATA_MAP[testData]}
                />
            </div>
            <div
                style={{
                    marginTop: "30px",
                    padding: "15px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    height: "50vh",
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
            <NewSmartNodeSelector
                key={JSON.stringify(newSelectorOptions)}
                data={TEST_DATA_MAP[testData]}
                options={newSelectorOptions}
                initialValue={["Data Source A:Category 2:Item B1"]}
            />
            <div style={{ marginTop: "30px" }}>
                <OptionsConfigurator
                    options={newSelectorOptions}
                    onChange={setNewSelectorOptions}
                />
            </div>
        </div>
    );
};

export default SmartNodeSelectorTest;
