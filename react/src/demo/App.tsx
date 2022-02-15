/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint no-magic-numbers: 0 */
import { Button } from "@material-ui/core";
import React from "react";

import {
    WebvizPluginPlaceholder,
    SmartNodeSelector,
    Menu,
    Dialog,
} from "../lib";

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

    const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);

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
                                    {
                                        type: "page",
                                        title: "Dialog",
                                        href: "#dialog",
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
            {currentPage.url.split("#")[1] === "dialog" && (
                <>
                    <h1>Dialog</h1>
                    <Button
                        component="button"
                        onClick={() => setDialogOpen(true)}
                    >
                        Open Dialog
                    </Button>
                    <Dialog
                        title="Dialog title"
                        id="dialog"
                        max_width="xl"
                        open={dialogOpen}
                        draggable={true}
                        setProps={(newProps) => {
                            console.log(newProps);
                            setDialogOpen(newProps.open);
                        }}
                        actions={["Cancel", "OK"]}
                    >
                        <div style={{ width: 2000 }}>
                            This is the content of the dialog.
                        </div>
                    </Dialog>
                </>
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
                        placeholder="This is a very long placeholder..."
                        selectedTags={nodeSelectorState.selectedTags}
                        caseInsensitiveMatching={false}
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
                                                name: "Node-1",
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
                                                    {
                                                        id: "1.1.1.5",
                                                        name: "Subnode 5",
                                                        description:
                                                            "A first sub node",
                                                    },
                                                    {
                                                        id: "1.1.1.6",
                                                        name: "Subnode 6",
                                                        description:
                                                            "A second sub node",
                                                    },
                                                    {
                                                        id: "1.1.1.7",
                                                        name: "Subnode 7",
                                                        description:
                                                            "A third sub node",
                                                    },
                                                    {
                                                        id: "1.1.1.8",
                                                        name: "Subnode 8",
                                                        description:
                                                            "A fourth sub node",
                                                    },
                                                    {
                                                        id: "1.1.1.9",
                                                        name: "Subnode 9",
                                                        description:
                                                            "A first sub node",
                                                    },
                                                    {
                                                        id: "1.1.1.10",
                                                        name: "Subnode 10",
                                                        description:
                                                            "A second sub node",
                                                    },
                                                    {
                                                        id: "1.1.1.11",
                                                        name: "Subnode 11",
                                                        description:
                                                            "A third sub node",
                                                    },
                                                    {
                                                        id: "1.1.1.12",
                                                        name: "Subnode 12",
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
