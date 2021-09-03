import React from "react";
import PropTypes from "prop-types";
import useSize from "@react-hook/size";

import { MenuDrawerPosition } from "../../types/menu-position";

import "./MenuDrawer.css";

type MenuDrawerProps = {
    position: MenuDrawerPosition;
    open: boolean;
    children?: React.ReactNode;
};

type Position = {
    left: number | "auto";
    top: number | "auto";
    right: number | "auto";
    bottom: number | "auto";
};

export const MenuDrawer = React.forwardRef<HTMLDivElement, MenuDrawerProps>(
    (props, ref) => {
        const [position, setPosition] = React.useState<Position>({
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        });
        const [visible, setVisible] = React.useState<boolean>(false);

        const drawerRef =
            (ref as React.RefObject<HTMLDivElement>) ||
            React.useRef<HTMLDivElement>(null);
        const drawerWidth = useSize(drawerRef)[0];

        const slideInDrawer = React.useCallback(
            (pos: Position) => {
                if (props.position === "left") {
                    let currentPosition = pos.left as number;
                    const interval = setInterval(() => {
                        if (currentPosition < 0) {
                            currentPosition += Math.min(
                                10,
                                Math.abs(currentPosition)
                            );
                            setPosition({
                                left: currentPosition,
                                top: pos.top,
                                right: pos.right,
                                bottom: pos.bottom,
                            });
                        } else {
                            clearInterval(interval);
                        }
                    }, 10);
                } else if (props.position === "right") {
                    let currentPosition = pos.right as number;
                    const interval = setInterval(() => {
                        if (currentPosition < 0) {
                            currentPosition += Math.min(
                                10,
                                Math.abs(currentPosition)
                            );
                            setPosition({
                                left: pos.left,
                                top: pos.top,
                                right: currentPosition,
                                bottom: pos.bottom,
                            });
                        } else {
                            clearInterval(interval);
                        }
                    }, 10);
                }
            },
            [setPosition, props.position]
        );

        const slideOutDrawer = React.useCallback(
            (pos: Position) => {
                if (props.position === "left") {
                    let currentPosition = pos.left as number;
                    const interval = setInterval(() => {
                        if (currentPosition > -drawerWidth) {
                            currentPosition -= Math.min(
                                10,
                                drawerWidth - Math.abs(currentPosition)
                            );
                            setPosition({
                                left: currentPosition,
                                top: pos.top,
                                right: pos.right,
                                bottom: pos.bottom,
                            });
                        } else {
                            setVisible(false);
                            clearInterval(interval);
                        }
                    }, 10);
                } else if (props.position === "right") {
                    let currentPosition = pos.right as number;
                    const interval = setInterval(() => {
                        if (currentPosition > -drawerWidth) {
                            currentPosition -= Math.min(
                                10,
                                drawerWidth - Math.abs(currentPosition)
                            );
                            setPosition({
                                left: pos.left,
                                top: pos.top,
                                right: currentPosition,
                                bottom: pos.bottom,
                            });
                        } else {
                            setVisible(false);
                            clearInterval(interval);
                        }
                    }, 10);
                }
            },
            [setPosition, setVisible, drawerWidth, props.position]
        );

        React.useEffect(() => {
            if (props.open) {
                if (props.position === "left") {
                    const newPosition: Position = {
                        left: -drawerWidth,
                        top: 0,
                        right: "auto",
                        bottom: "auto",
                    };
                    setPosition(newPosition);
                    setVisible(true);
                    slideInDrawer(newPosition);
                } else if (props.position === "right") {
                    const newPosition: Position = {
                        left: "auto",
                        top: 0,
                        right: -drawerWidth,
                        bottom: "auto",
                    };
                    setPosition(newPosition);
                    setVisible(true);
                    slideInDrawer(newPosition);
                }
            } else {
                if (props.position === "left") {
                    const newPosition: Position = {
                        left: 0,
                        top: 0,
                        right: "auto",
                        bottom: "auto",
                    };
                    slideOutDrawer(newPosition);
                } else if (props.position === "right") {
                    const newPosition: Position = {
                        left: "auto",
                        top: 0,
                        right: 0,
                        bottom: "auto",
                    };
                    slideOutDrawer(newPosition);
                }
            }
        }, [props.open]);

        return (
            <div
                ref={drawerRef}
                className={`MenuDrawer MenuDrawer${
                    props.position.charAt(0).toUpperCase() +
                    props.position.slice(1)
                }`}
                style={{
                    visibility: visible ? "visible" : "hidden",
                    left: position.left,
                    top: position.top,
                    right: position.right,
                    bottom: position.bottom,
                }}
            >
                <div className="MenuDrawerContentWrapper">{props.children}</div>
            </div>
        );
    }
);

MenuDrawer.displayName = "MenuDrawer";

MenuDrawer.propTypes = {
    position: PropTypes.oneOf<MenuDrawerPosition>([
        MenuDrawerPosition.Left,
        MenuDrawerPosition.Right,
    ]).isRequired,
    open: PropTypes.bool.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
};
