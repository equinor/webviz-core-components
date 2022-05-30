import React from "react";

import { Meta, Story } from "@storybook/react";

import { SmartNodeSelector } from "./SmartNodeSelector";
import SmartNodeSelectorComponent, {
    SmartNodeSelectorPropsType,
} from "./components/SmartNodeSelectorComponent";

export default {
    title: "Components/SmartNodeSelector",
    component: SmartNodeSelector,
} as Meta;

const Template: Story<SmartNodeSelectorPropsType> = (args) => (
    <SmartNodeSelectorComponent {...args} />
);

export const Basic = Template.bind({});
Basic.args = {
    id: "SmartNodeSelector",
    delimiter: SmartNodeSelector.defaultProps?.delimiter || ":",
    maxNumSelectedNodes:
        SmartNodeSelector.defaultProps?.maxNumSelectedNodes || 1,
    numMetaNodes: 2,
    label: "SmartNodeSelector",
    showSuggestions: SmartNodeSelector.defaultProps?.showSuggestions || true,
    numSecondsUntilSuggestionsAreShown:
        SmartNodeSelector.defaultProps?.numSecondsUntilSuggestionsAreShown || 1,
    caseInsensitiveMatching:
        SmartNodeSelector.defaultProps?.caseInsensitiveMatching || false,
    placeholder:
        SmartNodeSelector.defaultProps?.placeholder || "Add new tag...",
    lineBreakAfterTag:
        SmartNodeSelector.defaultProps?.lineBreakAfterTag || false,
    useBetaFeatures: SmartNodeSelector.defaultProps?.useBetaFeatures || false,
    selectedTags: [],
    persistence: SmartNodeSelector.defaultProps?.persistence || false,
    persisted_props: SmartNodeSelector.defaultProps?.persisted_props || [
        "selectedTags",
    ],
    persistence_type:
        (SmartNodeSelector.defaultProps?.persistence_type as
            | "local"
            | "session"
            | "memory") || "local",
    setProps: () => {
        return;
    },
    data: [
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
                                },
                                {
                                    id: "1.1.1.5",
                                    name: "Subnode 5",
                                    description: "A first sub node",
                                },
                                {
                                    id: "1.1.1.6",
                                    name: "Subnode 6",
                                    description: "A second sub node",
                                },
                                {
                                    id: "1.1.1.7",
                                    name: "Subnode 7",
                                    description: "A third sub node",
                                },
                                {
                                    id: "1.1.1.8",
                                    name: "Subnode 8",
                                    description: "A fourth sub node",
                                },
                                {
                                    id: "1.1.1.9",
                                    name: "Subnode 9",
                                    description: "A first sub node",
                                },
                                {
                                    id: "1.1.1.10",
                                    name: "Subnode 10",
                                    description: "A second sub node",
                                },
                                {
                                    id: "1.1.1.11",
                                    name: "Subnode 11",
                                    description: "A third sub node",
                                },
                                {
                                    id: "1.1.1.12",
                                    name: "Subnode 12",
                                    description: "A fourth sub node",
                                },
                            ],
                        },
                        {
                            id: "1.1.2",
                            name: "Node 2",
                            description: "A second data node",
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
                                },
                            ],
                        },
                        {
                            id: "2.1.2",
                            name: "Node 2",
                            description: "A second data node",
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
    ],
};
