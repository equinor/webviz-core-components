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
    id: string;
    open?: boolean;
    modal?: boolean; // Instead of backdrop prop?
    title: string;
    actions?: string[];
    children?: React.ReactNode;
    setProps: (parentProps: WebvizDialogParentProps) => void;
};

export const WebvizDialog: React.FC<WebvizDialogProps> = (props) => {
    const [open, setOpen] = React.useState<boolean>(props.open || false);
    const [dialogPosition, setDialogPosition] = React.useState<Point>(ORIGIN);
    // const [dialogWidth, setDialogWidth] =
    //     React.useState<number | undefined>(undefined);

    const dialogRef = React.useRef<HTMLDivElement>(null);
    const dialogTitleRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setOpen(props.open || false);
        // if (dialogRef.current) {
        //     setDialogPosition({
        //         x: parseInt(dialogRef.current.style.left),
        //         y: parseInt(dialogRef.current.style.top),
        //     });
        // }
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
            setDialogPosition(ORIGIN);
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

        let mouseDownPosition: Point = { x: 0, y: 0 };
        let moveStarted: boolean = false;

        const handleMouseDown = (e: MouseEvent) => {
            mouseDownPosition.x = e.clientX; // e.pageX?
            mouseDownPosition.y = e.clientY; // e.pageY?

            const handleMouseMove = (e: MouseEvent) => {
                const currentMousePosition = { x: e.clientX, y: e.clientY }; // { x: e.pageX, y: e.pageY };
                const delta = pointDifference(
                    currentMousePosition,
                    mouseDownPosition
                );

                if (!moveStarted) {
                    if (vectorLength(delta) > MANHATTAN_LENGTH) {
                        moveStarted = true;
                    }
                } else {
                    setDialogPosition(pointSum(delta, dialogPosition));
                }
            };
            const handleMouseUp = (e: MouseEvent) => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp, true);
                if (moveStarted === true) {
                    e.stopPropagation();
                }
                moveStarted = false;
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
    }, [
        dialogRef.current,
        dialogTitleRef.current,
        dialogPosition,
        setDialogPosition,
    ]);

    // React.useEffect(() => {
    //     if (!dialogRef.current) {
    //         return;
    //     }

    //     const handleResize = () => {
    //         if (!dialogWidth) {
    //             return;
    //         }

    //         let tmp = dialogWidth || 0;

    //         const windowWidth = document.body.getBoundingClientRect().width;
    //         const newDialogWidth = Math.floor(
    //             tmp - 64 - Math.floor(dialogPosition.x)
    //         );

    //         if (windowWidth < dialogWidth + 64 + Math.floor(dialogPosition.x)) {
    //             setDialogWidth(newDialogWidth);
    //         }
    //     };

    //     const resizeObserver = new ResizeObserver(handleResize);

    //     if (document.body) {
    //         resizeObserver.observe(document.body);
    //     }
    //     return () => {
    //         resizeObserver.disconnect();
    //     };
    // }, [dialogRef.current, document, dialogPosition, setDialogWidth]);

    React.useEffect(() => {
        // TEMP
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
                // width: dialogWidth ? dialogWidth : "auto",
                // maxWidth: `calc(100% - 64px - ${Math.floor(
                //     dialogPosition.x
                // )}px)`,
            }}
            onMouseDown={() => handleSetActive()}
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
    id: PropTypes.string.isRequired,
    open: PropTypes.bool,
    modal: PropTypes.bool,
    title: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]),
    actions: PropTypes.arrayOf(PropTypes.string.isRequired),
    setProps: PropTypes.func.isRequired,
};

WebvizDialog.defaultProps = {
    open: false,
    modal: false,
    children: [],
    actions: [],
    setProps: () => {
        return;
    },
};
