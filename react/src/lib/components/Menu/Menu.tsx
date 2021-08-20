import React from "react";
import PropTypes, { string } from "prop-types";

import { TopMenu } from "./components/TopMenu";
import { MenuBar } from "./components/MenuBar";
import { MenuDrawer } from "./components/MenuDrawer";

import { Navigation } from "./types/navigation";

type MenuProps = {
    id?: string;
    setProps?: () => void;
    navigationItems: Navigation;
    initiallyPinned?: boolean;
    position?: "top" | "left" | "right" | "bottom";
    smallLogoUrl?: string;
    logoUrl?: string;
};

export const Menu: React.FC<MenuProps> = (props) => {
    const position = props.position || "left";

    const [open, setOpen] = React.useState(false);
    const [pinned, setPinned] = React.useState(props.initiallyPinned || false);

    const currentHref = window.location.href;

    return (
        <div className="Menu">
            <MenuBar position={position} onMenuOpen={() => setOpen(true)} />
            <MenuDrawer position={position} open={open}>
                <TopMenu pinned={pinned}></TopMenu>
            </MenuDrawer>
        </div>
    );
};

Menu.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string,

    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change
     */
    setProps: PropTypes.func,

    /**
     * Set to true if the menu shall be initially shown as pinned.
     */
    initiallyPinned: PropTypes.bool,

    /**
     * Define the position the menu shall be displayed at.
     */
    position: PropTypes.oneOf(["left", "top", "right", "bottom"]),

    /**
     * URL to a small logo asset that is shown when the menu is collapsed.
     */
    smallLogoUrl: string,

    /**
     * URL to a large logo asset that is shown when the menu is opened.
     */
    logoUrl: string,
};

Menu.defaultProps = {
    id: "some-id",
    setProps: () => {
        return;
    },
    initiallyPinned: false,
    position: "left",
};
