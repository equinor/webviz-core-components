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
Basic.args = {
    id: WebvizPluginPlaceholder.defaultProps?.id || "some-id",
    children: WebvizPluginPlaceholder.defaultProps?.children || [],
    buttons: WebvizPluginPlaceholder.defaultProps?.buttons || [],
    contact_person: WebvizPluginPlaceholder.defaultProps?.contact_person || {},
    download: WebvizPluginPlaceholder.defaultProps?.download || null,
    screenshot_filename:
        WebvizPluginPlaceholder.defaultProps?.screenshot_filename ||
        "webviz-screenshot.png",
    tour_steps: WebvizPluginPlaceholder.defaultProps?.tour_steps || [],
    data_requested: WebvizPluginPlaceholder.defaultProps?.data_requested || 0,
    deprecation_warnings:
        WebvizPluginPlaceholder.defaultProps?.deprecation_warnings || [],
    feedback_url: WebvizPluginPlaceholder.defaultProps?.feedback_url || "",
};
