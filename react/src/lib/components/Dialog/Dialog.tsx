import React from "react";
import PropTypes, { InferProps } from "prop-types";

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
     * A list of actions to be displayed as buttons in the lower right corner of the dialog.
     */
    actions: PropTypes.arrayOf(PropTypes.string),
    /**
     * The name of the action that was called last.
     */
    last_action_called: PropTypes.string,
    /**
     * A counter for how often actions have been called so far.
     */
    actions_called: PropTypes.number,
    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change.
     */
    setProps: PropTypes.func,
};

const defaultProps: Optionals<InferProps<typeof propTypes>> = {
    open: false,
    max_width: null,
    draggable: false,
    full_screen: false,
    children: null,
    actions: [],
    last_action_called: null,
    actions_called: 0,
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

    const [actionsCalled, setActionsCalled] = React.useState<number>(0);

    React.useEffect(() => {
        setOpen(adjustedProps.open || false);
    }, [adjustedProps.open]);

    const handleClose = () => {
        setOpen(false);
        adjustedProps.setProps({ open: false });
    };

    const handleButtonClick = (action: string) => {
        adjustedProps.setProps({
            action_called: action,
            open: open,
            actions_called: actionsCalled + 1,
        });
        setActionsCalled(actionsCalled + 1);
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
            maxWidth={
                (adjustedProps.max_width as
                    | "xs"
                    | "sm"
                    | "md"
                    | "lg"
                    | "xl"
                    | null) || false
            }
            fullScreen={adjustedProps.full_screen}
            scroll="body"
        >
            <DialogTitle
                style={{
                    cursor: adjustedProps.draggable ? "move" : "default",
                    marginRight: 32,
                }}
                id="draggable-dialog-title"
            >
                {adjustedProps.title}
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
