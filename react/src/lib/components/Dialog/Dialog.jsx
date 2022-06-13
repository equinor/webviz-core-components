import React from "react";
import PropTypes from "prop-types";

import { DialogComponent } from "./components/DialogComponent";

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
     * Set to false if you do not want to have a backdrop behind the dialog.
     */
    backdrop: PropTypes.bool,
    /**
     * A list of actions to be displayed as buttons in the lower right corner of the dialog.
     */
    actions: PropTypes.arrayOf(PropTypes.string.isRequired),
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

const defaultProps = {
    open: false,
    max_width: "md",
    draggable: false,
    full_screen: false,
    children: [],
    actions: [],
    last_action_called: "",
    actions_called: 0,
    setProps: () => {
        return;
    },
};

/**
 * A modal dialog component with optional buttons. Can be set to be draggable.
 */
export const Dialog = (props) => {
    return <DialogComponent {...props} />;
};

Dialog.propTypes = propTypes;
Dialog.defaultProps = defaultProps;
