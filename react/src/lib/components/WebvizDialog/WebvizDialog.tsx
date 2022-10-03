import React from "react";
import * as ReactDOM from "react-dom";
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
    isDOMRectContained,
} from "../../utils/geometry";
import { Backdrop } from "../Backdrop";

enum DialogCloseReason {
    ButtonClick,
    BackdropClick,
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
    const [open, setOpen] = React.useState<boolean>(props.open || false);
    const [actionsCalled, setActionsCalled] = React.useState<number>(0);
    const [dialogPosition, setDialogPosition] = React.useState<Point>(ORIGIN);
    const [isMovedOutsideWindow, setIsMovedOutsideWindow] =
        React.useState<boolean>(false);

    const [dialogWidth, setDialogWidth] =
        React.useState<number | undefined>(undefined);
    const [initialDialogWidth, setInitialDialogWidth] =
        React.useState<number | null>(null);

    const dialogRef = React.useRef<HTMLDivElement>(null);
    const dialogTitleRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (
            Array.from(document.getElementsByClassName("WebvizDialog__root"))
                .length === 0
        ) {
            const node = document.createElement("div");
            node.classList.add("WebvizDialog__root");
            document.body.appendChild(node);
        }

        return () => {
            const nodes = document.getElementsByClassName("WebvizDialog__root");
            Array.from(nodes).forEach((elm) => {
                const dialogNodes = elm.getElementsByClassName("WebvizDialog");
                if (
                    (dialogNodes.length == 1 &&
                        dialogNodes[0] === dialogRef.current) ||
                    dialogNodes.length === 0
                ) {
                    document.body.removeChild(elm);
                }
            });
        };
    }, []);

    React.useEffect(() => {
        setOpen(props.open || false);

        if (props.open && dialogRef.current) {
            handleSetActive();
        }
    }, [props.open, dialogRef.current]);

    React.useEffect(() => {
        if (dialogRef.current) {
            setIsMovedOutsideWindow(
                !isDOMRectContained(
                    dialogRef.current.getBoundingClientRect(),
                    new DOMRect(0, 0, window.innerWidth, window.innerHeight)
                )
            );
        }
    }, [dialogPosition]);

    const handleSetActive = React.useCallback(() => {
        let activeDialogs = Array.from(
            document.getElementsByClassName("WebvizDialog--active")
        );
        for (let elm of activeDialogs) {
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

    const handleClose = React.useCallback(
        (reason: DialogCloseReason) => {
            if (reason == DialogCloseReason.BackdropClick && !props.modal) {
                return;
            }
            setOpen(false);
            setDialogPosition(ORIGIN);
            props.setProps({ open: false });
        },
        [props.modal, props.setProps, dialogRef.current]
    );

    React.useEffect(() => {
        const handleResize = () => {
            if (!dialogRef.current || initialDialogWidth !== null) {
                return;
            }

            const width = dialogRef.current.getBoundingClientRect().width;
            setInitialDialogWidth(width);
            setDialogWidth(width);
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (dialogRef.current) {
            resizeObserver.observe(dialogRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [dialogRef.current, initialDialogWidth]);

    React.useLayoutEffect(() => {
        let prevMousePosition: Point = { x: 0, y: 0 };
        let isMouseDown: boolean = false;
        let moveStarted: boolean = false;

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
            moveStarted = false;
        };

        const handleMouseUpAndTouchEnd = (e: MouseEvent | TouchEvent) => {
            if (moveStarted === true) {
                e.stopPropagation();
            }
            isMouseDown = false;
            moveStarted = false;
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

            if (!moveStarted) {
                if (vectorLength(delta) > MANHATTAN_LENGTH) {
                    moveStarted = true;
                }
            } else {
                setDialogPosition((prev) => pointSum(delta, prev));
                prevMousePosition = currentMousePosition;
            }
        };

        const handleBlur = () => {
            moveStarted = false;
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
            if (!dialogRef.current || initialDialogWidth === null) {
                return;
            }

            const dialogLeft = dialogRef.current.getBoundingClientRect().left;
            const dialogWidth = dialogRef.current.getBoundingClientRect().width;
            const windowWidth = window.innerWidth;
            const deltaWidth = windowWidth - previousWindowWidth;

            const paddingLeft = 16;
            const paddingRight = 16;
            const minDialogWidth = props.min_width || 0;

            previousWindowWidth = windowWidth;

            // When dialog is partly outside window
            // - Adjust width of dialog when outside on the left side
            // - Adjust left position when outside on the right side
            if (isMovedOutsideWindow) {
                if (dialogLeft < 0) {
                    if (
                        deltaWidth < 0 &&
                        windowWidth - paddingRight <
                            dialogLeft + dialogWidth + paddingRight
                    ) {
                        // Decrease dialog width when window width decrease
                        const newDialogWidth = Math.min(
                            Math.max(minDialogWidth, dialogWidth + deltaWidth),
                            initialDialogWidth
                        );
                        setDialogWidth(newDialogWidth);
                    } else if (
                        deltaWidth > 0 &&
                        windowWidth - paddingRight >
                            dialogLeft + dialogWidth + paddingRight
                    ) {
                        // Increase dialog width when window width increase
                        const newDialogWidth = Math.min(
                            Math.max(minDialogWidth, dialogWidth + deltaWidth),
                            initialDialogWidth
                        );
                        setDialogWidth(newDialogWidth);
                    }
                } else if (dialogLeft > 0) {
                    // TODO: Move left if possible
                    if (deltaWidth < 0) {
                        setDialogPosition({
                            x: Math.max(paddingLeft, dialogLeft + deltaWidth),
                            y: dialogPosition.y,
                        });
                    }

                    setIsMovedOutsideWindow(
                        !isDOMRectContained(
                            dialogRef.current.getBoundingClientRect(),
                            new DOMRect(
                                0,
                                0,
                                window.innerWidth,
                                window.innerHeight
                            )
                        )
                    );
                }
                return;
            }

            // Move towards left is possible - otherwise decrease width as much as possible
            if (deltaWidth < 0 && dialogLeft > paddingLeft) {
                setDialogPosition({
                    y: dialogPosition.y,
                    x: Math.max(paddingLeft, dialogPosition.x + deltaWidth),
                });
                return;
            }

            const calculatedIncreaseWidth =
                windowWidth - dialogLeft - dialogWidth;
            const dialogRight =
                deltaWidth >= 0 && calculatedIncreaseWidth < paddingRight
                    ? calculatedIncreaseWidth
                    : paddingRight;
            setDialogWidth(
                Math.floor(
                    Math.max(
                        minDialogWidth,
                        Math.min(
                            windowWidth - dialogRight - dialogLeft,
                            initialDialogWidth
                        )
                    )
                )
            );
        };

        // With event listener on window resize
        window.addEventListener("resize", handleWindowResize);
        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };
    }, [
        dialogRef.current,
        dialogPosition,
        initialDialogWidth,
        isMovedOutsideWindow,
    ]);

    const handleActionButtonClick = (action: string) => {
        props.setProps({
            last_action_called: action,
            open: open,
            actions_called: actionsCalled + 1,
        });
        setActionsCalled(actionsCalled + 1);
    };

    return document.getElementsByClassName("WebvizDialog__root").length > 0
        ? ReactDOM.createPortal(
              <div style={{ display: open ? "block" : "none" }}>
                  {props.modal && (
                      <Backdrop
                          opacity={0.7}
                          onClick={() =>
                              handleClose(DialogCloseReason.BackdropClick)
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
                              handleClose(DialogCloseReason.ButtonClick)
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
              document.getElementsByClassName("WebvizDialog__root")[0]
          )
        : null;
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
