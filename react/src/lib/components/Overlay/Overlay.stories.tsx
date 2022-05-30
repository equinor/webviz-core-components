import React from "react";

import { ComponentStory, ComponentMeta } from "@storybook/react";

import { Overlay, OverlayProps } from "./Overlay";

export default {
    title: "Components/Overlay",
    component: Overlay,
} as ComponentMeta<typeof Overlay>;

const Template: ComponentStory<typeof Overlay> = (args: OverlayProps) => (
    <Overlay {...args} />
);

export const Basic = Template.bind({});
Basic.args = {
    visible: false,
};
