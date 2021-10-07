import React from "react";
import PropTypes from "prop-types";
import useSize from "@react-hook/size";

import { MenuDrawerPosition } from "../../types/menu-position";

import "./MenuDrawer.css";

type MenuDrawerProps = {
    position: MenuDrawerPosition;
    open: boolean;
    pinned: boolean;
    maxWidth: number;
    currentUrl: string;
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
        const interval = React.useRef<NodeJS.Timeout>();

        const drawerRef =
            (ref as React.RefObject<HTMLDivElement>) ||
            React.useRef<HTMLDivElement>(null);
        const drawerWidth = useSize(drawerRef)[0];

        React.useEffect(() => {
            return () => {
                if (interval.current) {
                    clearInterval(interval.current);
                }
            };
        }, []);

        const slideInDrawer = React.useCallback(
            (pos: Position) => {
                if (props.position === MenuDrawerPosition.Left) {
                    let currentPosition = pos.left as number;
                    if (interval.current) {
                        clearInterval(interval.current);
                    }
                    interval.current = setInterval(() => {
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
                            if (interval.current) {
                                clearInterval(interval.current);
                            }
                        }
                    }, 10);
                } else if (props.position === MenuDrawerPosition.Right) {
                    let currentPosition = pos.right as number;
                    if (interval.current) {
                        clearInterval(interval.current);
                    }
                    interval.current = setInterval(() => {
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
                            if (interval.current) {
                                clearInterval(interval.current);
                            }
                        }
                    }, 10);
                }
            },
            [setPosition, props.position]
        );

        const slideOutDrawer = React.useCallback(
            (pos: Position) => {
                if (props.position === MenuDrawerPosition.Left) {
                    let currentPosition = pos.left as number;
                    if (interval.current) {
                        clearInterval(interval.current);
                    }
                    interval.current = setInterval(() => {
                        if (currentPosition > -drawerWidth) {
                            currentPosition -= Math.min(
                                drawerWidth / 30, // slide out in 300 ms
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
                            if (interval.current) {
                                clearInterval(interval.current);
                            }
                        }
                    }, 10);
                } else if (props.position === MenuDrawerPosition.Right) {
                    let currentPosition = pos.right as number;
                    if (interval.current) {
                        clearInterval(interval.current);
                    }
                    interval.current = setInterval(() => {
                        if (currentPosition > -drawerWidth) {
                            currentPosition -= Math.min(
                                drawerWidth / 30, // slide out in 300 ms
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
                            if (interval.current) {
                                clearInterval(interval.current);
                            }
                        }
                    }, 10);
                }
            },
            [setPosition, setVisible, drawerWidth, props.position]
        );

        React.useEffect(() => {
            const newPosition: Position = {
                left: "auto",
                top: "auto",
                right: "auto",
                bottom: "auto",
            };
            if (props.open) {
                if (props.position === MenuDrawerPosition.Left) {
                    newPosition.left = -drawerWidth;
                    newPosition.top = 0;
                } else if (props.position === MenuDrawerPosition.Right) {
                    newPosition.right = -drawerWidth;
                    newPosition.top = 0;
                }
                setPosition(newPosition);
                setVisible(true);
                slideInDrawer(newPosition);
            } else {
                if (props.position === MenuDrawerPosition.Left) {
                    newPosition.left = 0;
                    newPosition.top = 0;
                } else if (props.position === MenuDrawerPosition.Right) {
                    newPosition.right = 0;
                    newPosition.top = 0;
                }
                slideOutDrawer(newPosition);
            }
        }, [props.open]);

        return (
            <div
                ref={drawerRef}
                className={`Menu__MenuDrawer Menu__MenuDrawer${
                    props.position.charAt(0).toUpperCase() +
                    props.position.slice(1)
                } ${
                    !props.pinned
                        ? `Menu__MenuDrawer${
                              props.position.charAt(0).toUpperCase() +
                              props.position.slice(1)
                          }__unpinned`
                        : ""
                }`}
                style={{
                    visibility: visible ? "visible" : "hidden",
                    left: position.left,
                    top: position.top,
                    right: position.right,
                    bottom: position.bottom,
                    width: props.maxWidth + "px",
                    maxWidth: props.maxWidth + "px",
                }}
            >
                {props.pinned && (
                    <div
                        className={`Menu__MenuDrawer${
                            props.position.charAt(0).toUpperCase() +
                            props.position.slice(1)
                        }__pinned_shadow`}
                    ></div>
                )}
                <div className="Menu__MenuDrawerContentWrapper">
                    {props.children}
                </div>
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
    pinned: PropTypes.bool.isRequired,
    maxWidth: PropTypes.number.isRequired,
    currentUrl: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
};
