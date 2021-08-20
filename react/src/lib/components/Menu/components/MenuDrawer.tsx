import React from "react";
import PropTypes from "prop-types";

import { useContainerDimensions } from "../hooks/useContainerDimensions";

import "./MenuDrawer.css";

type MenuDrawerProps = {
    position: "left" | "top" | "right" | "bottom";
    open: boolean;
    children?: React.ReactNode;
};

type Position = {
    left: number | "auto";
    top: number | "auto";
    right: number | "auto";
    bottom: number | "auto";
};

export const MenuDrawer: React.FC<MenuDrawerProps> = (
    props: MenuDrawerProps
) => {
    const [position, setPosition] = React.useState<Position>({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
    });
    const [visible, setVisible] = React.useState<boolean>(false);

    const drawerRef = React.useRef<HTMLDivElement>(null);
    const drawerSize = useContainerDimensions(drawerRef);

    React.useEffect(() => {
        let currentPosition = position.left as number;
        const interval = setInterval(() => {
            if (currentPosition < 0) {
                currentPosition += Math.min(10, Math.abs(currentPosition));
                setPosition({
                    left: currentPosition,
                    top: position.top,
                    right: position.right,
                    bottom: position.bottom,
                });
            } else {
                clearInterval(interval);
            }
        }, 10);
    }, [visible]);

    React.useEffect(() => {
        if (props.open) {
            if (props.position === "left") {
                setPosition({
                    left: -drawerSize.width,
                    top: 0,
                    right: "auto",
                    bottom: "auto",
                });
                setVisible(true);
            }
        } else {
            if (props.position === "left") {
                const interval = setInterval(() => {
                    if (position.left > drawerSize.width) {
                        setPosition({
                            left: (position.left as number) - 10,
                            top: position.top,
                            right: position.right,
                            bottom: position.bottom,
                        });
                    } else {
                        clearInterval(interval);
                        setVisible(false);
                    }
                }, 100);
            }
        }
    }, [props.open]);

    return (
        <div
            ref={drawerRef}
            className={`MenuDrawer MenuDrawer${
                props.position.charAt(0).toUpperCase() + props.position.slice(1)
            }`}
            style={{
                visibility: visible ? "visible" : "hidden",
                left: position.left,
                top: position.top,
                right: position.right,
                bottom: position.bottom,
            }}
        >
            {props.children}
        </div>
    );
};

MenuDrawer.propTypes = {
    position: PropTypes.oneOf(["left", "top", "right", "bottom"]).isRequired,
    open: PropTypes.bool.isRequired,
};
