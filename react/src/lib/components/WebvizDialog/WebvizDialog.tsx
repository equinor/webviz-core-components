import React from "react";
import PropTypes from "prop-types";

import { WebvizDialogTitle } from "./components/WebvizDialogTitle/WebvizDialogTitle";
import { WebvizDialogActions } from "./components/WebvizDialogActions/WebvizDialogActions";
import { WebvizDialogContent } from "./components/WebvizDialogContent/WebvizDialogContent";
import { WebvizDialogPortal } from "./components/WebvizDialogPortal";

import { Backdrop } from "../Backdrop";
import { Point } from "../../shared-types/point";
import {
    MANHATTAN_LENGTH,
    pointDifference,
    vectorLength,
} from "../../utils/geometry";

import "./webviz-dialog.css";

const margin = { left: 16, right: 16, top: 16, bottom: 16 };
const dialogTitleHeight = 80;
const dialogActionsHeight = 70;
const zIndex = 1051;
const zIndexModal = 1199;

type DialogRectData = {
    top: number;
    left: number;
    width: number | null;
};

const setPlaceholderClassNameAndZIndex = (
    placeholder: HTMLDivElement,
    isModal: boolean
): void => {
    const className = isModal
        ? "WebvizDialogPlaceholderModal"
        : "WebvizDialogPlaceholder";
    const numDialogs = document.getElementsByClassName(className).length;
    placeholder.className = className;
    placeholder.style.zIndex = `${
        (isModal ? zIndexModal : zIndex) + numDialogs
    }`;
};

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
     * Set owner of height prop. If no owner is provided height is automatically set according to the dialogs
     * content height
     */
    heightOwner?: "content" | "dialog";
    /**
     * Set the height of height owner element in px or vh
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
    const [dialogRectData, setDialogRectData] = React.useState<DialogRectData>({
        top: 0,
        left: 0,
        width: null,
    });
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
        activeDialogs.forEach((dialog) => {
            if (dialog !== dialogRef.current) {
                dialog.classList.remove("WebvizDialog--active");
            }
        });
        if (
            dialogRef.current &&
            !dialogRef.current.classList.contains("WebvizDialog--active")
        ) {
            dialogRef.current.classList.add("WebvizDialog--active");
        }

        if (
            !placeholderDiv ||
            placeholderDiv.className === "WebvizDialogPlaceholderModal"
        ) {
            return;
        }

        // Non-modal placeholders
        const placeholders = Array.from(
            document.getElementsByClassName("WebvizDialogPlaceholder")
        );
        const zIndexes = Array.from(
            document.getElementsByClassName("WebvizDialogPlaceholder")
        ).map((elm) => {
            return parseInt((elm as HTMLElement).style.zIndex);
        });

        const dialogZIndex = parseInt(placeholderDiv.style.zIndex);
        const highestZIndex = Math.max(...zIndexes);
        if (dialogZIndex !== highestZIndex) {
            placeholderDiv.style.zIndex = `${highestZIndex}`;
            placeholders.forEach((placeholder) => {
                const zIndex = parseInt(
                    (placeholder as HTMLElement).style.zIndex
                );
                if (placeholder !== placeholderDiv && zIndex > dialogZIndex) {
                    (placeholder as HTMLElement).style.zIndex = `${zIndex - 1}`;
                }
            });
        }
    }, [placeholderDiv, props.modal, props.id]);

    React.useLayoutEffect(() => {
        if (!placeholderDiv) {
            return;
        }
        setPlaceholderClassNameAndZIndex(placeholderDiv, props.modal || false);
    }, [props.modal]);

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
        setPlaceholderClassNameAndZIndex(placeholder, props.modal || false);
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

    const handleClose = React.useCallback(() => {
        setOpen(false);
        props.setProps({ open: false });
    }, [props.setProps]);

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
        let adjustedWidth = initialWidth;
        let adjustedLeft = margin.left;
        if (window.innerWidth < margin.left + initialWidth + margin.right) {
            adjustedWidth = Math.max(
                props.minWidth || 0,
                Math.min(
                    initialWidth,
                    window.innerWidth - margin.left - margin.right
                )
            );
        } else {
            adjustedLeft = Math.round(window.innerWidth / 2 - initialWidth / 2);
        }
        setDialogRectData({
            width: adjustedWidth,
            top: top,
            left: adjustedLeft,
        });
    }, [open, wrapperRef.current, initialDialogWidth, props.minWidth]);

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
                setDialogRectData((prev) => {
                    return {
                        width: prev.width,
                        top: delta.y + prev.top,
                        left: delta.x + prev.left,
                    };
                });
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
                handleClose();
            e.preventDefault();
        };

        if (dialogTitleRef.current && props.disableDraggable === false) {
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

        // Returns null values if no updates are needed.
        const calcDialogLeftAndWidthOnWindowWidthResize = (): {
            left: number | null;
            width: number | null;
        } => {
            const windowWidth = window.innerWidth;
            const deltaWidth = windowWidth - previousWindowWidth;
            if (
                !dialogRef.current ||
                initialDialogWidth === null ||
                deltaWidth === 0
            ) {
                return { left: null, width: null };
            }

            const dialogLeft = dialogRef.current.getBoundingClientRect().left;
            const dialogWidth = dialogRef.current.getBoundingClientRect().width;
            const wasDialogOutsideWindow =
                dialogLeft < 0 ||
                dialogLeft + dialogWidth > previousWindowWidth;

            let newDialogLeft = null;
            let newDialogWidth = null;

            // Width resize: Handle width and left position
            if (wasDialogOutsideWindow) {
                if (dialogLeft < 0) {
                    const requiredWindowWidth =
                        dialogLeft + dialogWidth + margin.right;
                    if (
                        (deltaWidth < 0 && windowWidth < requiredWindowWidth) ||
                        (deltaWidth > 0 && windowWidth > requiredWindowWidth)
                    ) {
                        // Decrease or decrease dialog width when window width is adjusted
                        newDialogWidth = Math.min(
                            Math.max(
                                props.minWidth || 0,
                                dialogWidth + deltaWidth
                            ),
                            initialDialogWidth
                        );
                    }
                } else if (dialogLeft > 0 && deltaWidth < 0) {
                    newDialogLeft = Math.max(
                        margin.left,
                        dialogLeft + deltaWidth
                    );
                }
                return { left: newDialogLeft, width: newDialogWidth };
            }

            if (deltaWidth < 0) {
                const actualMarginLeft =
                    dialogLeft < margin.left ? dialogLeft : margin.left;
                const actualMarginRight =
                    previousWindowWidth - dialogLeft - dialogWidth;
                newDialogLeft =
                    actualMarginRight > margin.right
                        ? Math.max(
                              actualMarginLeft,
                              dialogLeft + Math.ceil(deltaWidth / 2)
                          )
                        : Math.max(actualMarginLeft, dialogLeft + deltaWidth);

                const remainingDelta =
                    deltaWidth + (dialogLeft - newDialogLeft);
                const calculatedWidth = Math.max(
                    dialogWidth + remainingDelta,
                    windowWidth - actualMarginLeft - margin.right
                );
                newDialogWidth =
                    newDialogLeft === actualMarginLeft &&
                    dialogWidth > windowWidth - actualMarginLeft - margin.right
                        ? Math.max(
                              props.minWidth || 0,
                              Math.min(calculatedWidth, initialDialogWidth)
                          )
                        : dialogWidth;
            } else if (deltaWidth > 0) {
                const actualMarginLeft =
                    dialogLeft < margin.left ? dialogLeft : margin.left;
                const calculatedWidth = Math.min(
                    dialogWidth + deltaWidth,
                    windowWidth - actualMarginLeft - margin.right
                );
                newDialogWidth = Math.min(initialDialogWidth, calculatedWidth);

                const actualMarginRight = Math.min(
                    margin.right,
                    previousWindowWidth - dialogLeft - dialogWidth
                );
                const remainingDelta =
                    deltaWidth - (newDialogWidth - dialogWidth);
                newDialogLeft = Math.max(
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
            }
            return { left: newDialogLeft, width: newDialogWidth };
        };

        // Returns null if no update is needed
        const calcDialogTopOnWindowHeightResize = (): number | null => {
            const windowHeight = window.innerHeight;
            const deltaHeight = windowHeight - previousWindowHeight;
            if (!dialogRef.current || deltaHeight === 0) {
                return null;
            }

            const dialogTop = dialogRef.current.getBoundingClientRect().top;
            const dialogHeight =
                dialogRef.current.getBoundingClientRect().height;
            const wasDialogOutsideWindow =
                dialogTop < 0 ||
                dialogTop + dialogHeight > previousWindowHeight;

            // Height resize: Handle top position
            if (wasDialogOutsideWindow) {
                if (dialogTop > 0 && deltaHeight < 0) {
                    const actualMarginTop =
                        dialogTop < margin.top ? dialogTop : margin.top;
                    return Math.max(actualMarginTop, dialogTop + deltaHeight);
                }
                return null;
            }

            const actualMarginTop =
                dialogTop < margin.top ? dialogTop : margin.top;
            if (
                deltaHeight > 0 &&
                actualMarginTop + dialogHeight + margin.bottom < windowHeight
            ) {
                return dialogTop + Math.ceil(deltaHeight / 2);
            } else if (deltaHeight < 0) {
                const actualMarginBottom =
                    previousWindowHeight - dialogTop - dialogHeight;
                return actualMarginBottom > margin.bottom
                    ? Math.max(
                          actualMarginTop,
                          dialogTop + Math.ceil(deltaHeight / 2)
                      )
                    : Math.max(actualMarginTop, dialogTop + deltaHeight);
            }
            return null;
        };

        const handleWindowResize = () => {
            if (!open) {
                return;
            }

            const top = calcDialogTopOnWindowHeightResize();
            const { left, width } = calcDialogLeftAndWidthOnWindowWidthResize();
            setDialogRectData((prev) => {
                return {
                    top: top !== null ? top : prev.top,
                    left: left !== null ? left : prev.left,
                    width: width !== null ? width : prev.width,
                };
            });
            previousWindowWidth = window.innerWidth;
            previousWindowHeight = window.innerHeight;
        };

        window.addEventListener("resize", handleWindowResize);
        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };
    }, [open, initialDialogWidth, props.minWidth]);

    const handleActionButtonClick = (action: string) => {
        props.setProps({
            last_action_called: action,
            open: open,
            actions_called: actionsCalled + 1,
        });
        setActionsCalled(actionsCalled + 1);
    };

    return (
        <WebvizDialogPortal
            target={placeholderDiv}
            ref={wrapperRef}
            open={open}
        >
            <>
                {props.modal && (
                    <Backdrop
                        opacity={0.7}
                        onClick={() => handleClose()}
                    ></Backdrop>
                )}
                <div
                    className={`WebvizDialog${
                        open ? " WebvizDialog--active" : ""
                    }${props.modal ? " WebvizDialog--modal" : ""}`}
                    id={props.id}
                    ref={dialogRef}
                    style={{
                        left: Math.floor(dialogRectData.left),
                        top: Math.floor(dialogRectData.top),
                        width:
                            dialogRectData.width || props.maxWidth || undefined,
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
                        onClose={() => handleClose()}
                        draggable={props.disableDraggable === false}
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
        </WebvizDialogPortal>
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
