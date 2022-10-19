import React from "react";
import PropTypes from "prop-types";

import { Button } from "@material-ui/core";

import { WebvizDialogTitle } from "./components/WebvizDialogTitle/WebvizDialogTitle";
import "./webviz-dialog.css";

import { Point } from "../../shared-types/point";
import { Size } from "../../shared-types/size";
import {
    MANHATTAN_LENGTH,
    ORIGIN,
    pointDifference,
    pointSum,
    vectorLength,
} from "../../utils/geometry";
import { Backdrop } from "../Backdrop";
import { WebvizRenderer } from "./components/WebvizRenderer";
import { ScrollArea } from "../ScrollArea";

enum DialogCloseReason {
    BUTTON_CLICK,
    BACKDROP_CLICK,
    ESCAPE_BUTTON_PRESSED,
}

const margin = { left: 16, right: 16, top: 16, bottom: 16 };
const minScrollAreaHeight = 100;
const dialogContentPadding = 16;

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
    modal?: boolean;
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
     * If true, dragging of dialog is disabled
     */
    disableDraggable?: boolean;
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
    const [open, setOpen] = React.useState<boolean>(false);
    const [actionsCalled, setActionsCalled] = React.useState<number>(0);

    const [dialogPosition, setDialogPosition] = React.useState<Point>(ORIGIN);

    const [dialogSize, setDialogSize] = React.useState<Size | null>(null);
    const [initialDialogSize, setInitialDialogSize] =
        React.useState<Size | null>(null);
    const [initialDialogContentHeight, setInitialDialogContentHeight] =
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
        !props.modal &&
            activeDialogs.forEach((dialog) => {
                if (dialog.id !== props.id) {
                    dialog.classList.remove("WebvizDialog--active");
                }
            });

        if (
            dialogRef.current &&
            !dialogRef.current?.classList.contains("WebvizDialog--active")
        ) {
            dialogRef.current.classList.add("WebvizDialog--active");
        }
    }, [dialogRef.current, props.modal]);

    React.useLayoutEffect(() => {
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

    React.useLayoutEffect(() => {
        if (props.open === open) {
            return;
        }

        setOpen(props.open || false);
        if (props.open) {
            handleSetActive();
        }
    }, [props.open]);

    const handleClose = React.useCallback(
        (reason: DialogCloseReason) => {
            if (reason == DialogCloseReason.BACKDROP_CLICK && !props.modal) {
                return;
            }
            setOpen(false);
            props.setProps({ open: false });
        },
        [props.modal, props.setProps]
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

        let initialSize = initialDialogSize || { width: 0, height: 0 };
        let initialContentHeight = initialDialogContentHeight || 0;
        if (initialDialogSize === null) {
            initialSize = {
                width: dialogRef.current.getBoundingClientRect().width,
                height: dialogRef.current.getBoundingClientRect().height,
            };
            setInitialDialogSize(initialSize);
        }
        if (initialDialogContentHeight === null) {
            initialContentHeight =
                dialogContentRef.current.getBoundingClientRect().height;
            setInitialDialogContentHeight(initialContentHeight);
        }

        const wantedDialogHeight = Math.max(
            props.minHeight || 0,
            Math.min(window.innerHeight / 2, initialSize.height)
        );
        const useScrollArea =
            initialContentHeight >= minScrollAreaHeight &&
            margin.top + margin.bottom + initialSize.height >
                window.innerHeight / 2;
        const dialogContentHeight = Math.max(
            useScrollArea ? minScrollAreaHeight : 0,
            wantedDialogHeight -
                2 * dialogContentPadding -
                dialogTitleRef.current.getBoundingClientRect().height -
                dialogActionsRef.current.getBoundingClientRect().height
        );
        setScrollAreaHeight(dialogContentHeight);
        setUseScrollArea(useScrollArea);

        const adjustedDialogHeight =
            dialogContentHeight +
            2 * dialogContentPadding +
            dialogTitleRef.current.getBoundingClientRect().height +
            dialogActionsRef.current.getBoundingClientRect().height;
        const top = Math.max(
            margin.top,
            Math.round(window.innerHeight / 2 - adjustedDialogHeight / 2)
        );
        if (
            window.innerWidth <
            margin.left + initialSize.width + margin.right
        ) {
            const adjustedWidth = Math.max(
                props.minWidth || 0,
                Math.min(
                    initialSize.width,
                    window.innerWidth - margin.left - margin.right
                )
            );
            setDialogSize({
                width: adjustedWidth,
                height: adjustedDialogHeight,
            });
            setDialogPosition({ x: margin.left, y: top });
        } else {
            const adjustedLeft = Math.round(
                window.innerWidth / 2 - initialSize.width / 2
            );
            setDialogSize({
                width: initialSize.width,
                height: adjustedDialogHeight,
            });
            setDialogPosition({ x: adjustedLeft, y: top });
        }
    }, [
        open,
        wrapperRef.current,
        dialogRef.current,
        dialogTitleRef.current,
        dialogContentRef.current,
        dialogActionsRef.current,
        initialDialogContentHeight,
        initialDialogSize,
        props.minWidth,
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

        if (dialogTitleRef.current && !props.disableDraggable) {
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
    }, [
        dialogRef.current,
        dialogTitleRef.current,
        props.disableEscapeKeyDown,
        props.disableDraggable,
    ]);

    React.useEffect(() => {
        if (!dialogRef.current) {
            return;
        }

        let previousWindowWidth = window.innerWidth;

        const handleWindowResize = () => {
            if (!open || !dialogRef.current || initialDialogSize === null) {
                return;
            }

            const dialogLeft = dialogRef.current.getBoundingClientRect().left;
            const dialogWidth = dialogRef.current.getBoundingClientRect().width;
            const windowWidth = window.innerWidth;
            const deltaWidth = windowWidth - previousWindowWidth;

            const wasDialogOutsideWindow =
                dialogLeft < 0 ||
                dialogLeft + dialogWidth > previousWindowWidth;

            if (wasDialogOutsideWindow) {
                if (dialogLeft < 0) {
                    if (
                        deltaWidth < 0 &&
                        windowWidth < dialogLeft + dialogWidth + margin.right
                    ) {
                        // Decrease dialog width when window width decrease
                        const newDialogWidth = Math.min(
                            Math.max(
                                props.minWidth || 0,
                                dialogWidth + deltaWidth
                            ),
                            initialDialogSize.width
                        );
                        setDialogSize((prev) => ({
                            height: prev?.height || 0,
                            width: newDialogWidth,
                        }));
                    } else if (
                        deltaWidth > 0 &&
                        windowWidth > dialogLeft + dialogWidth + margin.right
                    ) {
                        // Increase dialog width when window width increase
                        const newDialogWidth = Math.min(
                            Math.max(
                                props.minWidth || 0,
                                dialogWidth + deltaWidth
                            ),
                            initialDialogSize.width
                        );
                        setDialogSize((prev) => ({
                            height: prev?.height || 0,
                            width: newDialogWidth,
                        }));
                    }
                } else if (dialogLeft > 0) {
                    if (deltaWidth < 0) {
                        setDialogPosition((prev) => {
                            return {
                                x: Math.max(
                                    margin.left,
                                    dialogLeft + deltaWidth
                                ),
                                y: prev.y,
                            };
                        });
                    }
                }
                previousWindowWidth = windowWidth;
                return;
            }

            if (deltaWidth < 0) {
                const actualMarginLeft =
                    dialogLeft < margin.left ? dialogLeft : margin.left;
                const actualMarginRight =
                    previousWindowWidth - dialogLeft - dialogWidth;
                const newDialogLeft =
                    actualMarginRight > margin.right
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
                    windowWidth - actualMarginLeft - margin.right
                );
                const newDialogWidth =
                    newDialogLeft === actualMarginLeft &&
                    dialogWidth > windowWidth - actualMarginLeft - margin.right
                        ? Math.max(
                              props.minWidth || 0,
                              Math.min(calculatedWidth, initialDialogSize.width)
                          )
                        : dialogWidth;

                if (newDialogWidth !== dialogWidth) {
                    setDialogSize((prev) => ({
                        height: prev?.height || 0,
                        width: newDialogWidth,
                    }));
                }
            } else if (deltaWidth > 0) {
                const actualMarginLeft =
                    dialogLeft < margin.left ? dialogLeft : margin.left;
                const calculatedWidth = Math.min(
                    dialogWidth + deltaWidth,
                    windowWidth - actualMarginLeft - margin.right
                );
                const newDialogWidth = Math.min(
                    initialDialogSize.width,
                    calculatedWidth
                );
                if (newDialogWidth !== dialogWidth) {
                    setDialogSize((prev) => ({
                        height: prev?.height || 0,
                        width: newDialogWidth,
                    }));
                }

                const actualMarginRight = Math.min(
                    margin.right,
                    previousWindowWidth - dialogLeft - dialogWidth
                );
                const remainingDelta =
                    deltaWidth - (newDialogWidth - dialogWidth);
                const newDialogLeft = Math.max(
                    actualMarginLeft,
                    Math.min(
                        windowWidth - newDialogWidth - actualMarginRight,
                        windowWidth >
                            actualMarginLeft +
                                newDialogWidth +
                                actualMarginRight
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

        window.addEventListener("resize", handleWindowResize);
        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };
    }, [dialogRef.current, open, initialDialogSize, props.minWidth]);

    const handleActionButtonClick = (action: string) => {
        props.setProps({
            last_action_called: action,
            open: open,
            actions_called: actionsCalled + 1,
        });
        setActionsCalled(actionsCalled + 1);
    };

    return (
        <WebvizRenderer target={placeholderDiv} ref={wrapperRef} open={open}>
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
                        width: dialogSize?.width || undefined,
                        height: dialogSize?.height || undefined,
                        minWidth: props.minWidth,
                        minHeight: props.minHeight,
                    }}
                    onMouseDown={() => handleSetActive()}
                >
                    <WebvizDialogTitle
                        title={props.title}
                        onClose={() =>
                            handleClose(DialogCloseReason.BUTTON_CLICK)
                        }
                        ref={dialogTitleRef}
                    />
                    <div
                        className="WebvizDialogContent"
                        ref={dialogContentRef}
                        style={{
                            maxHeight: initialDialogContentHeight
                                ? initialDialogContentHeight -
                                  2 * dialogContentPadding
                                : undefined,
                        }}
                    >
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
        </WebvizRenderer>
    );
};

WebvizDialog.propTypes = {
    id: PropTypes.string.isRequired,
    open: PropTypes.bool,
    modal: PropTypes.bool,
    title: PropTypes.string.isRequired,
    minWidth: PropTypes.number,
    minHeight: PropTypes.number,
    disableDraggable: PropTypes.bool,
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
    disableDraggable: false,
    disableEscapeKeyDown: false,
    children: [],
    actions: [],
    setProps: () => {
        return;
    },
};
