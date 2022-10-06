import React from "react";
import * as ReactDOM from "react-dom";
import PropTypes from "prop-types";

import { Button } from "@material-ui/core";

import { WebvizDialogTitle } from "./components/WebvizDialogTitle/WebvizDialogTitle";
import "./webviz-dialog.css";

import { Point } from "../../shared-types/point";
import {
    MANHATTAN_LENGTH,
    pointDifference,
    pointSum,
    vectorLength,
    // isDOMRectContained,
} from "../../utils/geometry";
import { Backdrop } from "../Backdrop";

enum DialogCloseReason {
    BUTTON_CLICK,
    BACKDROP_CLICK,
}

export type WebvizDialogParentProps = {
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

export type WebvizDialogProps = {
    /**
     * The ID used to identify this component in Dash callbacks.
     */
    id: string;
    /**
     * States if the dialog is open or not.
     */
    open?: boolean;
    /**
     * Set to true to show dialog as modal
     */
    modal?: boolean; // Instead of backdrop prop?
    /**
     * The title of the dialog.
     */
    title: string;
    /**
     * Set the minimum width in px
     */
    min_width?: number;
    /**
     * A list of actions to be displayed as buttons in the lower right corner of the dialog.
     */
    actions?: string[];
    /**
     * The child elements showed in the dialog
     */
    children?: React.ReactNode;
    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change.
     */
    setProps: (parentProps: WebvizDialogParentProps) => void;
};

export const WebvizDialog: React.FC<WebvizDialogProps> = (props) => {
    const paddingLeft = 16;
    const paddingRight = 16;
    const initPosition: Point = { x: paddingLeft, y: 0 };

    const [open, setOpen] = React.useState<boolean>(props.open || false);
    const [actionsCalled, setActionsCalled] = React.useState<number>(0);
    const [dialogPosition, setDialogPosition] =
        React.useState<Point>(initPosition);

    const [runOpenDialogResizeEffect, setRunOpenDialogResizeEffect] =
        React.useState<boolean>(false);
    const [isMovedOutsideWindow, setIsMovedOutsideWindow] =
        React.useState<boolean>(false);

    const [minDialogWidth, setMinDialogWidth] = React.useState<number>(
        props.min_width || 0
    );
    const [dialogWidth, setDialogWidth] =
        React.useState<number | undefined>(undefined);
    const [initialDialogWidth, setInitialDialogWidth] =
        React.useState<number | null>(null);

    const dialogRef = React.useRef<HTMLDivElement>(null);
    const dialogTitleRef = React.useRef<HTMLDivElement>(null);
    const placeholderRef = React.useRef<HTMLDivElement | null>(null);

    const handleSetActive = React.useCallback(() => {
        const activeDialogs = Array.from(
            document.getElementsByClassName("WebvizDialog--active")
        );
        for (const elm of activeDialogs) {
            if (elm.id !== props.id) {
                elm.classList.remove("WebvizDialog--active");
            }
        }

        if (
            dialogRef.current &&
            !dialogRef.current?.classList.contains("WebvizDialog--active")
        ) {
            dialogRef.current.classList.add("WebvizDialog--active");
        }
    }, [document, dialogRef.current]);

    React.useEffect(() => {
        let node: HTMLDivElement | null = null;
        if (!document.getElementById("WebvizDialog__root")) {
            node = document.createElement("div");
            node.setAttribute("id", "WebvizDialog__root");
            document.body.appendChild(node);
        } else {
            node = document.getElementById(
                "WebvizDialog__root"
            ) as HTMLDivElement;
        }

        placeholderRef.current = document.createElement("div");
        node.appendChild(placeholderRef.current);

        return () => {
            if (placeholderRef.current) {
                placeholderRef.current.parentElement?.removeChild(
                    placeholderRef.current
                );
            }
            const dialogRoot = document.getElementById("WebvizDialog__root");
            if (dialogRoot) {
                const dialogNodes =
                    dialogRoot.getElementsByClassName("WebvizDialog");
                if (
                    (dialogNodes.length == 1 &&
                        dialogNodes[0] === dialogRef.current) ||
                    dialogNodes.length === 0
                ) {
                    document.body.removeChild(dialogRoot);
                }
            }
        };
    }, []);

    React.useEffect(() => {
        setMinDialogWidth(props.min_width || 0);
    }, [props.min_width]);

    React.useEffect(() => {
        setOpen(props.open || false);

        if (props.open && dialogRef.current) {
            handleSetActive();
            setRunOpenDialogResizeEffect(true);
        }
    }, [props.open, dialogRef.current]);

    const handleClose = React.useCallback(
        (reason: DialogCloseReason) => {
            if (reason == DialogCloseReason.BACKDROP_CLICK && !props.modal) {
                return;
            }
            setOpen(false);
            setDialogPosition(initPosition);
            props.setProps({ open: false });
        },
        [props.modal, props.setProps, dialogRef.current]
    );

    React.useEffect(() => {
        const handleResize = () => {
            if (dialogRef.current && open && runOpenDialogResizeEffect) {
                if (initialDialogWidth === null) {
                    setInitialDialogWidth(
                        dialogRef.current.getBoundingClientRect().width
                    );
                }

                const initialWidth =
                    initialDialogWidth !== null
                        ? initialDialogWidth
                        : dialogRef.current.getBoundingClientRect().width;
                const left = dialogRef.current.getBoundingClientRect().left;
                const adjustedWidth = Math.max(
                    minDialogWidth,
                    Math.min(
                        initialWidth,
                        window.innerWidth - left - paddingRight
                    )
                );
                setDialogWidth(adjustedWidth);
                setIsMovedOutsideWindow(
                    left < 0 || left + adjustedWidth > window.innerWidth
                );
                setRunOpenDialogResizeEffect(false);
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (dialogRef.current) {
            resizeObserver.observe(dialogRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [
        dialogRef.current,
        open,
        initialDialogWidth,
        runOpenDialogResizeEffect,
    ]);

    React.useLayoutEffect(() => {
        let prevMousePosition: Point = { x: 0, y: 0 };
        let isMouseDown = false;
        let isMoveStarted = false;

        const handleMouseDown = (e: MouseEvent) => {
            handleStartDrag(e.clientX, e.clientY);
        };

        const handleTouchStart = (e: TouchEvent) => {
            handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
        };

        const handleStartDrag = (clientX: number, clientY: number) => {
            prevMousePosition.x = clientX;
            prevMousePosition.y = clientY;
            isMouseDown = true;
            isMoveStarted = false;
        };

        const handleMouseUpAndTouchEnd = (e: MouseEvent | TouchEvent) => {
            if (isMoveStarted) {
                e.stopPropagation();
            }
            isMouseDown = false;
            isMoveStarted = false;
        };

        const handleMouseMove = (e: MouseEvent) => {
            handleDragMove(e.clientX, e.clientY);
        };

        const handleTouchMove = (e: TouchEvent) => {
            handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
        };

        const handleDragMove = (clientX: number, clientY: number) => {
            if (!dialogRef.current || !isMouseDown) {
                return;
            }

            const currentMousePosition = {
                x: Math.max(clientX, 0),
                y: Math.max(clientY, 0),
            };
            const delta = pointDifference(
                currentMousePosition,
                prevMousePosition
            );

            if (!isMoveStarted) {
                if (vectorLength(delta) > MANHATTAN_LENGTH) {
                    isMoveStarted = true;
                }
            } else {
                setDialogPosition((prev) => pointSum(delta, prev));

                const width = dialogRef.current.getBoundingClientRect().width;
                const left = dialogRef.current.getBoundingClientRect().left;
                setIsMovedOutsideWindow(
                    left < 0 || left + width > window.innerWidth
                );

                prevMousePosition = currentMousePosition;
            }
        };

        const handleBlur = () => {
            isMoveStarted = false;
            isMouseDown = false;
        };

        if (dialogTitleRef.current) {
            dialogTitleRef.current.addEventListener(
                "mousedown",
                handleMouseDown
            );
            dialogTitleRef.current.addEventListener(
                "touchstart",
                handleTouchStart
            );
        }

        document.addEventListener("mouseup", handleMouseUpAndTouchEnd);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("touchend", handleMouseUpAndTouchEnd);
        document.addEventListener("touchmove", handleTouchMove);
        window.addEventListener("blur", handleBlur);

        return () => {
            if (dialogTitleRef.current) {
                dialogTitleRef.current.removeEventListener(
                    "mousedown",
                    handleMouseDown
                );
            }

            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener(
                "mouseup",
                handleMouseUpAndTouchEnd,
                true
            );
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener(
                "touchend",
                handleMouseUpAndTouchEnd,
                true
            );
        };
    }, [dialogRef.current, dialogTitleRef.current]);

    React.useEffect(() => {
        if (!dialogRef.current) {
            return;
        }

        let previousWindowWidth = window.innerWidth;

        const handleWindowResize = () => {
            if (!open || !dialogRef.current || initialDialogWidth === null) {
                return;
            }

            const dialogLeft = dialogRef.current.getBoundingClientRect().left;
            const dialogWidth = dialogRef.current.getBoundingClientRect().width;
            const windowWidth = window.innerWidth;
            const deltaWidth = windowWidth - previousWindowWidth;

            if (isMovedOutsideWindow) {
                if (dialogLeft < 0) {
                    if (
                        deltaWidth < 0 &&
                        windowWidth < dialogLeft + dialogWidth + paddingRight
                    ) {
                        // Decrease dialog width when window width decrease
                        const newDialogWidth = Math.min(
                            Math.max(minDialogWidth, dialogWidth + deltaWidth),
                            initialDialogWidth
                        );
                        setDialogWidth(newDialogWidth);
                    } else if (
                        deltaWidth > 0 &&
                        windowWidth > dialogLeft + dialogWidth + paddingRight
                    ) {
                        // Increase dialog width when window width increase
                        const newDialogWidth = Math.min(
                            Math.max(minDialogWidth, dialogWidth + deltaWidth),
                            initialDialogWidth
                        );
                        setDialogWidth(newDialogWidth);
                    }
                } else if (dialogLeft > 0) {
                    if (deltaWidth < 0) {
                        setDialogPosition((prev) => {
                            return {
                                x: Math.max(
                                    paddingLeft,
                                    dialogLeft + deltaWidth
                                ),
                                y: prev.y,
                            };
                        });
                    }
                }
                setIsMovedOutsideWindow(
                    dialogLeft < 0 ||
                        dialogLeft + dialogWidth > window.innerWidth
                );
                previousWindowWidth = windowWidth;
                return;
            }

            if (deltaWidth < 0) {
                const actualPaddingLeft =
                    dialogLeft < paddingLeft ? dialogLeft : paddingLeft;
                const dialogRight = windowWidth - dialogLeft - dialogWidth;
                const newDialogLeft =
                    dialogRight > paddingRight
                        ? Math.max(
                              actualPaddingLeft,
                              dialogLeft + Math.ceil(deltaWidth / 2)
                          )
                        : Math.max(actualPaddingLeft, dialogLeft + deltaWidth);

                if (newDialogLeft !== dialogLeft) {
                    setDialogPosition((prev) => {
                        return { y: prev.y, x: newDialogLeft };
                    });
                }

                const remainingDelta =
                    deltaWidth + (dialogLeft - newDialogLeft);
                const newDialogWidth =
                    newDialogLeft === actualPaddingLeft &&
                    dialogWidth > windowWidth - actualPaddingLeft - paddingRight
                        ? Math.max(
                              minDialogWidth,
                              Math.min(
                                  dialogWidth + remainingDelta,
                                  initialDialogWidth
                              )
                          )
                        : dialogWidth;

                if (newDialogWidth !== dialogWidth) {
                    setDialogWidth(newDialogWidth);
                }
            } else if (deltaWidth > 0) {
                const newDialogWidth = Math.min(
                    initialDialogWidth,
                    dialogWidth + deltaWidth
                );
                if (newDialogWidth !== dialogWidth) {
                    setDialogWidth(newDialogWidth);
                }

                const newDialogLeft =
                    newDialogWidth === dialogWidth
                        ? dialogLeft + Math.ceil(deltaWidth / 2)
                        : dialogLeft;
                if (newDialogLeft !== dialogLeft) {
                    setDialogPosition((prev) => {
                        return { y: prev.y, x: newDialogLeft };
                    });
                }
            }
            previousWindowWidth = windowWidth;
        };

        // With event listener on window resize
        window.addEventListener("resize", handleWindowResize);
        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };
    }, [dialogRef.current, open, initialDialogWidth, isMovedOutsideWindow]);

    const handleActionButtonClick = (action: string) => {
        props.setProps({
            last_action_called: action,
            open: open,
            actions_called: actionsCalled + 1,
        });
        setActionsCalled(actionsCalled + 1);
    };

    React.useEffect(() => {
        if (placeholderRef.current) {
            ReactDOM.render(
                <div style={{ display: open ? "block" : "none" }}>
                    {props.modal && (
                        <Backdrop
                            opacity={0.7}
                            onClick={() =>
                                handleClose(DialogCloseReason.BACKDROP_CLICK)
                            }
                        ></Backdrop>
                    )}
                    <div
                        className={
                            props.modal
                                ? "WebvizDialog WebvizDialog--modal"
                                : "WebvizDialog WebvizDialog--active"
                        }
                        id={props.id}
                        ref={dialogRef}
                        style={{
                            left: Math.floor(dialogPosition.x),
                            top: Math.floor(dialogPosition.y),
                            width: dialogWidth,
                            minWidth: props.min_width,
                        }}
                        onMouseDown={() => handleSetActive()}
                    >
                        <WebvizDialogTitle
                            onClose={() =>
                                handleClose(DialogCloseReason.BUTTON_CLICK)
                            }
                            ref={dialogTitleRef}
                        >
                            {props.title}
                        </WebvizDialogTitle>
                        <div className="WebvizDialogContent">
                            {props.children}
                        </div>
                        <div className="WebvizDialogActions">
                            {props.actions &&
                                props.actions.map((action) => (
                                    <Button
                                        key={action}
                                        component="button"
                                        onClick={() =>
                                            handleActionButtonClick(
                                                action as string
                                            )
                                        }
                                    >
                                        {action}
                                    </Button>
                                ))}
                        </div>
                    </div>
                </div>,
                placeholderRef.current
            );
        }
    });

    return <></>;
};

WebvizDialog.propTypes = {
    id: PropTypes.string.isRequired,
    open: PropTypes.bool,
    modal: PropTypes.bool,
    title: PropTypes.string.isRequired,
    min_width: PropTypes.number,
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
    min_width: 200,
    children: [],
    actions: [],
    setProps: () => {
        return;
    },
};
