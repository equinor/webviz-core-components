import React from "react";
import * as ReactDOM from "react-dom";
import PropTypes from "prop-types";

import { Button } from "@material-ui/core";

import { WebvizDialogTitle } from "./components/WebvizDialogTitle/WebvizDialogTitle";
import { WebvizDialogActions } from "./components/WebvizDialogActions/WebvizDialogActions";
import { WebvizDialogContent } from "./components/WebvizDialogContent/WebvizDialogContent";
import "./webviz-dialog.css";

export type WebvizDialogParentProps = { open: boolean };

export type WebvizDialogProps = {
    id?: string;
    open?: boolean;
    modal?: boolean; // Instead of backdrop prop?
    title: string;
    actions: string[];
    setProps: (parentProps: WebvizDialogParentProps) => void;
};

export const WebvizDialog: React.FC<WebvizDialogProps> = (props) => {
    const [open, setOpen] = React.useState<boolean>(props.open || false);
    const [isActive, setIsActive] = React.useState<boolean>(true);
    const [currentClassName, setCurrentClassName] =
        React.useState<string>("WebvizDialog");

    React.useEffect(() => {
        setOpen(props.open || false);
        setIsActive(true);
    }, [props.open]);

    React.useEffect(() => {
        if (isActive) {
            setCurrentClassName("WebvizDialogActive");
        } else {
            setCurrentClassName("WebvizDialogInactive");
        }
    }, [isActive]);

    const handleClose = React.useCallback(
        (reason: "backdropClick" | "buttonClick") => {
            if (reason === "backdropClick" && !props.modal) {
                return;
            }
            setOpen(false);
            props.setProps({ open: false });
        },
        [props.modal, props.setProps]
    );

    const handleSetActive = React.useCallback(() => {
        let activeDialogs = Array.from(
            document.getElementsByClassName("WebvizDialogActive")
        );
        for (let elm of activeDialogs) {
            elm.className = "WebvizDialogInactive";
        }
        setIsActive(true);
    }, [document]);

    // Add Event listener for mouse down, move and mouse up
    // Update drag position

    // Add managing of z-index, highlighting for active dialog
    // - On focus
    // - isActive dialog

    return ReactDOM.createPortal(
        <div
            className={currentClassName}
            style={{ display: open ? "block" : "none" }}
        >
            <WebvizDialogTitle
                id="webviz-dialog-title"
                onClose={() => handleClose("buttonClick")}
                onClick={() => handleSetActive()}
            >
                {props.title}
            </WebvizDialogTitle>
            <WebvizDialogContent id="webviz-dialog-content">
                {props.children}
            </WebvizDialogContent>
            <WebvizDialogActions>
                {props.actions &&
                    props.actions.map((action) => (
                        <Button
                            key={action}
                            component="button"
                            // onClick={() => handleButtonClick(action as string)}
                        >
                            {action}
                        </Button>
                    ))}
            </WebvizDialogActions>
        </div>,
        document.body
    );
};

WebvizDialog.propTypes = {
    id: PropTypes.string,
};
