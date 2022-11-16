import React from "react";

import { ComponentStory, ComponentMeta } from "@storybook/react";

import {
    DialogComponent as Dialog,
    DialogProps,
} from "./components/DialogComponent";
import { Button } from "@material-ui/core";

export default {
    title: "Components/Dialog",
    component: Dialog,
    argTypes: {
        actions: { control: "array" },
    },
} as ComponentMeta<typeof Dialog>;

const Template: ComponentStory<typeof Dialog> = (args: DialogProps) => {
    const { open, ...other } = args;
    const [dialogOpen, setDialogOpen] = React.useState<boolean>(open || false);
    return (
        <>
            <Button variant="outlined" onClick={() => setDialogOpen(true)}>
                Open dialog
            </Button>
            <Dialog
                {...other}
                open={dialogOpen}
                setProps={(newProps) => setDialogOpen(newProps.open)}
            />
        </>
    );
};

export const Basic = Template.bind({});
Basic.args = {
    id: "Dialog",
    title: "My Dialog",
    open: Dialog.defaultProps?.open || false,
    max_width: Dialog.defaultProps?.max_width || "md",
    full_screen: Dialog.defaultProps?.full_screen || false,
    draggable: Dialog.defaultProps?.draggable || false,
    children: [],
    actions: Dialog.defaultProps?.actions || [],
};
