import React from "react";
import PropTypes from "prop-types";
import { Button, Icon } from "@equinor/eds-core-react";
import { menu } from "@equinor/eds-icons";

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
};

export const MenuBar = React.forwardRef<HTMLDivElement, MenuBarProps>(
    (props, ref) => {
        const handleMenuButtonClick = React.useCallback(() => {
            props.onMenuOpen();
        }, [props.onMenuOpen]);

        return (
            <div
                ref={ref}
                className={`Menu__MenuBar Menu__MenuBar${
                    props.position.charAt(0).toUpperCase() +
                    props.position.slice(1)
                }`}
            >
                {props.showLogo && (
                    <Logo homepage={props.homepage} size="small" />
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
};
