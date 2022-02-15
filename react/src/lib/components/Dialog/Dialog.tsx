import React from "react";
import PropTypes, { InferProps } from "prop-types";

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

import {
    getPropsWithMissingValuesSetToDefault,
    Optionals,
} from "../../utils/DefaultPropsHelpers";
import { DraggablePaperComponent } from "./components/DraggablePaperComponent";

const propTypes = {
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
     * A list of actions to be displayed as buttons in the lower right corner of the dialog.
     */
    actions: PropTypes.arrayOf(PropTypes.string),
    /**
     *
     */
    action_called: PropTypes.string,
    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change.
     */
    setProps: PropTypes.func,
};

const defaultProps: Optionals<InferProps<typeof propTypes>> = {
    open: false,
    draggable: false,
    children: null,
    actions: [],
    action_called: null,
    setProps: () => {
        return;
    },
};

/**
 * A modal dialog component with optional buttons. Can be set to be draggable.
 */
export const Dialog: React.FC<InferProps<typeof propTypes>> = (props) => {
    const adjustedProps = getPropsWithMissingValuesSetToDefault(
        props,
        defaultProps
    );

    const [open, setOpen] = React.useState<boolean>(
        adjustedProps.open || false
    );

    React.useEffect(() => {
        setOpen(adjustedProps.open || false);
        adjustedProps.setProps({ action_called: null });
    }, [adjustedProps.open]);

    React.useEffect(() => {
        adjustedProps.setProps({ action_called: null });
    }, [adjustedProps.action_called]);

    const handleClose = () => {
        setOpen(false);
        adjustedProps.setProps({ open: false });
    };

    const handleButtonClick = (action: string) => {
        adjustedProps.setProps({ action_called: action });
    };

    return (
        <MuiDialog
            id={props.id}
            open={open}
            onClose={() => handleClose()}
            PaperComponent={
                adjustedProps.draggable ? DraggablePaperComponent : Paper
            }
            aria-labelledby="dialog-title"
        >
            <DialogTitle
                style={{ cursor: adjustedProps.draggable ? "move" : "default" }}
                id="draggable-dialog-title"
            >
                <Typography variant="h6">{adjustedProps.title}</Typography>
                <IconButton
                    aria-label="close"
                    onClick={() => handleClose()}
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
            <DialogContent>{adjustedProps.children}</DialogContent>
            <DialogActions>
                {adjustedProps.actions.map((action) => (
                    <Button
                        key={action}
                        component="button"
                        onClick={() => handleButtonClick(action as string)}
                    >
                        {action}
                    </Button>
                ))}
            </DialogActions>
        </MuiDialog>
    );
};

Dialog.propTypes = propTypes;
