import React from "react";
import PropTypes from "prop-types";

import {
    Button,
    Dialog as MuiDialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";

import { Icon } from "@equinor/eds-core-react";
import { close } from "@equinor/eds-icons";

Icon.add({ close });

import { DraggablePaperComponent } from "./components/DraggablePaperComponent";

type DialogProps = {
    id: string;
    open?: boolean;
    draggable?: boolean;
    title: string;
    children?: React.ReactNode;
    onClose?: (reason: string) => void;
    onCancel?: () => void;
    onSave?: () => void;
    onOk?: () => void;
    onAgree?: () => void;
    onDisagree?: () => void;
};

/**
 * A modal dialog component with optional buttons. Can be set to be draggable.
 */
export const Dialog: React.FC<DialogProps> = (props) => {
    const [open, setOpen] = React.useState<boolean>(props.open || false);

    React.useEffect(() => {
        setOpen(props.open || false);
    }, [props.open]);

    const handleClose = (reason: string) => {
        setOpen(false);
        if (props.onClose) {
            props.onClose(reason);
        }
    };

    return (
        <MuiDialog
            id={props.id}
            open={open}
            onClose={(_: React.MouseEvent<HTMLAnchorElement>, reason: string) =>
                handleClose(reason)
            }
            PaperComponent={props.draggable ? DraggablePaperComponent : Paper}
            aria-labelledby="dialog-title"
        >
            <DialogTitle
                style={{ cursor: props.draggable ? "move" : "default" }}
                id="draggable-dialog-title"
            >
                <Typography variant="h6">{props.title}</Typography>
                <IconButton
                    aria-label="close"
                    onClick={() => handleClose("dialog-button-click")}
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
                {props.onClose && (
                    <Button
                        component="button"
                        onClick={() =>
                            props.onClose && props.onClose("button-click")
                        }
                    >
                        Close
                    </Button>
                )}
                {props.onCancel && (
                    <Button
                        component="button"
                        onClick={() => props.onCancel && props.onCancel()}
                    >
                        Cancel
                    </Button>
                )}
                {props.onDisagree && (
                    <Button
                        component="button"
                        onClick={() => props.onDisagree && props.onDisagree()}
                    >
                        Disagree
                    </Button>
                )}
                {props.onAgree && (
                    <Button
                        component="button"
                        onClick={() => props.onAgree && props.onAgree()}
                    >
                        Agree
                    </Button>
                )}
                {props.onOk && (
                    <Button
                        component="button"
                        onClick={() => props.onOk && props.onOk()}
                    >
                        OK
                    </Button>
                )}
                {props.onSave && (
                    <Button
                        component="button"
                        onClick={() => props.onSave && props.onSave()}
                    >
                        Save
                    </Button>
                )}
            </DialogActions>
        </MuiDialog>
    );
};

Dialog.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks.
     */
    id: PropTypes.string.isRequired,
    /**
     * States if the dialog is open or not.
     */
    open: PropTypes.bool,
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
     * If defined, a "close" button is shown. Called when the dialog is closed.
     */
    onClose: PropTypes.func,
    /**
     * If defined, a "cancel" button is shown. Called when the cancel button is pressed.
     */
    onCancel: PropTypes.func,
    /**
     * If defined, a "disagree" button is shown. Called when the disagree button is pressed.
     */
    onDisagree: PropTypes.func,
    /**
     * If defined, a "save" button is shown. Called when the save button is pressed.
     */
    onSave: PropTypes.func,
    /**
     * If defined, an "ok" button is shown. Called when the ok button is pressed.
     */
    onOk: PropTypes.func,
    /**
     * If defined, an "agree" button is shown. Called when the agree button is pressed.
     */
    onAgree: PropTypes.func,
};
