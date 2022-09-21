import React from "react";
import * as ReactDOM from "react-dom";
import PropTypes from "prop-types";

import { Button } from "@material-ui/core";

import { WebvizDialogTitle } from "./components/WebvizDialogTitle/WebvizDialogTitle";
import { WebvizDialogActions } from "./components/WebvizDialogActions/WebvizDialogActions";
import { WebvizDialogContent } from "./components/WebvizDialogContent/WebvizDialogContent";
import "./webviz-dialog.css";

import { Point } from "../../shared-types/point";
import {
    MANHATTAN_LENGTH,
    ORIGIN,
    pointDifference,
    pointSum,
    vectorLength,
} from "../../utils/geometry";

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
    const [dialogPosition, setDialogPosition] = React.useState<Point>(ORIGIN);
    const referencePositionRef = React.useRef<Point>({ x: 1, y: 2 });
    const moveStarted = React.useRef<boolean>(false);

    const dialogRef = React.useRef<HTMLDivElement>(null);
    const dialogTitleRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setOpen(props.open || false);
        if (!props.open && dialogRef.current) {
            dialogRef.current.className = "WebvizDialogInactive";
        }
        if (props.open) {
            handleSetActive();
        } else {
        }
    }, [props.open, dialogRef.current]);

    const handleClose = React.useCallback(
        (reason: "backdropClick" | "buttonClick") => {
            if (reason === "backdropClick" && !props.modal) {
                return;
            }
            setOpen(false);

            props.setProps({ open: false });
        },
        [props.modal, props.setProps, dialogRef.current]
    );

    const handleSetActive = React.useCallback(() => {
        if (!dialogRef.current) {
            return;
        }

        let activeDialogs = Array.from(
            document.getElementsByClassName("WebvizDialogActive")
        );
        for (let elm of activeDialogs) {
            if (elm.id !== props.id) {
                elm.className = "WebvizDialogInactive";
            }
        }

        if (dialogRef.current.className !== "WebvizDialogActive") {
            dialogRef.current.className = "WebvizDialogActive";
        }
    }, [document, dialogRef.current]);

    // Add Event listener for mouse down, move and mouse up
    // Update drag position

    // Add managing of z-index, highlighting for active dialog
    // - On focus
    // - isActive dialog

    React.useEffect(() => {
        if (!dialogRef.current || !dialogTitleRef.current) {
            return;
        }

        const handleMouseDown = () => {
            const handleMouseMove = (e: MouseEvent) => {
                const referencePosition = referencePositionRef.current;
                const currentMousePosition = { x: e.pageX, y: e.pageY };
                const delta = pointDifference(
                    currentMousePosition,
                    referencePosition
                );

                if (!moveStarted.current) {
                    if (vectorLength(delta) > MANHATTAN_LENGTH) {
                        moveStarted.current = true;
                    }
                } else {
                    referencePositionRef.current = currentMousePosition;
                    setDialogPosition((movePosition) =>
                        pointSum(movePosition, delta)
                    );
                }
                dialogRef.current?.style.left;
                dialogRef.current?.style.right;
            };
            const handleMouseUp = (e: MouseEvent) => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp, true);
                if (moveStarted.current === true) {
                    e.stopPropagation();
                }
                moveStarted.current = false;
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        };

        dialogTitleRef.current.addEventListener("mousedown", handleMouseDown);

        return () => {
            if (dialogTitleRef.current) {
                dialogTitleRef.current.removeEventListener(
                    "mousedown",
                    handleMouseDown
                );
            }
        };
        // Handle mouse down
        // Handle mouse move
        // Handle mouse up
    }, [
        dialogRef.current,
        dialogTitleRef.current,
        moveStarted,
        setDialogPosition,
    ]);

    React.useEffect(() => {
        console.log(dialogPosition);
    }, [dialogPosition]);

    return ReactDOM.createPortal(
        <div
            className={"WebvizDialogInactive"}
            id={props.id}
            ref={dialogRef}
            style={{
                display: open ? "block" : "none",
                left: Math.floor(dialogPosition.x),
                top: Math.floor(dialogPosition.y),
            }}
            onClick={() => handleSetActive()}
        >
            <WebvizDialogTitle
                id="webviz-dialog-title"
                onClose={() => handleClose("buttonClick")}
                ref={dialogTitleRef}
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
