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
                />
                <SmartNodeSelector
                    id="SmartNodeSelector3"
                    key="SmartNodeSelector3"
                    maxNumSelectedNodes={3}
                    numMetaNodes={0}
                    delimiter=":"
                    selectedNodes={[]}
                    selectedTags={[]}
                    setProps={this.setProps}
                    label="Countries"
                    data={[
                        {
                            "name": "Americas",
                            "children": [
                                {
                                    "name": "1"
                                },
                                {
                                    "name": "2"
                                },
                                {
                                    "name": "3"
                                }
                            ]
                        },
                        {
                            "name": "Europe",
                            "children": [
                                {
                                    "name": "4"
                                },
                                {
                                    "name": "5"
                                },
                                {
                                    "name": "6"
                                }
                            ]
                        }
                    ]}

                    {...this.state}
                />
                <SmartNodeSelector
                    id="SmartNodeSelector2"
                    key="SmartNodeSelector2"
                    delimiter=":"
                    showSuggestions={true}
                    setProps={this.setProps}
                    label="Smart Node Selector"
                    numSecondsUntilSuggestionsAreShown={0.5}
                    data={[
                        {
                            "id": 0,
                            "name": "Jails",
                            "description": "Jails",
                            "children": []
                        },
                        {
                            "id": 1,
                            "name": "Walsh",
                            "description": "Walsh",
                            "children": []
                        },
                        {
                            "id": 2,
                            "name": "Curry",
                            "description": "Curry",
                            "children": []
                        },
                        {
                            "id": 3,
                            "name": "Culturist",
                            "description": "Culturist",
                            "children": []
                        },
                        {
                            "id": 4,
                            "name": "Scatches",
                            "description": "Scatches",
                            "children": []
                        },
                        {
                            "id": 5,
                            "name": "Carot",
                            "description": "Carot",
                            "children": []
                        },
                        {
                            "id": 6,
                            "name": "Kirin",
                            "description": "Kirin",
                            "children": []
                        },
                        {
                            "id": 7,
                            "name": "Ungifted",
                            "description": "Ungifted",
                            "children": []
                        },
                        {
                            "id": 8,
                            "name": "Tenon",
                            "description": "Tenon",
                            "children": []
                        },
                        {
                            "id": 9,
                            "name": "Flower",
                            "description": "Flower",
                            "children": []
                        },
                        {
                            "id": 10,
                            "name": "Asequence",
                            "description": "Asequence",
                            "children": []
                        },
                        {
                            "id": 11,
                            "name": "Reprovers",
                            "description": "Reprovers",
                            "children": []
                        },
                        {
                            "id": 12,
                            "name": "Schooner",
                            "description": "Schooner",
                            "children": []
                        },
                        {
                            "id": 13,
                            "name": "Catholes",
                            "description": "Catholes",
                            "children": []
                        },
                        {
                            "id": 14,
                            "name": "Referrible",
                            "description": "Referrible",
                            "children": []
                        },
                        {
                            "id": 15,
                            "name": "Overpost",
                            "description": "Overpost",
                            "children": []
                        },
                        {
                            "id": 16,
                            "name": "Zorkmid",
                            "description": "Zorkmid",
                            "children": []
                        },
                        {
                            "id": 17,
                            "name": "Slowing",
                            "description": "Slowing",
                            "children": []
                        },
                        {
                            "id": 18,
                            "name": "Liquidlike",
                            "description": "Liquidlike",
                            "children": []
                        },
                        {
                            "id": 19,
                            "name": "Summerize",
                            "description": "Summerize",
                            "children": []
                        },
                        {
                            "id": 20,
                            "name": "Nuddle",
                            "description": "Nuddle",
                            "children": []
                        },
                        {
                            "id": 21,
                            "name": "Remaine",
                            "description": "Remaine",
                            "children": []
                        },
                        {
                            "id": 22,
                            "name": "Tedium",
                            "description": "Tedium",
                            "children": []
                        },
                        {
                            "id": 23,
                            "name": "Fastpitch",
                            "description": "Fastpitch",
                            "children": []
                        },
                        {
                            "id": 24,
                            "name": "Impart",
                            "description": "Impart",
                            "children": []
                        },
                        {
                            "id": 25,
                            "name": "Clay-stone",
                            "description": "Clay-stone",
                            "children": []
                        },
                        {
                            "id": 26,
                            "name": "Teariest",
                            "description": "Teariest",
                            "children": []
                        },
                        {
                            "id": 27,
                            "name": "Commercing",
                            "description": "Commercing",
                            "children": []
                        },
                        {
                            "id": 28,
                            "name": "Bluely",
                            "description": "Bluely",
                            "children": []
                        },
                        {
                            "id": 29,
                            "name": "Revivifies",
                            "description": "Revivifies",
                            "children": []
                        },
                        {
                            "id": 30,
                            "name": "Collective",
                            "description": "Collective",
                            "children": []
                        },
                        {
                            "id": 31,
                            "name": "Slacked",
                            "description": "Slacked",
                            "children": []
                        },
                        {
                            "id": 32,
                            "name": "Symbols",
                            "description": "Symbols",
                            "children": []
                        },
                        {
                            "id": 33,
                            "name": "Evinces",
                            "description": "Evinces",
                            "children": []
                        },
                        {
                            "id": 34,
                            "name": "Abundantly",
                            "description": "Abundantly",
                            "children": []
                        },
                        {
                            "id": 35,
                            "name": "Tollways",
                            "description": "Tollways",
                            "children": []
                        },
                        {
                            "id": 36,
                            "name": "Terrenity",
                            "description": "Terrenity",
                            "children": []
                        },
                        {
                            "id": 37,
                            "name": "Silphion",
                            "description": "Silphion",
                            "children": []
                        },
                        {
                            "id": 38,
                            "name": "Abscond",
                            "description": "Abscond",
                            "children": []
                        },
                        {
                            "id": 39,
                            "name": "Banksman",
                            "description": "Banksman",
                            "children": []
                        },
                        {
                            "id": 40,
                            "name": "Linn\u00e6ite",
                            "description": "Linn\u00e6ite",
                            "children": []
                        },
                        {
                            "id": 41,
                            "name": "Parsnip",
                            "description": "Parsnip",
                            "children": []
                        },
                        {
                            "id": 42,
                            "name": "Slackens",
                            "description": "Slackens",
                            "children": []
                        },
                        {
                            "id": 43,
                            "name": "Umpqua",
                            "description": "Umpqua",
                            "children": []
                        },
                        {
                            "id": 44,
                            "name": "Teetering",
                            "description": "Teetering",
                            "children": []
                        },
                        {
                            "id": 45,
                            "name": "Dobro",
                            "description": "Dobro",
                            "children": []
                        },
                        {
                            "id": 46,
                            "name": "Ribaudrous",
                            "description": "Ribaudrous",
                            "children": []
                        },
                        {
                            "id": 47,
                            "name": "Cheri",
                            "description": "Cheri",
                            "children": []
                        },
                        {
                            "id": 48,
                            "name": "Myelitis",
                            "description": "Myelitis",
                            "children": []
                        },
                        {
                            "id": 49,
                            "name": "Celebe",
                            "description": "Celebe",
                            "children": []
                        },
                        {
                            "id": 50,
                            "name": "Undoubting",
                            "description": "Undoubting",
                            "children": []
                        },
                        {
                            "id": 51,
                            "name": "Emigrated",
                            "description": "Emigrated",
                            "children": []
                        },
                        {
                            "id": 52,
                            "name": "Leasee",
                            "description": "Leasee",
                            "children": []
                        },
                        {
                            "id": 53,
                            "name": "Weedicides",
                            "description": "Weedicides",
                            "children": []
                        },
                        {
                            "id": 54,
                            "name": "Workroom",
                            "description": "Workroom",
                            "children": []
                        },
                        {
                            "id": 55,
                            "name": "Jackets",
                            "description": "Jackets",
                            "children": []
                        },
                        {
                            "id": 56,
                            "name": "Lagnappe",
                            "description": "Lagnappe",
                            "children": []
                        },
                        {
                            "id": 57,
                            "name": "Trillionth",
                            "description": "Trillionth",
                            "children": []
                        },
                        {
                            "id": 58,
                            "name": "Sweetbrier",
                            "description": "Sweetbrier",
                            "children": []
                        },
                        {
                            "id": 59,
                            "name": "Wirebird",
                            "description": "Wirebird",
                            "children": []
                        },
                        {
                            "id": 60,
                            "name": "Brewsky",
                            "description": "Brewsky",
                            "children": []
                        },
                        {
                            "id": 61,
                            "name": "Savin",
                            "description": "Savin",
                            "children": []
                        },
                        {
                            "id": 62,
                            "name": "Spoondrift",
                            "description": "Spoondrift",
                            "children": []
                        },
                    ]}
                />
                <SmartNodeSelector
                    id="SmartNodeSelector"
                    key="SmartNodeSelector"
                    maxNumSelectedNodes={3}
                    numMetaNodes={2}
                    delimiter=":"
                    selectedNodes={[]}
                    selectedTags={[]}
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
