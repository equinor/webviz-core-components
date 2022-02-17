import React from "react";

import { ComponentStory, ComponentMeta } from "@storybook/react";

import { WebvizPluginPlaceholder } from "./WebvizPluginPlaceholder";

export default {
    title: "Components/WebvizPluginPlaceholder",
    component: WebvizPluginPlaceholder,
} as ComponentMeta<typeof WebvizPluginPlaceholder>;

const Template: ComponentStory<typeof WebvizPluginPlaceholder> = (args) => (
    <WebvizPluginPlaceholder {...args} />
);

export const Basic = Template.bind({});
Basic.args = {};
