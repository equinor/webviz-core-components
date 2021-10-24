/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint no-magic-numbers: 0 */
import React from "react";

import { WebvizPluginPlaceholder, SmartNodeSelector, Menu } from "../lib";

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

type SmartNodeSelectorProps = {
    selectedTags: string[];
    selectedNodes: string[];
    selectedIds: string[];
};

type MenuProps = {
    url: string;
};

const App: React.FC = () => {
    const [
        nodeSelectorState,
        setNodeSelectorState,
    ] = React.useState<SmartNodeSelectorProps>({
        selectedNodes: [],
        selectedIds: [],
        selectedTags: [],
    });

    const [currentPage, setCurrentPage] = React.useState<MenuProps>({
        url: "",
    });

    return (
        <div>
            <Menu
                menuBarPosition="left"
                menuDrawerPosition="left"
                showLogo={true}
                navigationItems={[
                    {
                        type: "section",
                        title: "Components",
                        icon: "layers",
                        content: [
                            {
                                type: "group",
                                title: "Demos",
                                content: [
                                    {
                                        type: "page",
                                        title: "WebvizPluginPlaceholder",
                                        href: "#webviz-plugin-placeholder",
                                    },
                                    {
                                        type: "page",
                                        title: "SmartNodeSelector",
                                        href: "#smart-node-selector",
                                    },
                                ],
                            },
                        ],
                    },
                ]}
                setProps={setCurrentPage}
            />
            {currentPage.url.split("#").length === 1 && (
                <div>
                    <h1>webviz-core-components - Demo page</h1>Please select a
                    component from the menu to view its demo application.
                </div>
            )}
            {currentPage.url.split("#")[1] === "webviz-plugin-placeholder" && (
                <>
                    <h1>WebvizPluginPlaceholder</h1>
                    <WebvizPluginPlaceholder
                        id={"placeholder"}
                        setProps={() => {
                            return;
                        }}
                        tour_steps={steps}
                        feedback_url={
                            "https://github.com/equinor/webviz-core-components/issues/" +
                            "new?title=New+feedback&body=Feedback+text&labels=userfeedback"
                        }
                        deprecation_warnings={[
                            {
                                message: "Deprecated 1",
                                url:
                                    "https://github.com/equinor/webviz-core-components",
                            },
                            {
                                message: "Deprecated 2",
                                url:
                                    "https://github.com/equinor/webviz-core-components",
                            },
                        ]}
                    />
                </>
            )}
            {currentPage.url.split("#")[1] === "smart-node-selector" && (
                <>
                    <h1>SmartNodeSelector</h1>
                    <SmartNodeSelector
                        id="SmartNodeSelector"
                        key="SmartNodeSelector"
                        numMetaNodes={2}
                        delimiter=":"
                        setProps={setNodeSelectorState}
                        label="Smart Tree Node Selector"
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
                                        icon:
                                            "https://raw.githubusercontent.com/feathericons/" +
                                            "feather/master/icons/anchor.svg",
                                        children: [
                                            {
                                                id: "1.1.1",
                                                name: "Node 1",
                                                description:
                                                    "A first data node",
                                                children: [
                                                    {
                                                        id: "1.1.1.1",
                                                        name: "Subnode 1",
                                                        description:
                                                            "A first sub node",
                                                    },
                                                    {
                                                        id: "1.1.1.2",
                                                        name: "Subnode 2",
                                                        description:
                                                            "A second sub node",
                                                    },
                                                    {
                                                        id: "1.1.1.3",
                                                        name: "Subnode 3",
                                                        description:
                                                            "A third sub node",
                                                    },
                                                    {
                                                        id: "1.1.1.4",
                                                        name: "Subnode 4",
                                                        description:
                                                            "A fourth sub node",
                                                    },
                                                ],
                                            },
                                            {
                                                id: "1.1.2",
                                                name: "Node 2",
                                                description:
                                                    "A second data node",
                                            },
                                        ],
                                    },
                                    {
                                        id: "1.2",
                                        name: "Submetadata 2",
                                        description: "Another data category",
                                        icon:
                                            "https://raw.githubusercontent.com/feathericons/" +
                                            "feather/master/icons/activity.svg",
                                    },
                                ],
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
                                        icon:
                                            "https://raw.githubusercontent.com/feathericons/" +
                                            "feather/master/icons/anchor.svg",
                                        children: [
                                            {
                                                id: "2.1.1",
                                                name: "Node 1",
                                                description:
                                                    "A first data node",
                                                children: [
                                                    {
                                                        id: "2.1.1.1",
                                                        name: "Subnode 1",
                                                        description:
                                                            "A first sub node",
                                                    },
                                                    {
                                                        id: "2.1.1.2",
                                                        name: "Subnode 2",
                                                        description:
                                                            "A second sub node",
                                                    },
                                                    {
                                                        id: "2.1.1.3",
                                                        name: "Subnode 3",
                                                        description:
                                                            "A third sub node",
                                                    },
                                                    {
                                                        id: "2.1.1.4",
                                                        name: "Subnode 4",
                                                        description:
                                                            "A fourth sub node",
                                                    },
                                                ],
                                            },
                                            {
                                                id: "2.1.2",
                                                name: "Node 2",
                                                description:
                                                    "A second data node",
                                            },
                                        ],
                                    },
                                    {
                                        id: "2.2",
                                        name: "Submetadata 2",
                                        description: "Another data category",
                                        icon:
                                            "https://raw.githubusercontent.com/feathericons/" +
                                            "feather/master/icons/activity.svg",
                                    },
                                ],
                            },
                        ]}
                    />
                    Selected nodes:
                    <br />
                    {nodeSelectorState.selectedNodes.length > 0 &&
                        nodeSelectorState.selectedNodes.map((node, index) => (
                            <div key={`node-${index}`}>{node}</div>
                        ))}
                    {nodeSelectorState.selectedNodes.length == 0 && <i>None</i>}
                    <br />
                    Selected tags:
                    <br />
                    {nodeSelectorState.selectedTags.length > 0 &&
                        nodeSelectorState.selectedTags.map((tag, index) => (
                            <div key={`tag-${index}`}>{tag}</div>
                        ))}
                    {nodeSelectorState.selectedTags.length === 0 && <i>None</i>}
                </>
            )}
        </div>
    );
};

export default App;
