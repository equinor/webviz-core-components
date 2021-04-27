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

class App extends Component {
    constructor(props: Record<string, unknown>) {
        super(props);

        this.setProps = this.setProps.bind(this);
    }

    setProps(newProps: Record<string, unknown>): void {
        this.setState(newProps);
    }

    render(): React.ReactNode {
        return (
            <div>
                <WebvizPluginPlaceholder
                    id={"placeholder"}
                    setProps={this.setProps}
                    tour_steps={steps}
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
                    maxNumSelectedNodes={3}
                    numMetaNodes={2}
                    delimiter=":"
                    selectedNodes={[]}
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

                    {...this.state}
                />
            </div>
        );
    }
}

export default App;
