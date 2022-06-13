import React from "react";

import { Meta, Story } from "@storybook/react";

import { ColorScales, ColorScalesProps } from ".";
import { DEFAULT_SCALE } from "./ColorScales";

export default {
    title: "Components/ColorScales",
    component: ColorScales,
    argTypes: {
        fixSwatches: {
            type: "boolean",
        },
    },
} as Meta;

const Template: Story<ColorScalesProps> = (args) => <ColorScales {...args} />;

export const Basic = Template.bind({});
Basic.args = {
    id: "ColorScales",
    colorscale: DEFAULT_SCALE,
    fixSwatches: false,
    nSwatches: DEFAULT_SCALE.length,
};
