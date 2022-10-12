import React from "react";
import PropTypes from "prop-types";

import { Button } from "@material-ui/core";

import { WebvizDialogTitle } from "./components/WebvizDialogTitle/WebvizDialogTitle";
import "./webviz-dialog.css";

import { Point } from "../../shared-types/point";
import {
    MANHATTAN_LENGTH,
    ORIGIN,
    pointDifference,
    pointSum,
    vectorLength,
} from "../../utils/geometry";
import { Backdrop } from "../Backdrop";
import { Renderer } from "./components/renderer";
import { ScrollArea } from "../ScrollArea";

enum DialogCloseReason {
    BUTTON_CLICK,
    BACKDROP_CLICK,
    ESCAPE_BUTTON_PRESSED,
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
    minWidth?: number;
    /**
     * Set the minimum height in px
     */
    minHeight?: number;
    /**
     * If true, hitting escape will not fire the close callback
     */
    disableEscapeKeyDown?: boolean;
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
    const marginLeft = 16;
    const marginRight = 16;
    const marginTop = 16;
    const marginBottom = 16;

    const [open, setOpen] = React.useState<boolean>(props.open || false);
    const [actionsCalled, setActionsCalled] = React.useState<number>(0);

    const [dialogPosition, setDialogPosition] = React.useState<Point>(ORIGIN);
    const [minDialogWidth, setMinDialogWidth] = React.useState<number>(
        props.minWidth || 0
    );
    const [dialogWidth, setDialogWidth] =
        React.useState<number | undefined>(undefined);
    const [dialogHeight, setDialogHeight] =
        React.useState<number | undefined>(undefined);
    const [initialDialogWidth, setInitialDialogWidth] =
        React.useState<number | null>(null);
    const [isMovedOutsideWindow, setIsMovedOutsideWindow] =
        React.useState<boolean>(false);
    const [sumDialogElementsHeight, setSumDialogElementsHeight] =
        React.useState<number | null>(null);
    const [useScrollArea, setUseScrollArea] =
        React.useState<boolean | undefined>(undefined);
    const [scrollAreaHeight, setScrollAreaHeight] = React.useState<number>(0);

    const [placeholderDiv, setPlaceholderDiv] =
        React.useState<HTMLDivElement | null>(null);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const dialogRef = React.useRef<HTMLDivElement>(null);
    const dialogTitleRef = React.useRef<HTMLDivElement>(null);
    const dialogContentRef = React.useRef<HTMLDivElement>(null);
    const dialogActionsRef = React.useRef<HTMLDivElement>(null);

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

        const placeholder = document.createElement("div");
        node.appendChild(placeholder);
        setPlaceholderDiv(placeholder);

        return () => {
            if (placeholder) {
                placeholder.parentElement?.removeChild(placeholder);
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
        setMinDialogWidth(props.minWidth || 0);
    }, [props.minWidth]);

    React.useLayoutEffect(() => {
        setOpen(props.open || false);

        if (props.open && dialogRef.current) {
            handleSetActive();
        }
    }, [props.open, dialogRef.current]);

    const handleClose = React.useCallback(
        (reason: DialogCloseReason) => {
            if (reason == DialogCloseReason.BACKDROP_CLICK && !props.modal) {
                return;
            }
            setOpen(false);
            props.setProps({ open: false });
        },
        [props.modal, props.setProps, dialogRef.current]
    );

    React.useLayoutEffect(() => {
        if (
            !wrapperRef.current ||
            wrapperRef.current.style.display !== "block" ||
            !dialogRef.current ||
            !dialogTitleRef.current ||
            !dialogContentRef.current ||
            !dialogActionsRef.current
        ) {
            return;
        }

        let initialWidth = initialDialogWidth || 0;
        let sumElementHeights = sumDialogElementsHeight || 0;
        const dialogContentPadding = 32;
        if (initialDialogWidth === null) {
            initialWidth = dialogRef.current.getBoundingClientRect().width;
            setInitialDialogWidth(initialWidth);
        }
        if (sumDialogElementsHeight === null) {
            const initialContentHeight =
                dialogContentRef.current.getBoundingClientRect().height;
            sumElementHeights =
                dialogTitleRef.current.getBoundingClientRect().height +
                initialContentHeight +
                dialogContentPadding +
                dialogActionsRef.current.getBoundingClientRect().height;
            setSumDialogElementsHeight(sumElementHeights);
        }

        const adjustedHeight = Math.max(
            props.minHeight || 0,
            Math.min(window.innerHeight / 2, sumElementHeights)
        );
        const top = Math.max(
            marginTop,
            Math.round(window.innerHeight / 2 - adjustedHeight / 2)
        );

        setUseScrollArea(
            marginTop + marginBottom + sumElementHeights >
                window.innerHeight / 2
        );
        setScrollAreaHeight(
            adjustedHeight -
                dialogContentPadding -
                dialogTitleRef.current.getBoundingClientRect().height -
                dialogActionsRef.current.getBoundingClientRect().height
        );
        setDialogHeight(adjustedHeight);

        if (window.innerWidth < marginLeft + initialWidth + marginRight) {
            const adjustedWidth = Math.max(
                minDialogWidth,
                Math.min(
                    initialWidth,
                    window.innerWidth - marginLeft - marginRight
                )
            );
            setDialogWidth(adjustedWidth);
            setDialogPosition({ x: marginLeft, y: top });
            setIsMovedOutsideWindow(
                marginLeft + adjustedWidth > window.innerWidth
            );
        } else {
            const adjustedLeft = Math.round(
                window.innerWidth / 2 - initialWidth / 2
            );
            setDialogWidth(initialWidth);
            setDialogPosition({ x: adjustedLeft, y: top });
            setIsMovedOutsideWindow(
                adjustedLeft < 0 ||
                    adjustedLeft + initialWidth > window.innerWidth
            );
        }
    }, [
        open,
        wrapperRef.current,
        dialogRef.current,
        dialogTitleRef.current,
        dialogContentRef.current,
        dialogActionsRef.current,
        initialDialogWidth,
        minDialogWidth,
        sumDialogElementsHeight,
    ]);

