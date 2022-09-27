import React from "react";
import * as ReactDOM from "react-dom";
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

type Rectangle = {
    top: number;
    left: number;
    size: Size;
};

const isRectangleContained = (inner: Rectangle, outer: Rectangle): boolean => {
    return (
        inner.left >= outer.left &&
        inner.top >= outer.top &&
        inner.top + inner.size.height <= outer.top + outer.size.height &&
        inner.left + inner.size.width <= outer.left + outer.size.width
    );
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

    // const [hasDialogRoot, setHasDialogRoot] = React.useState<boolean>(false);

    // const [dialogWidth, setDialogWidth] =
    //     React.useState<number | undefined>(undefined);
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

        if (!props.open && dialogRef.current) {
            dialogRef.current.className = "WebvizDialogInactive";
        }
        if (props.open && dialogRef.current) {
            handleSetActive();
        } else {
        }
    }, [props.open, dialogRef.current]);

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

    React.useEffect(() => {}, [dialogPosition]);

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
                    const newPosition = pointSum(delta, dialogPosition);
                    setDialogPosition(newPosition);
                    if (!dialogRef.current) {
                        return;
                    }

                    const dialogRectangle: Rectangle = {
                        top: dialogRef.current.getBoundingClientRect().top,
                        left: dialogRef.current.getBoundingClientRect().left,
                        size: {
                            width: dialogRef.current.getBoundingClientRect()
                                .width,
                            height: dialogRef.current.getBoundingClientRect()
                                .height,
                        },
                    };
                    const windowRectangle: Rectangle = {
                        top: 0,
                        left: 0,
                        size: {
                            width: window.innerWidth,
                            height: window.innerHeight,
                        },
                    };
                    setIsMovedOutsideWindow(
                        !isRectangleContained(dialogRectangle, windowRectangle)
                    );
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

        const handleBlur = () => {
            moveStarted = false;
        };

        dialogTitleRef.current.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("blur", handleBlur);
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
            const deltaWidth = previousWindowWidth - windowWidth; // Decreasing width: deltaWidth > 0, otherwise increasing width

            const paddingLeft = 16;
            const paddingRight = 16;

            const minDialogWidth = 300;

            // When dialog is partly outside window
            // - Adjust width of dialog when outside on the left side
            // - Adjust left position when outside on the right side
            if (isMovedOutsideWindow) {
                if (
                    dialogLeft < 0 &&
                    deltaWidth > 0 &&
                    windowWidth - paddingRight <
                        dialogLeft + dialogWidth + paddingRight
                ) {
                    // Decrease dialog width when window width decrease
                    const newDialogWidth = Math.min(
                        Math.max(minDialogWidth, dialogWidth - deltaWidth),
                        initialDialogWidth
                    );
                    dialogRef.current.style.width = newDialogWidth.toString();
                }
                if (
                    dialogLeft < 0 &&
                    deltaWidth < 0 &&
                    windowWidth - paddingRight >
                        dialogLeft + dialogWidth + paddingRight
                ) {
                    // Increase dialog width when window width increase
                    const newDialogWidth = Math.min(
                        Math.max(minDialogWidth, dialogWidth - deltaWidth),
                        initialDialogWidth
                    );
                    dialogRef.current.style.width = newDialogWidth.toString();
                }
                if (dialogLeft > 0) {
                    // TODO: Move left if possible
                    if (deltaWidth > 0) {
                        setDialogPosition({
                            x: Math.max(paddingLeft, dialogLeft - deltaWidth),
                            y: dialogPosition.y,
                        });
                    }

                    // Update state
                    const dialogRectangle: Rectangle = {
                        top: dialogRef.current.getBoundingClientRect().top,
                        left: dialogRef.current.getBoundingClientRect().left,
                        size: {
                            width:
                                dialogRef.current.getBoundingClientRect()
                                    .width + paddingRight,
                            height: dialogRef.current.getBoundingClientRect()
                                .height,
                        },
                    };
                    const windowRectangle: Rectangle = {
                        top: 0,
                        left: 0,
                        size: {
                            width: window.innerWidth,
                            height: window.innerHeight,
                        },
                    };
                    setIsMovedOutsideWindow(
                        !isRectangleContained(dialogRectangle, windowRectangle)
                    );
                }

                previousWindowWidth = windowWidth;
                return;
            }

            // Move towards left is possible - otherwise decrease width as much as possible
            if (dialogLeft > paddingLeft && deltaWidth > 0) {
                setDialogPosition({
                    y: dialogPosition.y,
                    x: Math.max(paddingLeft, dialogPosition.x - deltaWidth),
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
    // }, [dialogRef.current, document, dialogPosition, setDialogWidth]);

    React.useEffect(() => {
        // TEMP
        console.log(dialogPosition);
    }, [dialogPosition]);

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
              <div
                  className={"WebvizDialogActive"}
                  id={props.id}
                  ref={dialogRef}
                  style={{
                      display: open ? "block" : "none",
                      left: Math.floor(dialogPosition.x),
                      top: Math.floor(dialogPosition.y),
                  }}
                  onMouseDown={() => handleSetActive()}
              >
                  <WebvizDialogTitle
                      onClose={() => handleClose("buttonClick")}
                      ref={dialogTitleRef}
                  >
                      {props.title}
                  </WebvizDialogTitle>
                  <div className="WebvizDialogContent">{props.children}</div>
                  <div className="WebvizDialogActions">
                      {props.actions &&
                          props.actions.map((action) => (
                              <Button
                                  key={action}
                                  component="button"
                                  onClick={() =>
                                      handleActionButtonClick(action as string)
                                  }
                              >
                                  {action}
                              </Button>
                          ))}
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
