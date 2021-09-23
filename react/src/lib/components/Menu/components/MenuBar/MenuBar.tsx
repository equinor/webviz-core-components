import React from "react";
import PropTypes from "prop-types";
import { Button, Icon } from "@equinor/eds-core-react";
import { menu } from "@equinor/eds-icons";
import useSize from "@react-hook/size";

import { MenuBarPosition, MenuDrawerPosition } from "../../types/menu-position";
import { Logo } from "../Logo";

Icon.add({ menu });

import "./MenuBar.css";

type MenuBarProps = {
    position: MenuBarPosition;
    menuButtonPosition: MenuDrawerPosition;
    visible: boolean;
    showLogo: boolean;
    homepage: string;
    onMenuOpen: () => void;
    onLogoClick: (url: string) => void;
};

type Position = {
    left: number | "auto";
    top: number | "auto";
    right: number | "auto";
    bottom: number | "auto";
};

export const MenuBar = React.forwardRef<HTMLDivElement, MenuBarProps>(
    (props, ref) => {
        const handleMenuButtonClick = React.useCallback(() => {
            props.onMenuOpen();
        }, [props.onMenuOpen]);

        const [position, setPosition] = React.useState<Position>({
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        });

        const barRef =
            (ref as React.RefObject<HTMLDivElement>) ||
            React.useRef<HTMLDivElement>(null);

        const [visible, setVisible] = React.useState<boolean>(false);
        const interval = React.useRef<NodeJS.Timeout>();
        const [barWidth, barHeight] = useSize(barRef);

        React.useEffect(() => {
            return () => {
                if (interval.current) {
                    clearInterval(interval.current);
                }
            };
        }, []);

        const slideInBar = React.useCallback(
            (pos: Position) => {
                if (props.position === MenuBarPosition.Left) {
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
                } else if (props.position === MenuBarPosition.Right) {
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
                } else if (props.position === MenuBarPosition.Top) {
                    let currentPosition = pos.top as number;
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
                                top: currentPosition,
                                right: pos.right,
                                bottom: pos.bottom,
                            });
                        } else {
                            if (interval.current) {
                                clearInterval(interval.current);
                            }
                        }
                    }, 10);
                } else if (props.position === MenuBarPosition.Bottom) {
                    let currentPosition = pos.bottom as number;
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
                                right: pos.bottom,
                                bottom: currentPosition,
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

        const slideOutBar = React.useCallback(
            (pos: Position) => {
                if (props.position === MenuBarPosition.Left) {
                    let currentPosition = pos.left as number;
                    if (interval.current) {
                        clearInterval(interval.current);
                    }
                    interval.current = setInterval(() => {
                        if (currentPosition > -barWidth) {
                            currentPosition -= Math.min(
                                10,
                                barWidth - Math.abs(currentPosition)
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
                } else if (props.position === MenuBarPosition.Right) {
                    let currentPosition = pos.right as number;
                    if (interval.current) {
                        clearInterval(interval.current);
                    }
                    interval.current = setInterval(() => {
                        if (currentPosition > -barWidth) {
                            currentPosition -= Math.min(
                                10,
                                barWidth - Math.abs(currentPosition)
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
                } else if (props.position === MenuBarPosition.Top) {
                    let currentPosition = pos.top as number;
                    if (interval.current) {
                        clearInterval(interval.current);
                    }
                    interval.current = setInterval(() => {
                        if (currentPosition > -barHeight) {
                            currentPosition -= Math.min(
                                10,
                                barHeight - Math.abs(currentPosition)
                            );
                            setPosition({
                                left: pos.left,
                                top: currentPosition,
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
                } else if (props.position === MenuBarPosition.Bottom) {
                    let currentPosition = pos.bottom as number;
                    if (interval.current) {
                        clearInterval(interval.current);
                    }
                    interval.current = setInterval(() => {
                        if (currentPosition > -barHeight) {
                            currentPosition -= Math.min(
                                10,
                                barHeight - Math.abs(currentPosition)
                            );
                            setPosition({
                                left: pos.left,
                                top: pos.top,
                                right: pos.right,
                                bottom: currentPosition,
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
            [setPosition, setVisible, barWidth, props.position]
        );

        React.useEffect(() => {
            const newPosition: Position = {
                left: "auto",
                top: "auto",
                right: "auto",
                bottom: "auto",
            };
            if (props.visible) {
                if (props.position === MenuBarPosition.Left) {
                    newPosition.left = -barWidth;
                    newPosition.top = 0;
                } else if (props.position === MenuBarPosition.Right) {
                    newPosition.top = 0;
                    newPosition.right = -barWidth;
                } else if (props.position === MenuBarPosition.Top) {
                    newPosition.left = 0;
                    newPosition.top = -barHeight;
                } else if (props.position === MenuBarPosition.Bottom) {
                    newPosition.left = 0;
                    newPosition.bottom = -barHeight;
                }
                setPosition(newPosition);
                setVisible(true);
                slideInBar(newPosition);
            } else {
                if (props.position === MenuBarPosition.Left) {
                    newPosition.left = 0;
                    newPosition.top = 0;
                } else if (props.position === MenuBarPosition.Right) {
                    newPosition.top = 0;
                    newPosition.right = 0;
                } else if (props.position === MenuBarPosition.Top) {
                    newPosition.left = 0;
                    newPosition.top = 0;
                } else if (props.position === MenuBarPosition.Bottom) {
                    newPosition.left = 0;
                    newPosition.bottom = 0;
                }
                slideOutBar(newPosition);
            }
        }, [props.visible]);

        return (
            <div
                ref={ref}
                className={`Menu__MenuBar Menu__MenuBar${
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
                {props.showLogo && (
                    <Logo
                        onClick={props.onLogoClick}
                        homepage={props.homepage}
                        size="small"
                    />
                )}
                <div
                    style={{
                        flexGrow: 1,
                        textAlign:
                            props.menuButtonPosition ===
                                MenuDrawerPosition.Right &&
                            (props.position === MenuBarPosition.Top ||
                                props.position === MenuBarPosition.Bottom)
                                ? "right"
                                : "inherit",
                    }}
                >
                    <Button
                        variant="ghost_icon"
                        onClick={handleMenuButtonClick}
                    >
                        <Icon name="menu" title="Open menu" />
                    </Button>
                </div>
            </div>
        );
    }
);

MenuBar.displayName = "MenuBar";

MenuBar.propTypes = {
    position: PropTypes.oneOf<MenuBarPosition>([
        MenuBarPosition.Left,
        MenuBarPosition.Top,
        MenuBarPosition.Right,
        MenuBarPosition.Bottom,
    ]).isRequired,
    menuButtonPosition: PropTypes.oneOf<MenuDrawerPosition>([
        MenuDrawerPosition.Left,
        MenuDrawerPosition.Right,
    ]).isRequired,
    visible: PropTypes.bool.isRequired,
    showLogo: PropTypes.bool.isRequired,
    homepage: PropTypes.string.isRequired,
    onMenuOpen: PropTypes.func.isRequired,
    onLogoClick: PropTypes.func.isRequired,
};