    React.useEffect(() => {
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

        const handleEscapeKeyUp = (e: KeyboardEvent) => {
            if (e.key !== "Escape") {
                return;
            }
            dialogRef.current?.classList.contains("WebvizDialog--active") &&
                handleClose(DialogCloseReason.ESCAPE_BUTTON_PRESSED);
            e.preventDefault();
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
        if (!props.disableEscapeKeyDown) {
            window.addEventListener("keyup", handleEscapeKeyUp);
        }

        return () => {
            if (dialogTitleRef.current) {
                dialogTitleRef.current.removeEventListener(
                    "mousedown",
                    handleMouseDown
                );
                dialogTitleRef.current.removeEventListener(
                    "touchstart",
                    handleTouchStart
                );
            }

            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUpAndTouchEnd);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleMouseUpAndTouchEnd);

            if (!props.disableEscapeKeyDown) {
                window.removeEventListener("keyup", handleEscapeKeyUp);
            }
        };
    }, [dialogRef.current, dialogTitleRef.current, props.disableEscapeKeyDown]);

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
                        windowWidth < dialogLeft + dialogWidth + marginRight
                    ) {
                        // Decrease dialog width when window width decrease
                        const newDialogWidth = Math.min(
                            Math.max(minDialogWidth, dialogWidth + deltaWidth),
                            initialDialogWidth
                        );
                        setDialogWidth(newDialogWidth);
                    } else if (
                        deltaWidth > 0 &&
                        windowWidth > dialogLeft + dialogWidth + marginRight
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
                                    marginLeft,
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
                const actualMarginLeft =
                    dialogLeft < marginLeft ? dialogLeft : marginLeft;
                const dialogRight =
                    previousWindowWidth - dialogLeft - dialogWidth;
                const newDialogLeft =
                    dialogRight > marginRight
                        ? Math.max(
                              actualMarginLeft,
                              dialogLeft + Math.ceil(deltaWidth / 2)
                          )
                        : Math.max(actualMarginLeft, dialogLeft + deltaWidth);

                if (newDialogLeft !== dialogLeft) {
                    setDialogPosition((prev) => {
                        return { y: prev.y, x: newDialogLeft };
                    });
                }

                const remainingDelta =
                    deltaWidth + (dialogLeft - newDialogLeft);
                const calculatedWidth = Math.max(
                    dialogWidth + remainingDelta,
                    windowWidth - actualMarginLeft - marginRight
                );
                const newDialogWidth =
                    newDialogLeft === actualMarginLeft &&
                    dialogWidth > windowWidth - actualMarginLeft - marginRight
                        ? Math.max(
                              minDialogWidth,
                              Math.min(calculatedWidth, initialDialogWidth)
                          )
                        : dialogWidth;

                if (newDialogWidth !== dialogWidth) {
                    setDialogWidth(newDialogWidth);
                }
            } else if (deltaWidth > 0) {
                const actualMarginLeft =
                    dialogLeft < marginLeft ? dialogLeft : marginLeft;
                const calculatedWidth = Math.min(
                    dialogWidth + deltaWidth,
                    windowWidth - actualMarginLeft - marginRight
                );
                const newDialogWidth = Math.min(
                    initialDialogWidth,
                    calculatedWidth
                );
                if (newDialogWidth !== dialogWidth) {
                    setDialogWidth(newDialogWidth);
                }

                const remainingDelta =
                    deltaWidth - (newDialogWidth - dialogWidth);
                const newDialogLeft = Math.max(
                    actualMarginLeft,
                    Math.min(
                        windowWidth - newDialogWidth - marginRight,
                        windowWidth >
                            actualMarginLeft + newDialogWidth + marginRight
                            ? dialogLeft + remainingDelta / 2
                            : dialogLeft
                    )
                );
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

    return (
        <Renderer target={placeholderDiv} ref={wrapperRef} open={open}>
            <>
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
                        open
                            ? props.modal
                                ? "WebvizDialog WebvizDialog--modal WebvizDialog--active"
                                : "WebvizDialog WebvizDialog--active"
                            : "WebvizDialog"
                    }
                    id={props.id}
                    ref={dialogRef}
                    style={{
                        left: Math.floor(dialogPosition.x),
                        top: Math.floor(dialogPosition.y),
                        width: dialogWidth,
                        height: dialogHeight,
                        minWidth: props.minWidth,
                        minHeight: props.minHeight,
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
                    <div className="WebvizDialogContent" ref={dialogContentRef}>
                        {useScrollArea ? (
                            <ScrollArea height={scrollAreaHeight}>
                                {props.children}
                            </ScrollArea>
                        ) : (
                            props.children
                        )}
                    </div>
                    <div className="WebvizDialogActions" ref={dialogActionsRef}>
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
            </>
        </Renderer>
    );
};

WebvizDialog.propTypes = {
    id: PropTypes.string.isRequired,
    open: PropTypes.bool,
    modal: PropTypes.bool,
    title: PropTypes.string.isRequired,
    minWidth: PropTypes.number,
    minHeight: PropTypes.number,
    disableEscapeKeyDown: PropTypes.bool,
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
    minWidth: 200,
    minHeight: 200,
    disableEscapeKeyDown: false,
    children: [],
    actions: [],
    setProps: () => {
        return;
    },
};
