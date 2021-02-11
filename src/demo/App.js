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
                    maxTags={3}
                    numMetaData={2}
                    delimiter=":"
                    value={[]}
                    setProps={this.setProps}
                    label="Vector Selector"
                    data={
                        {
                            "iter-0": {
                                "description": "Iteration 0",
                                "color": "#326dcf",
                                "data": {
                                    "well": {
                                        "description": "Oil well",
                                        "icon": "Well",
                                        "data": {
                                            "WOBP": {
                                                "description": "...",
                                                "data": {
                                                    "OP_1": { "data": {} },
                                                    "OP_2": { "data": {} },
                                                    "OP_3": { "data": {} },
                                                    "OP_4": { "data": {} },
                                                    "OP_5": { "data": {} },
                                                    "OP_6": { "data": {} },
                                                    "OP_7": { "data": {} },
                                                    "OP_8": { "data": {} },
                                                    "OP_9": { "data": {} },
                                                    "OP_10": { "data": {} },
                                                }
                                            },
                                            "FOBP": {
                                                "type": "field",
                                                "description": "...",
                                                "selectorDescripton": "Select a subgroup...",
                                                "data": {}
                                            }
                                        }
                                    }
                                }
                            },
                            "iter-1": {
                                "description": "Iteration 1",
                                "color": "#e76777",
                                "data": {
                                    "well": {
                                        "description": "Oil well",
                                        "icon": "Well",
                                        "data": {
                                            "WOBP": {
                                                "description": "...",
                                                "data": {
                                                    "OP_1": { "data": {} },
                                                    "OP_2": { "data": {} },
                                                    "OP_3": { "data": {} },
                                                    "OP_4": { "data": {} },
                                                    "OP_5": { "data": {} },
                                                    "OP_6": { "data": {} },
                                                    "OP_7": { "data": {} },
                                                    "OP_8": { "data": {} },
                                                    "OP_9": { "data": {} },
                                                    "OP_10": { "data": {} },
                                                }
                                            },
                                            "FOBP": {
                                                "type": "field",
                                                "description": "...",
                                                "selectorDescripton": "Select a subgroup...",
                                                "data": {}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    {...this.state}
                />
            </div>
        );
    }
}

export default App;
