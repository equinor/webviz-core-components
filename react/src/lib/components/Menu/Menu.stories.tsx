import React from "react";

import { ComponentStory, ComponentMeta } from "@storybook/react";

import { Menu, MenuProps } from "./Menu";

export default {
    title: "Components/Menu",
    component: Menu,
} as ComponentMeta<typeof Menu>;

const Template: ComponentStory<typeof Menu> = (args: MenuProps) => (
    <Menu {...args} />
);

export const Basic = Template.bind({});
Basic.args = {
    id: "Menu",
    navigationItems: [
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
    ],
    initiallyPinned: Menu.defaultProps?.initiallyPinned || false,
    initiallyCollapsed: Menu.defaultProps?.initiallyCollapsed || false,
    menuBarPosition: Menu.defaultProps?.menuBarPosition || "left",
    menuDrawerPosition: Menu.defaultProps?.menuDrawerPosition || "left",
    showLogo: Menu.defaultProps?.showLogo || true,
};
