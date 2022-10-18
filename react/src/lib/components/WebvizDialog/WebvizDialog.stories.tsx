import React from "react";

import { ComponentStory, ComponentMeta } from "@storybook/react";

import { WebvizDialog, WebvizDialogProps } from "./WebvizDialog";
import { Button } from "@material-ui/core";

export default {
    title: "Components/WebvizDialog",
    subcomponents: { WebvizDialog },
    argTypes: { actions: { control: "array" } },
} as ComponentMeta<typeof WebvizDialog>;

const Template: ComponentStory<typeof WebvizDialog> = (
    args: WebvizDialogProps
) => {
    const { open, ...other } = args;
    const [dialogOpen, setDialogOpen] = React.useState<boolean>(open || false);
    return (
        <>
            <Button variant="outlined" onClick={() => setDialogOpen(true)}>
                {`Open ${other.id}`}
            </Button>
            <WebvizDialog
                {...other}
                open={dialogOpen}
                setProps={(newProps) => setDialogOpen(newProps.open)}
            >
                {other.modal
                    ? "This is a modal dialog. Closes when clicking on backdrop"
                    : "This is non-modal dialog"}
            </WebvizDialog>
        </>
    );
};

export const Basic = Template.bind({});
Basic.args = {
    id: "Dialog",
    title: "My Dialog Title",
    open: WebvizDialog.defaultProps?.open || false,
    modal: false,
    minWidth: WebvizDialog.defaultProps?.minWidth || 100,
    minHeight: WebvizDialog.defaultProps?.minHeight || 100,
    disableDraggable: WebvizDialog.defaultProps?.disableDraggable || false,
    disableEscapeKeyDown:
        WebvizDialog.defaultProps?.disableEscapeKeyDown || false,
    children: [],
    actions: ["Action 1", "Action 2"],
};

const ExampleMultipleDialogsTemplate: ComponentStory<typeof WebvizDialog> = (
    args
) => {
    const DialogProps: WebvizDialogProps = {
        id: "",
        title: "",
        open: false,
        modal: false,
        minWidth: WebvizDialog.defaultProps?.minWidth || 100,
        minHeight: WebvizDialog.defaultProps?.minHeight || 100,
        disableEscapeKeyDown:
            WebvizDialog.defaultProps?.disableEscapeKeyDown || false,
        children: [],
        actions: WebvizDialog.defaultProps?.actions || [],
        setProps: () => {
            return;
        },
    };

    const [firstDialogOpen, setFirstDialogOpen] =
        React.useState<boolean>(false);
    const [secondDialogOpen, setSecondDialogOpen] =
        React.useState<boolean>(false);
    const [modalDialogOpen, setModalDialogOpen] =
        React.useState<boolean>(false);
    return (
        <>
            <div style={{ marginBottom: 20 }}>
                This is a pre-configured advanced example to show the
                functionality for interacting with multiple WebvizDialog
                components at the same time. The example consist of 3 dialogs,
                two non-modal dialogs and one modal dialog. The dialogs can be
                opened and the active dialog is shown on top with a shadow to
                highlight it being the currently active dialog. When the modal
                dialog is opened, it is placed on top, with a backdrop to fade
                out the background. The modal dialog is closed when clicking on
                the backdrop, or by regular close actions as pushing the close
                button or escape button (if not disabled).
            </div>
            <Button variant="outlined" onClick={() => setFirstDialogOpen(true)}>
                Open First Dialog
            </Button>
            <Button
                variant="outlined"
                onClick={() => setSecondDialogOpen(true)}
            >
                Open second Dialog
            </Button>
            <Button variant="outlined" onClick={() => setModalDialogOpen(true)}>
                Open Modal Dialog
            </Button>
            <WebvizDialog
                {...DialogProps}
                id={"First Dialog"}
                title={"First Dialog Title"}
                open={firstDialogOpen}
                actions={args.actions}
                disableDraggable={false}
                disableEscapeKeyDown={args.disableEscapeKeyDown}
                setProps={(newProps) => setFirstDialogOpen(newProps.open)}
            >
                <div style={{ width: 400 }}>
                    This is the content of the first dialog
                </div>
            </WebvizDialog>
            <WebvizDialog
                {...DialogProps}
                id={"Second Dialog"}
                title={"Second Dialog Title"}
                open={secondDialogOpen}
                actions={args.actions}
                disableDraggable={false}
                disableEscapeKeyDown={args.disableEscapeKeyDown}
                setProps={(newProps) => setSecondDialogOpen(newProps.open)}
            >
                This is the content of the second dialog
            </WebvizDialog>
            <WebvizDialog
                {...DialogProps}
                id={"Modal Dialog"}
                title={"Modal Dialog Title"}
                open={modalDialogOpen}
                modal={true}
                actions={args.actions}
                disableDraggable={false}
                disableEscapeKeyDown={args.disableEscapeKeyDown}
                setProps={(newProps) => setModalDialogOpen(newProps.open)}
            >
                This is a modal dialog. Closes when clicking on backdrop
            </WebvizDialog>
        </>
    );
};

export const ExampleMultipleDialogs = ExampleMultipleDialogsTemplate.bind({});
ExampleMultipleDialogs.args = {
    disableEscapeKeyDown:
        WebvizDialog.defaultProps?.disableEscapeKeyDown || false,
    actions: WebvizDialog.defaultProps?.actions || [],
};
