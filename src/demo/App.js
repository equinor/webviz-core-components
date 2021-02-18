/* eslint no-magic-numbers: 0 */
import React, { Component } from "react";

import { WebvizPluginPlaceholder, TagTreeSelector } from "../lib";

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
    constructor() {
        super();

        this.setProps = this.setProps.bind(this);
    }

    setProps(newProps) {
        this.setState(newProps);
    }

    render() {
        return (
            <div>
                <WebvizPluginPlaceholder
                    setProps={this.setProps}
                    tour_steps={steps}
                />
                <TagTreeSelector
                    id="TagTreeSelector"
                    key="TagTreeSelector_0"
                    maxNumTags={3}
                    numMetaNodes={2}
                    delimiter=":"
                    values={[]}
                    tags={[]}
                    setProps={this.setProps}
                    label="Vector Selector"
                    data={[
                        {
                            id: "1",
                            name: "Metadata 1",
                            description: "A first data source",
                            color: "#0095FF",
                            children: [
                                {
                                    id: "1.1",
                                    name: "Submetadata 1",
                                    description: "A data category",
                                    icon: "https://raw.githubusercontent.com/feathericons/feather/master/icons/anchor.svg",
                                    children: [
                                        {
                                            id: "1.1.1",
                                            name: "Node 1",
                                            description: "A first data node",
                                            children: [
                                                {
                                                    id: "1.1.1.1",
                                                    name: "Subnode 1",
                                                    description: "A first sub node",
                                                },
                                                {
                                                    id: "1.1.1.2",
                                                    name: "Subnode 2",
                                                    description: "A second sub node",
                                                },
                                                {
                                                    id: "1.1.1.3",
                                                    name: "Subnode 3",
                                                    description: "A third sub node",
                                                },
                                                {
                                                    id: "1.1.1.4",
                                                    name: "Subnode 4",
                                                    description: "A fourth sub node",
                                                }
                                            ],
                                        },
                                        {
                                            id: "1.1.2",
                                            name: "Node 2",
                                            description: "A second data node",
                                        }
                                    ],
                                    id: "1.2",
                                    name: "Submetadata 2",
                                    description: "Another data category",
                                    icon: "https://raw.githubusercontent.com/feathericons/feather/master/icons/activity.svg",
                                }
                            ]
                        },
                        {
                            id: "2",
                            name: "Metadata 2",
                            description: "A second data source",
                            color: "#FF5555",
                            children: [
                                {
                                    id: "2.1",
                                    name: "Submetadata 1",
                                    description: "A data category",
                                    icon: "https://raw.githubusercontent.com/feathericons/feather/master/icons/anchor.svg",
                                    children: [
                                        {
                                            id: "2.1.1",
                                            name: "Node 1",
                                            description: "A first data node",
                                            children: [
                                                {
                                                    id: "2.1.1.1",
                                                    name: "Subnode 1",
                                                    description: "A first sub node",
                                                },
                                                {
                                                    id: "2.1.1.2",
                                                    name: "Subnode 2",
                                                    description: "A second sub node",
                                                },
                                                {
                                                    id: "2.1.1.3",
                                                    name: "Subnode 3",
                                                    description: "A third sub node",
                                                },
                                                {
                                                    id: "2.1.1.4",
                                                    name: "Subnode 4",
                                                    description: "A fourth sub node",
                                                }
                                            ],
                                        },
                                        {
                                            id: "2.1.2",
                                            name: "Node 2",
                                            description: "A second data node",
                                        }
                                    ],
                                    id: "2.2",
                                    name: "Submetadata 2",
                                    description: "Another data category",
                                    icon: "https://raw.githubusercontent.com/feathericons/feather/master/icons/activity.svg",
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
