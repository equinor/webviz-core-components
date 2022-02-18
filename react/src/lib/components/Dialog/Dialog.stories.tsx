import React from "react";

import { ComponentStory, ComponentMeta } from "@storybook/react";

import { DialogComponent, DialogProps } from "./components/DialogComponent";
import { Button } from "@material-ui/core";

export default {
    title: "Components/Dialog",
    component: DialogComponent,
    argTypes: {
        actions: { control: "array" },
    },
} as ComponentMeta<typeof DialogComponent>;

const Template: ComponentStory<typeof DialogComponent> = (
    args: DialogProps
) => {
    const { open, setProps, ...other } = args;
    const [dialogOpen, setDialogOpen] = React.useState<boolean>(open);
    return (
        <>
            <Button variant="outlined" onClick={() => setDialogOpen(true)}>
                Open dialog
            </Button>
            <DialogComponent
                open={dialogOpen}
                setProps={(newProps) => setDialogOpen(newProps.open)}
                {...other}
            />
        </>
    );
};

export const Basic = Template.bind({});
Basic.args = {
    id: "Dialog",
    title: "My Dialog",
    open: DialogComponent.defaultProps?.open || false,
    max_width: DialogComponent.defaultProps?.max_width || "md",
    full_screen: DialogComponent.defaultProps?.full_screen || false,
    draggable: DialogComponent.defaultProps?.draggable || false,
    children: [],
    actions: DialogComponent.defaultProps?.actions || [],
};
