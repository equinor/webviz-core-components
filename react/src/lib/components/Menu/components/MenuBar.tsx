import React from "react";
import PropTypes from "prop-types";
import { Button, Icon } from "@equinor/eds-core-react";
import { menu } from "@equinor/eds-icons";

Icon.add({ menu });

import "./MenuBar.css";

type MenuBarProps = {
    position: "left" | "top" | "right" | "bottom";
    logoUrl?: string;
    onMenuOpen: () => void;
};

export const MenuBar: React.FC<MenuBarProps> = (props: MenuBarProps) => {
    const handleMenuButtonClick = React.useCallback(() => {
        props.onMenuOpen();
    }, [props.onMenuOpen]);

    return (
        <div
            className={`MenuBar MenuBar${
                props.position.charAt(0).toUpperCase() + props.position.slice(1)
            }`}
        >
            <Button variant="ghost_icon" onClick={handleMenuButtonClick}>
                <Icon name="menu" title="Open menu" />
            </Button>
        </div>
    );
};

MenuBar.propTypes = {
    position: PropTypes.oneOf(["left", "top", "right", "bottom"]).isRequired,
    logoUrl: PropTypes.string,
    onMenuOpen: PropTypes.func.isRequired,
};
