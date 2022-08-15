import React from "react";
import PropTypes from "prop-types";

import {
    Button,
    Dialog as MuiDialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";

import { Icon } from "@equinor/eds-core-react";
import { close } from "@equinor/eds-icons";

Icon.add({ close });

import { DraggablePaperComponent } from "./DraggablePaperComponent";

export type DialogParentProps = {
    /**
     * States if the dialog is open or not.
     */
    open: boolean;
    /**
     * A counter for how often actions have been called so far.
     */
    actions_called?: number;
    /**
     * The name of the action that was called last.
     */
    last_action_called?: string;
};

export type DialogProps = {
    /**
     * The ID used to identify this component in Dash callbacks.
     */
    id: string;
    /**
     * States if the dialog is open or not.
     */
    open?: boolean;
    /**
     * Width of the dialog. Can be one of 'xs' | 'sm' | 'md' | 'lg' | 'xl'.
     */
    max_width?: "xs" | "sm" | "md" | "lg" | "xl";
    /**
     * Set to true to show the dialog fullscreen.
     */
    full_screen?: boolean;
    /**
     * Set to true if the dialog shall be draggable.
     */
    draggable?: boolean;
    /**
     * The title of the dialog.
     */
    title: string;
    /**
     * The child elements showed in the dialog
     */
    children?: React.ReactNode;
    /**
     * Set to false if you do not want to have a backdrop behind the dialog.
     */
    backdrop?: boolean;
    /**
     * A list of actions to be displayed as buttons in the lower right corner of the dialog.
     */
    actions?: string[];
    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change.
     */
    setProps: (parentProps: DialogParentProps) => void;
};

/**
 * A modal dialog component with optional buttons. Can be set to be draggable.
 */
export const DialogComponent: React.FC<DialogProps> = (props) => {
    const [open, setOpen] = React.useState<boolean>(props.open || false);

    const [actionsCalled, setActionsCalled] = React.useState<number>(0);

    React.useEffect(() => {
        setOpen(props.open || false);
    }, [props.open]);

    const handleClose = (reason: string) => {
        if (reason === "backdropClick" && !props.backdrop) {
            return;
        }
        setOpen(false);
        props.setProps({ open: false });
    };

    const handleButtonClick = (action: string) => {
        props.setProps({
            last_action_called: action,
            open: open,
            actions_called: actionsCalled + 1,
        });
        setActionsCalled(actionsCalled + 1);
    };

    const content = (
        <div style={{ pointerEvents: "all" }}>
            <DialogTitle
                style={{
                    cursor: props.draggable ? "move" : "default",
                    marginRight: 32,
                }}
                id="draggable-dialog-title"
            >
                {props.title}
                <IconButton
                    aria-label="close"
                    onClick={() => handleClose("buttonClick")}
                    style={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: "#ccc",
                    }}
                >
                    <Icon name="close" />
                </IconButton>
            </DialogTitle>
            <DialogContent>{props.children}</DialogContent>
            <DialogActions>
                {props.actions &&
                    props.actions.map((action) => (
                        <Button
                            key={action}
                            component="button"
                            onClick={() => handleButtonClick(action as string)}
                        >
                            {action}
                        </Button>
                    ))}
            </DialogActions>
        </div>
    );

    return (
        <MuiDialog
            id={props.id}
            open={open}
            onClose={(_, reason) => handleClose(reason)}
            hideBackdrop={!props.backdrop}
            PaperComponent={props.draggable ? DraggablePaperComponent : Paper}
            aria-labelledby="draggable-dialog-title"
            maxWidth={
                (props.max_width as "xs" | "sm" | "md" | "lg" | "xl" | null) ||
                false
            }
            fullScreen={props.full_screen}
            scroll="body"
            style={{ pointerEvents: "none" }}
        >
            {content}
        </MuiDialog>
    );
};

DialogComponent.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks.
     */
    id: PropTypes.string.isRequired,
    /**
     * States if the dialog is open or not.
     */
    open: PropTypes.bool,
    /**
     * Width of the dialog. Can be one of 'xs' | 'sm' | 'md' | 'lg' | 'xl'.
     */
    max_width: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
    /**
     * Set to true to show the dialog fullscreen.
     */
    full_screen: PropTypes.bool,
    /**
     * Set to true if the dialog shall be draggable.
     */
    draggable: PropTypes.bool,
    /**
     * The title of the dialog.
     */
    title: PropTypes.string.isRequired,
    /**
     * The child elements showed in the dialog
     */
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]),
    /**
     * Set to false if you do not want to have a backdrop behind the dialog.
     */
    backdrop: PropTypes.bool,
    /**
     * A list of actions to be displayed as buttons in the lower right corner of the dialog.
     */
    actions: PropTypes.arrayOf(PropTypes.string.isRequired),
    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change.
     */
    setProps: PropTypes.func.isRequired,
};

DialogComponent.defaultProps = {
    open: false,
    max_width: "md",
    draggable: false,
    full_screen: false,
    children: [],
    actions: [],
    setProps: () => {
        return;
    },
};
