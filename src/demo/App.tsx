/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


/* eslint no-magic-numbers: 0 */
import React, { Component } from "react";

import { WebvizPluginPlaceholder, SmartNodeSelector } from "../lib";

const steps = [
    {
        selector: "#blue-rect",
        content: "This is my first step",
    },
    {
        selector: "#green-rect",
        content: "This is my second step",
    },
];

type ParentProps = {
    selectedTags: string[],
    selectedNodes: string[],
    selectedIds: string[]
};

class App extends Component {
    state: ParentProps;
    constructor(props: Record<string, unknown>) {
        super(props);

        this.setProps = this.setProps.bind(this);
        this.state = {
            selectedNodes: [],
            selectedIds: [],
            selectedTags: []
        };
    }

    setProps(newProps: ParentProps): void {
        this.setState(newProps);
    }

    render(): React.ReactNode {
        return (
            <div>
                <WebvizPluginPlaceholder
                    id={"placeholder"}
                    setProps={this.setProps}
                    tour_steps={steps}
                    feedback_url={
                        "https://github.com/equinor/webviz-core-components/issues/"
                        + "new?title=New+feedback&body=Feedback+text&labels=userfeedback"
                    }
                    deprecation_warnings={
                        [
                            {
                                message: "Deprecated 1",
                                url: "https://github.com/equinor/webviz-core-components"
                            },
                            {
                                message: "Deprecated 2",
                                url: "https://github.com/equinor/webviz-core-components"
                            }
                        ]
                    }
                />
                <SmartNodeSelector
                    id="SmartNodeSelector"
                    key="SmartNodeSelector"
                    maxNumSelectedNodes={1}
                    numMetaNodes={2}
                    delimiter=":"
                    setProps={this.setProps}
                    label="Smart Tree Node Selector"
                    data={[
                        {
                            "id": "1",
                            "name": "Metadata 1",
                            "description": "A first data source",
                            "color": "#0095FF",
                            "children": [
                                {
                                    "id": "1.1",
                                    "name": "Submetadata 1",
                                    "description": "A data category",
                                    "icon":
                                        (
                                            "https://raw.githubusercontent.com/feathericons/"
                                            + "feather/master/icons/anchor.svg"
                                        ),
                                    "children": [
                                        {
                                            "id": "1.1.1",
                                            "name": "Node 1",
                                            "description": "A first data node",
                                            "children": [
                                                {
                                                    "id": "1.1.1.1",
                                                    "name": "Subnode 1",
                                                    "description": "A first sub node",
                                                },
                                                {
                                                    "id": "1.1.1.2",
                                                    "name": "Subnode 2",
                                                    "description": "A second sub node",
                                                },
                                                {
                                                    "id": "1.1.1.3",
                                                    "name": "Subnode 3",
                                                    "description": "A third sub node",
                                                },
                                                {
                                                    "id": "1.1.1.4",
                                                    "name": "Subnode 4",
                                                    "description": "A fourth sub node",
                                                }
                                            ],
                                        },
                                        {
                                            "id": "1.1.2",
                                            "name": "Node 2",
                                            "description": "A second data node",
                                        }
                                    ],
                                },
                                {
                                    "id": "1.2",
                                    "name": "Submetadata 2",
                                    "description": "Another data category",
                                    "icon":
                                        (
                                            "https://raw.githubusercontent.com/feathericons/"
                                            + "feather/master/icons/activity.svg"
                                        ),
                                }
                            ]
                        },
                        {
                            "id": "2",
                            "name": "Metadata 2",
                            "description": "A second data source",
                            "color": "#FF5555",
                            "children": [
                                {
                                    "id": "2.1",
                                    "name": "Submetadata 1",
                                    "description": "A data category",
                                    "icon": (
                                        "https://raw.githubusercontent.com/feathericons/"
                                        + "feather/master/icons/anchor.svg"
                                    ),
                                    "children": [
                                        {
                                            "id": "2.1.1",
                                            "name": "Node 1",
                                            "description": "A first data node",
                                            "children": [
                                                {
                                                    "id": "2.1.1.1",
                                                    "name": "Subnode 1",
                                                    "description": "A first sub node",
                                                },
                                                {
                                                    "id": "2.1.1.2",
                                                    "name": "Subnode 2",
                                                    "description": "A second sub node",
                                                },
                                                {
                                                    "id": "2.1.1.3",
                                                    "name": "Subnode 3",
                                                    "description": "A third sub node",
                                                },
                                                {
                                                    "id": "2.1.1.4",
                                                    "name": "Subnode 4",
                                                    "description": "A fourth sub node",
                                                }
                                            ],
                                        },
                                        {
                                            "id": "2.1.2",
                                            "name": "Node 2",
                                            "description": "A second data node",
                                        }
                                    ],
                                },
                                {
                                    "id": "2.2",
                                    "name": "Submetadata 2",
                                    "description": "Another data category",
                                    "icon":
                                        (
                                            "https://raw.githubusercontent.com/feathericons/"
                                            + "feather/master/icons/activity.svg"
                                        ),
                                }
                            ]
                        }
                    ]}
                />
                Selected nodes:<br />
                {this.state.selectedNodes.length > 0 && this.state.selectedNodes.map((node, index) => (
                    <div key={`node-${index}`}>{node}</div>
                ))}
                {this.state.selectedNodes.length == 0 && (
                    <i>None</i>
                )}
            </div>
        );
    }
}

export default App;
