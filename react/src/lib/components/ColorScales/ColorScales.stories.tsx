import React from "react";

import { Meta, Story } from "@storybook/react";

import { ColorScales, ColorScalesProps } from ".";

export default {
    title: "Components/ColorScales",
    component: ColorScales,
} as Meta;

const Template: Story<ColorScalesProps> = (args) => <ColorScales {...args} />;

export const Basic = Template.bind({});
Basic.args = {
    id: "ColorScales",
};
