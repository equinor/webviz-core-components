import React from "react";
import PropTypes from "prop-types";

import { WebvizDialogTitle } from "./components/WebvizDialogTitle/WebvizDialogTitle";
import "./webviz-dialog.css";

import { Point } from "../../shared-types/point";
import {
    MANHATTAN_LENGTH,
    pointDifference,
    vectorLength,
} from "../../utils/geometry";
import { Backdrop } from "../Backdrop";
import { WebvizRenderer } from "./components/WebvizRenderer";
import { WebvizDialogActions } from "./components/WebvizDialogActions/WebvizDialogActions";
import { WebvizDialogContent } from "./components/WebvizDialogContent/WebvizDialogContent";

enum DialogCloseReason {
    BUTTON_CLICK,
    BACKDROP_CLICK,
    ESCAPE_BUTTON_PRESSED,
}

const margin = { left: 16, right: 16, top: 16, bottom: 16 };
const dialogTitleHeight = 80;
const dialogActionsHeight = 70;

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
     * Set owner of height prop. If no owner is provided height is automatically according to content
     */
    heightOwner?: "content" | "dialog";
    /**
     * Set the height of height owner element in px or vw
     */
    height?: number | string;
    /**
     * Set the minimum width in px
     */
    minWidth?: number;
    /**
     * Set the max width in px or vw
     */
    maxWidth?: number | string;
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

    const [dialogLeft, setDialogLeft] = React.useState<number>(0);
    const [dialogTop, setDialogTop] = React.useState<number>(0);

    const [dialogWidth, setDialogWidth] = React.useState<number | null>(null);
    const [initialDialogWidth, setInitialDialogWidth] =
        React.useState<number | null>(null);

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
            !dialogRef.current
        ) {
            return;
        }

        let initialWidth = initialDialogWidth || 0;
        const dialogHeight = dialogRef.current.getBoundingClientRect().height;
        if (initialDialogWidth === null) {
            initialWidth = dialogRef.current.getBoundingClientRect().width;
            setInitialDialogWidth(initialWidth);
        }

        const top = Math.max(
            margin.top,
            Math.round(window.innerHeight / 2 - dialogHeight / 2)
        );
        setDialogTop(top);
        if (window.innerWidth < margin.left + initialWidth + margin.right) {
            const adjustedWidth = Math.max(
                props.minWidth || 0,
                Math.min(
                    initialWidth,
                    window.innerWidth - margin.left - margin.right
                )
            );
            setDialogWidth(adjustedWidth);
            setDialogLeft(margin.left);
        } else {
            const adjustedLeft = Math.round(
                window.innerWidth / 2 - initialWidth / 2
            );
            setDialogWidth(initialWidth);
            setDialogLeft(adjustedLeft);
        }
    }, [
        open,
        wrapperRef.current,
        dialogRef.current,
        initialDialogWidth,
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
                setDialogLeft((prev) => delta.x + prev);
                setDialogTop((prev) => delta.y + prev);
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
        let previousWindowHeight = window.innerHeight;

        const handleWindowWidthResize = () => {
            if (!open || !dialogRef.current || initialDialogWidth === null) {
                return;
            }

            const dialogLeft = dialogRef.current.getBoundingClientRect().left;
            const dialogWidth = dialogRef.current.getBoundingClientRect().width;
            const windowWidth = window.innerWidth;
            const deltaWidth = windowWidth - previousWindowWidth;

            const wasDialogOutsideWindow =
                dialogLeft < 0 ||
                dialogLeft + dialogWidth > previousWindowWidth;

            // Width resize: Handle width and left position
            if (wasDialogOutsideWindow) {
                if (dialogLeft < 0) {
                    const newDialogWidth = Math.min(
                        Math.max(props.minWidth || 0, dialogWidth + deltaWidth),
                        initialDialogWidth
                    );
                    if (
                        deltaWidth < 0 &&
                        windowWidth < dialogLeft + dialogWidth + margin.right
                    ) {
                        // Decrease dialog width when window width decrease
                        setDialogWidth(newDialogWidth);
                    } else if (
                        deltaWidth > 0 &&
                        windowWidth > dialogLeft + dialogWidth + margin.right
                    ) {
                        // Increase dialog width when window width increase
                        setDialogWidth(newDialogWidth);
                    }
                } else if (dialogLeft > 0) {
                    if (deltaWidth < 0) {
                        setDialogLeft(
                            Math.max(margin.left, dialogLeft + deltaWidth)
                        );
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
                    setDialogLeft(newDialogLeft);
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
                              Math.min(calculatedWidth, initialDialogWidth)
                          )
                        : dialogWidth;

                if (newDialogWidth !== dialogWidth) {
                    setDialogWidth(newDialogWidth);
                }
            } else if (deltaWidth > 0) {
                const actualMarginLeft =
                    dialogLeft < margin.left ? dialogLeft : margin.left;
                const calculatedWidth = Math.min(
                    dialogWidth + deltaWidth,
                    windowWidth - actualMarginLeft - margin.right
                );
                const newDialogWidth = Math.min(
                    initialDialogWidth,
                    calculatedWidth
                );
                if (newDialogWidth !== dialogWidth) {
                    setDialogWidth(newDialogWidth);
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
                    setDialogLeft(newDialogLeft);
                }
            }
            previousWindowWidth = windowWidth;
        };

        const handleWindowHeightResize = () => {
            if (!dialogRef.current) {
                return;
            }

            const dialogTop = dialogRef.current.getBoundingClientRect().top;
            const dialogHeight =
                dialogRef.current.getBoundingClientRect().height;
            const windowHeight = window.innerHeight;
            const deltaHeight = windowHeight - previousWindowHeight;

            const wasDialogOutsideWindow =
                dialogTop < 0 ||
                dialogTop + dialogHeight > previousWindowHeight;

            // Height resize: Handle top position
            if (wasDialogOutsideWindow) {
                if (dialogTop > 0 && deltaHeight < 0) {
                    const actualMarginTop =
                        dialogTop < margin.top ? dialogTop : margin.top;
                    setDialogTop(
                        Math.max(actualMarginTop, dialogTop + deltaHeight)
                    );
                }
                previousWindowHeight = windowHeight;
                return;
            }

            const actualMarginTop =
                dialogTop < margin.top ? dialogTop : margin.top;
            if (
                deltaHeight > 0 &&
                actualMarginTop + dialogHeight + margin.bottom < windowHeight
            ) {
                setDialogTop(dialogTop + Math.ceil(deltaHeight / 2));
            } else if (deltaHeight < 0) {
                const actualMarginBottom =
                    previousWindowHeight - dialogTop - dialogHeight;
                setDialogTop(
                    actualMarginBottom > margin.bottom
                        ? Math.max(
                              actualMarginTop,
                              dialogTop + Math.ceil(deltaHeight / 2)
                          )
                        : Math.max(actualMarginTop, dialogTop + deltaHeight)
                );
            }

            previousWindowHeight = windowHeight;
        };

        window.addEventListener("resize", handleWindowWidthResize);
        window.addEventListener("resize", handleWindowHeightResize);
        return () => {
            window.removeEventListener("resize", handleWindowWidthResize);
            window.removeEventListener("resize", handleWindowHeightResize);
        };
    }, [dialogRef.current, open, initialDialogWidth, props.minWidth]);

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
                        left: Math.floor(dialogLeft),
                        top: Math.floor(dialogTop),
                        width: dialogWidth || props.maxWidth || undefined,
                        minWidth: props.minWidth,
                        height:
                            props.heightOwner === "dialog"
                                ? props.height
                                : undefined,
                    }}
                    onMouseDown={() => handleSetActive()}
                >
                    <WebvizDialogTitle
                        title={props.title}
                        onClose={() =>
                            handleClose(DialogCloseReason.BUTTON_CLICK)
                        }
                        height={dialogTitleHeight}
                        ref={dialogTitleRef}
                    />
                    <WebvizDialogContent
                        height={
                            props.heightOwner === "content"
                                ? props.height
                                : props.heightOwner === "dialog"
                                ? `calc(100% - ${dialogTitleHeight}px - ${
                                      props.actions ? dialogActionsHeight : 0
                                  }px)`
                                : undefined
                        }
                        useScrollArea={
                            props.heightOwner === "content" ||
                            props.heightOwner === "dialog"
                        }
                        ref={dialogContentRef}
                    >
                        {props.children}
                    </WebvizDialogContent>
                    <WebvizDialogActions
                        height={dialogActionsHeight}
                        actions={props.actions}
                        onActionClick={(action) => {
                            handleActionButtonClick(
                                action.last_action_called as string
                            );
                        }}
                        ref={dialogActionsRef}
                    />
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
    heightOwner: PropTypes.oneOf(["dialog", "content"]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minWidth: PropTypes.number,
    maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
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
    heightOwner: undefined,
    height: undefined,
    minWidth: 200,
    maxWidth: undefined,
    disableDraggable: false,
    disableEscapeKeyDown: false,
    children: [],
    actions: [],
    setProps: () => {
        return;
    },
};
