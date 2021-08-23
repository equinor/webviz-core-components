import React from "react";
import PropTypes from "prop-types";
import { Button, Icon } from "@equinor/eds-core-react";
import { menu } from "@equinor/eds-icons";

import { MenuPosition } from "../types/menuPosition";

Icon.add({ menu });

import "./MenuBar.css";

type MenuBarProps = {
    position: MenuPosition;
    visible: boolean;
    logoUrl?: string;
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
                className={`MenuBar MenuBar${
                    props.position.charAt(0).toUpperCase() +
                    props.position.slice(1)
                }`}
            >
                <Button variant="ghost_icon" onClick={handleMenuButtonClick}>
                    <Icon name="menu" title="Open menu" />
                </Button>
            </div>
        );
    }
);

MenuBar.displayName = "MenuBar";

MenuBar.propTypes = {
    position: PropTypes.oneOf<MenuPosition>([
        MenuPosition.Left,
        MenuPosition.Top,
        MenuPosition.Right,
        MenuPosition.Bottom,
    ]).isRequired,
    visible: PropTypes.bool.isRequired,
    logoUrl: PropTypes.string,
    onMenuOpen: PropTypes.func.isRequired,
};
