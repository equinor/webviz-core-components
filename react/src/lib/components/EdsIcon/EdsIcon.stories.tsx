import React from "react";

import { ComponentStory, ComponentMeta } from "@storybook/react";

import { EdsIcon, EdsIconProps } from "./EdsIcon";

export default {
    title: "Components/EdsIcon",
    component: EdsIcon,
} as ComponentMeta<typeof EdsIcon>;

const Template: ComponentStory<typeof EdsIcon> = (args: EdsIconProps) => (
    <EdsIcon {...args} />
);

export const Basic = Template.bind({});
Basic.args = {
    id: "Icon",
    color: "#000000",
    size: 32,
    icon: "world",
};
