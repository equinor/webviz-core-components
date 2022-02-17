import React from "react";

import { ComponentStory, ComponentMeta } from "@storybook/react";

import { DialogComponent, DialogProps } from "./components/DialogComponent";

export default {
    title: "Components/Dialog",
    component: DialogComponent,
    argTypes: {
        actions: { control: "array" },
    },
} as ComponentMeta<typeof DialogComponent>;

const Template: ComponentStory<typeof DialogComponent> = (
    args: DialogProps
) => <DialogComponent {...args} />;

export const Basic = Template.bind({});
Basic.args = {
    id: "Dialog",
    title: "My Dialog",
};
