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
            // TODO: Remove WebvizDialog_root if all dialogs are deleted?
            // const node = document.getElementsByClassName("WebvizDialog__root");
            // document.body.removeChild()
        };
    }, []);

    React.useEffect(() => {
        setOpen(props.open || false);

        if (props.open && dialogRef.current) {
            handleSetActive();
        }
    }, [props.open, dialogRef.current]);

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
            setInitialDialogWidth(
                dialogRef.current.getBoundingClientRect().width
            );
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (dialogRef.current) {
            resizeObserver.observe(dialogRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [dialogRef.current, initialDialogWidth]);

    React.useEffect(() => {
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

            const currentMousePosition = { x: clientX, y: clientY };
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

                if (!dialogRef.current) {
                    return;
                }

                setIsMovedOutsideWindow(
                    !isDOMRectContained(
                        dialogRef.current.getBoundingClientRect(),
                        new DOMRect(0, 0, window.innerWidth, window.innerHeight)
                    )
                );
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
            const deltaWidth = windowWidth - previousWindowWidth; // Decreasing width: deltaWidth < 0, otherwise increasing width

            const paddingLeft = 16;
            const paddingRight = 16;

            // TODO: Handle min width of content or add minWidth prop for component?
            const minDialogWidth = 300;

            // When dialog is partly outside window
            // - Adjust width of dialog when outside on the left side
            // - Adjust left position when outside on the right side
            if (isMovedOutsideWindow) {
                if (
                    dialogLeft < 0 &&
                    deltaWidth < 0 &&
                    windowWidth - paddingRight <
                        dialogLeft + dialogWidth + paddingRight
                ) {
                    // Decrease dialog width when window width decrease
                    const newDialogWidth = Math.min(
                        Math.max(minDialogWidth, dialogWidth + deltaWidth),
                        initialDialogWidth
                    );
                    dialogRef.current.style.width = newDialogWidth.toString();
                } else if (
                    dialogLeft < 0 &&
                    deltaWidth > 0 &&
                    windowWidth - paddingRight >
                        dialogLeft + dialogWidth + paddingRight
                ) {
                    // Increase dialog width when window width increase
                    const newDialogWidth = Math.min(
                        Math.max(minDialogWidth, dialogWidth + deltaWidth),
                        initialDialogWidth
                    );
                    dialogRef.current.style.width = newDialogWidth.toString();
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

                previousWindowWidth = windowWidth;
                return;
            }

            // Move towards left is possible - otherwise decrease width as much as possible
            if (dialogLeft > paddingLeft && deltaWidth < 0) {
                setDialogPosition({
                    y: dialogPosition.y,
                    x: Math.max(paddingLeft, dialogPosition.x + deltaWidth),
                });
                return;
            }

            // TODO: Update code: incorrect if moved from outside and margin to left and right side is less than padding
            // - i.e. should create new width by left padding, dialog width and right padding
            const newDialogWidth = Math.max(
                minDialogWidth,
                Math.min(
                    Math.floor(
                        windowWidth -
                            paddingRight -
                            Math.floor(dialogPosition.x)
                    ),
                    initialDialogWidth
                )
            );
            dialogRef.current.style.width = newDialogWidth.toString();
        };

        // With event listener on window resize
        window.addEventListener("resize", handleWindowResize);
        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };

        // With resize observer
        // const resizeObserver = new ResizeObserver(handleResize);
        // resizeObserver.observe(document.documentElement);
        // return () => {
        //     resizeObserver.disconnect();
        // };
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
