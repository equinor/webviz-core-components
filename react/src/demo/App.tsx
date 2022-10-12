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
    Dialog,
    Menu,
    ScrollArea,
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

const App: React.FC = () => {
    const [nodeSelectorState, setNodeSelectorState] =
        React.useState<SmartNodeSelectorProps>({
            selectedNodes: [],
            selectedIds: [],
            selectedTags: [],
        });

    const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
    const [currentPage, setCurrentPage] = React.useState<string>(
        window.location.hash.replace("#", "")
    );

    React.useEffect(() => {
        const handleLocationChange = () => {
            setCurrentPage(window.location.hash.replace("#", ""));
        };

        window.addEventListener("popstate", handleLocationChange);
        window.addEventListener("_dashprivate_pushstate", handleLocationChange);

        return () => {
            window.removeEventListener("popstate", handleLocationChange);
            window.removeEventListener(
                "_dashprivate_pushstate",
                handleLocationChange
            );
        };
    }, []);
    return (
        <div>
            <div style={{ border: "1px black solid", width: "100%" }}>
                <ScrollArea height={50} width="100%">
                    <div style={{ width: 800 }}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Velit egestas dui id ornare. Convallis
                        tellus id interdum velit laoreet id donec. Neque
                        volutpat ac tincidunt vitae. Enim praesent elementum
                        facilisis leo vel fringilla est ullamcorper.
                        Pellentesque habitant morbi tristique senectus et netus
                        et malesuada fames. Tellus orci ac auctor augue mauris
                        augue neque gravida. Elit ut aliquam purus sit amet
                        luctus venenatis. Quam pellentesque nec nam aliquam sem
                        et tortor. Erat pellentesque adipiscing commodo elit at
                        imperdiet dui accumsan sit. At augue eget arcu dictum
                        varius duis at consectetur lorem. Integer eget aliquet
                        nibh praesent tristique magna sit amet purus.
                        Consectetur adipiscing elit pellentesque habitant morbi
                        tristique. Montes nascetur ridiculus mus mauris vitae.
                        Pharetra sit amet aliquam id diam maecenas ultricies mi.
                        Aenean vel elit scelerisque mauris pellentesque pulvinar
                        pellentesque habitant. Nullam non nisi est sit amet
                        facilisis. Sed augue lacus viverra vitae congue eu
                        consequat. Convallis convallis tellus id interdum. Velit
                        ut tortor pretium viverra suspendisse potenti nullam ac
                        tortor. Quis risus sed vulputate odio ut enim blandit.
                        Fringilla phasellus faucibus scelerisque eleifend donec
                        pretium vulputate sapien. Euismod elementum nisi quis
                        eleifend quam. Diam vulputate ut pharetra sit amet
                        aliquam id diam maecenas. Orci porta non pulvinar neque
                        laoreet. Vel risus commodo viverra maecenas accumsan
                        lacus vel. Enim diam vulputate ut pharetra sit amet
                        aliquam id diam. Est pellentesque elit ullamcorper
                        dignissim cras tincidunt. Quam elementum pulvinar etiam
                        non quam lacus suspendisse faucibus. Lacus vel facilisis
                        volutpat est velit egestas dui id ornare. Egestas
                        integer eget aliquet nibh praesent tristique magna. Enim
                        neque volutpat ac tincidunt vitae semper quis lectus.
                        Sed pulvinar proin gravida hendrerit. Porta nibh
                        venenatis cras sed. Tristique senectus et netus et
                        malesuada. Nibh sit amet commodo nulla. Ullamcorper
                        malesuada proin libero nunc consequat interdum varius
                        sit. Consectetur libero id faucibus nisl tincidunt.
                        Volutpat consequat mauris nunc congue nisi vitae. A
                        scelerisque purus semper eget duis at. Sem fringilla ut
                        morbi tincidunt augue interdum velit euismod in. Massa
                        enim nec dui nunc mattis enim ut tellus. Urna porttitor
                        rhoncus dolor purus non enim praesent. Est sit amet
                        facilisis magna etiam tempor orci. Donec pretium
                        vulputate sapien nec sagittis aliquam malesuada.
                        Suscipit tellus mauris a diam maecenas. Nunc sed blandit
                        libero volutpat sed. Turpis egestas sed tempus urna et.
                        Vestibulum mattis ullamcorper velit sed ullamcorper. Est
                        pellentesque elit ullamcorper dignissim. Amet mauris
                        commodo quis imperdiet massa tincidunt nunc pulvinar.
                        Congue nisi vitae suscipit tellus mauris a diam maecenas
                        sed. Porttitor massa id neque aliquam vestibulum morbi
                        blandit cursus. Arcu vitae elementum curabitur vitae
                        nunc sed velit dignissim. Facilisis leo vel fringilla
                        est ullamcorper eget nulla facilisi etiam. Lacinia at
                        quis risus sed vulputate odio ut. Sed viverra tellus in
                        hac habitasse. Eget duis at tellus at. Molestie ac
                        feugiat sed lectus vestibulum mattis ullamcorper. At
                        consectetur lorem donec massa sapien faucibus et.
                        Vulputate mi sit amet mauris commodo quis imperdiet.
                        Adipiscing vitae proin sagittis nisl rhoncus mattis
                        rhoncus urna. Imperdiet dui accumsan sit amet nulla
                        facilisi. Egestas dui id ornare arcu odio ut. Proin
                        sagittis nisl rhoncus mattis. Ut consequat semper
                        viverra nam libero. Vitae turpis massa sed elementum
                        tempus. Id nibh tortor id aliquet lectus proin.
                        Pellentesque adipiscing commodo elit at. Volutpat
                        blandit aliquam etiam erat. Tristique nulla aliquet enim
                        tortor at auctor urna nunc id. Lorem ipsum dolor sit
                        amet consectetur adipiscing elit duis tristique.
                        Pellentesque massa placerat duis ultricies. Mauris sit
                        amet massa vitae tortor condimentum lacinia quis. Dui id
                        ornare arcu odio. Dolor sit amet consectetur adipiscing
                        elit ut aliquam. Lorem ipsum dolor sit amet, consectetur
                        adipiscing elit, sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua. Velit egestas dui id
                        ornare. Convallis tellus id interdum velit laoreet id
                        donec. Neque volutpat ac tincidunt vitae. Enim praesent
                        elementum facilisis leo vel fringilla est ullamcorper.
                        Pellentesque habitant morbi tristique senectus et netus
                        et malesuada fames. Tellus orci ac auctor augue mauris
                        augue neque gravida. Elit ut aliquam purus sit amet
                        luctus venenatis. Quam pellentesque nec nam aliquam sem
                        et tortor. Erat pellentesque adipiscing commodo elit at
                        imperdiet dui accumsan sit. At augue eget arcu dictum
                        varius duis at consectetur lorem. Integer eget aliquet
                        nibh praesent tristique magna sit amet purus.
                        Consectetur adipiscing elit pellentesque habitant morbi
                        tristique. Montes nascetur ridiculus mus mauris vitae.
                        Pharetra sit amet aliquam id diam maecenas ultricies mi.
                        Aenean vel elit scelerisque mauris pellentesque pulvinar
                        pellentesque habitant. Nullam non nisi est sit amet
                        facilisis. Sed augue lacus viverra vitae congue eu
                        consequat. Convallis convallis tellus id interdum. Velit
                        ut tortor pretium viverra suspendisse potenti nullam ac
                        tortor. Quis risus sed vulputate odio ut enim blandit.
                        Fringilla phasellus faucibus scelerisque eleifend donec
                        pretium vulputate sapien. Euismod elementum nisi quis
                        eleifend quam. Diam vulputate ut pharetra sit amet
                        aliquam id diam maecenas. Orci porta non pulvinar neque
                        laoreet. Vel risus commodo viverra maecenas accumsan
                        lacus vel. Enim diam vulputate ut pharetra sit amet
                        aliquam id diam. Est pellentesque elit ullamcorper
                        dignissim cras tincidunt. Quam elementum pulvinar etiam
                        non quam lacus suspendisse faucibus. Lacus vel facilisis
                        volutpat est velit egestas dui id ornare. Egestas
                        integer eget aliquet nibh praesent tristique magna. Enim
                        neque volutpat ac tincidunt vitae semper quis lectus.
                        Sed pulvinar proin gravida hendrerit. Porta nibh
                        venenatis cras sed. Tristique senectus et netus et
                        malesuada. Nibh sit amet commodo nulla. Ullamcorper
                        malesuada proin libero nunc consequat interdum varius
                        sit. Consectetur libero id faucibus nisl tincidunt.
                        Volutpat consequat mauris nunc congue nisi vitae. A
                        scelerisque purus semper eget duis at. Sem fringilla ut
                        morbi tincidunt augue interdum velit euismod in. Massa
                        enim nec dui nunc mattis enim ut tellus. Urna porttitor
                        rhoncus dolor purus non enim praesent. Est sit amet
                        facilisis magna etiam tempor orci. Donec pretium
                        vulputate sapien nec sagittis aliquam malesuada.
                        Suscipit tellus mauris a diam maecenas. Nunc sed blandit
                        libero volutpat sed. Turpis egestas sed tempus urna et.
                        Vestibulum mattis ullamcorper velit sed ullamcorper. Est
                        pellentesque elit ullamcorper dignissim. Amet mauris
                        commodo quis imperdiet massa tincidunt nunc pulvinar.
                        Congue nisi vitae suscipit tellus mauris a diam maecenas
                        sed. Porttitor massa id neque aliquam vestibulum morbi
                        blandit cursus. Arcu vitae elementum curabitur vitae
                        nunc sed velit dignissim. Facilisis leo vel fringilla
                        est ullamcorper eget nulla facilisi etiam. Lacinia at
                        quis risus sed vulputate odio ut. Sed viverra tellus in
                        hac habitasse. Eget duis at tellus at. Molestie ac
                        feugiat sed lectus vestibulum mattis ullamcorper. At
                        consectetur lorem donec massa sapien faucibus et.
                        Vulputate mi sit amet mauris commodo quis imperdiet.
                        Adipiscing vitae proin sagittis nisl rhoncus mattis
                        rhoncus urna. Imperdiet dui accumsan sit amet nulla
                        facilisi. Egestas dui id ornare arcu odio ut. Proin
                        sagittis nisl rhoncus mattis. Ut consequat semper
                        viverra nam libero. Vitae turpis massa sed elementum
                        tempus. Id nibh tortor id aliquet lectus proin.
                        Pellentesque adipiscing commodo elit at. Volutpat
                        blandit aliquam etiam erat. Tristique nulla aliquet enim
                        tortor at auctor urna nunc id. Lorem ipsum dolor sit
                        amet consectetur adipiscing elit duis tristique.
                        Pellentesque massa placerat duis ultricies. Mauris sit
                        amet massa vitae tortor condimentum lacinia quis. Dui id
                        ornare arcu odio. Dolor sit amet consectetur adipiscing
                        elit ut aliquam. Lorem ipsum dolor sit amet, consectetur
                        adipiscing elit, sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua. Velit egestas dui id
                        ornare. Convallis tellus id interdum velit laoreet id
                        donec. Neque volutpat ac tincidunt vitae. Enim praesent
                        elementum facilisis leo vel fringilla est ullamcorper.
                        Pellentesque habitant morbi tristique senectus et netus
                        et malesuada fames. Tellus orci ac auctor augue mauris
                        augue neque gravida. Elit ut aliquam purus sit amet
                        luctus venenatis. Quam pellentesque nec nam aliquam sem
                        et tortor. Erat pellentesque adipiscing commodo elit at
                        imperdiet dui accumsan sit. At augue eget arcu dictum
                        varius duis at consectetur lorem. Integer eget aliquet
                        nibh praesent tristique magna sit amet purus.
                        Consectetur adipiscing elit pellentesque habitant morbi
                        tristique. Montes nascetur ridiculus mus mauris vitae.
                        Pharetra sit amet aliquam id diam maecenas ultricies mi.
                        Aenean vel elit scelerisque mauris pellentesque pulvinar
                        pellentesque habitant. Nullam non nisi est sit amet
                        facilisis. Sed augue lacus viverra vitae congue eu
                        consequat. Convallis convallis tellus id interdum. Velit
                        ut tortor pretium viverra suspendisse potenti nullam ac
                        tortor. Quis risus sed vulputate odio ut enim blandit.
                        Fringilla phasellus faucibus scelerisque eleifend donec
                        pretium vulputate sapien. Euismod elementum nisi quis
                        eleifend quam. Diam vulputate ut pharetra sit amet
                        aliquam id diam maecenas. Orci porta non pulvinar neque
                        laoreet. Vel risus commodo viverra maecenas accumsan
                        lacus vel. Enim diam vulputate ut pharetra sit amet
                        aliquam id diam. Est pellentesque elit ullamcorper
                        dignissim cras tincidunt. Quam elementum pulvinar etiam
                        non quam lacus suspendisse faucibus. Lacus vel facilisis
                        volutpat est velit egestas dui id ornare. Egestas
                        integer eget aliquet nibh praesent tristique magna. Enim
                        neque volutpat ac tincidunt vitae semper quis lectus.
                        Sed pulvinar proin gravida hendrerit. Porta nibh
                        venenatis cras sed. Tristique senectus et netus et
                        malesuada. Nibh sit amet commodo nulla. Ullamcorper
                        malesuada proin libero nunc consequat interdum varius
                        sit. Consectetur libero id faucibus nisl tincidunt.
                        Volutpat consequat mauris nunc congue nisi vitae. A
                        scelerisque purus semper eget duis at. Sem fringilla ut
                        morbi tincidunt augue interdum velit euismod in. Massa
                        enim nec dui nunc mattis enim ut tellus. Urna porttitor
                        rhoncus dolor purus non enim praesent. Est sit amet
                        facilisis magna etiam tempor orci. Donec pretium
                        vulputate sapien nec sagittis aliquam malesuada.
                        Suscipit tellus mauris a diam maecenas. Nunc sed blandit
                        libero volutpat sed. Turpis egestas sed tempus urna et.
                        Vestibulum mattis ullamcorper velit sed ullamcorper. Est
                        pellentesque elit ullamcorper dignissim. Amet mauris
                        commodo quis imperdiet massa tincidunt nunc pulvinar.
                        Congue nisi vitae suscipit tellus mauris a diam maecenas
                        sed. Porttitor massa id neque aliquam vestibulum morbi
                        blandit cursus. Arcu vitae elementum curabitur vitae
                        nunc sed velit dignissim. Facilisis leo vel fringilla
                        est ullamcorper eget nulla facilisi etiam. Lacinia at
                        quis risus sed vulputate odio ut. Sed viverra tellus in
                        hac habitasse. Eget duis at tellus at. Molestie ac
                        feugiat sed lectus vestibulum mattis ullamcorper. At
                        consectetur lorem donec massa sapien faucibus et.
                        Vulputate mi sit amet mauris commodo quis imperdiet.
                        Adipiscing vitae proin sagittis nisl rhoncus mattis
                        rhoncus urna. Imperdiet dui accumsan sit amet nulla
                        facilisi. Egestas dui id ornare arcu odio ut. Proin
                        sagittis nisl rhoncus mattis. Ut consequat semper
                        viverra nam libero. Vitae turpis massa sed elementum
                        tempus. Id nibh tortor id aliquet lectus proin.
                        Pellentesque adipiscing commodo elit at. Volutpat
                        blandit aliquam etiam erat. Tristique nulla aliquet enim
                        tortor at auctor urna nunc id. Lorem ipsum dolor sit
                        amet consectetur adipiscing elit duis tristique.
                        Pellentesque massa placerat duis ultricies. Mauris sit
                        amet massa vitae tortor condimentum lacinia quis. Dui id
                        ornare arcu odio. Dolor sit amet consectetur adipiscing
                        elit ut aliquam.
                    </div>
                </ScrollArea>
            </div>
            <Menu
                navigationItems={[
                    {
                        type: "page",
                        title: "Dialog",
                        href: "#dialog",
                    },
                    {
                        type: "page",
                        title: "Plugin placeholder",
                        href: "#webviz-plugin-placeholder",
                    },
                    {
                        type: "page",
                        title: "SmartNodeSelector",
                        href: "#smart-node-selector",
                    },
                ]}
            />
            {currentPage === "dialog" && (
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
                        backdrop={false}
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
            {currentPage === "webviz-plugin-placeholder" && (
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
                                url: "https://github.com/equinor/webviz-core-components",
                            },
                            {
                                message: "Deprecated 2",
                                url: "https://github.com/equinor/webviz-core-components",
                            },
                        ]}
                    />
                </>
            )}
            {currentPage === "smart-node-selector" && (
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
