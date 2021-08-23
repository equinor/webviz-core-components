import React from "react";
import PropTypes, { string } from "prop-types";

import { TopMenu } from "./components/TopMenu";
import { MenuBar } from "./components/MenuBar";
import { MenuDrawer } from "./components/MenuDrawer";
import { Overlay } from "./components/Overlay";

import { NavigationType } from "./types/navigation";
import { useContainerDimensions } from "./hooks/useContainerDimensions";
import { MenuPosition } from "./types/menuPosition";
import { MenuContent } from "./components/MenuContent";
import { any } from "prop-types";

type MenuProps = {
    id?: string;
    setProps?: () => void;
    navigationItems: NavigationType;
    initiallyPinned?: boolean;
    position?: "top" | "left" | "right" | "bottom";
    smallLogoUrl?: string;
    logoUrl?: string;
};

export const Menu: React.FC<MenuProps> = (props) => {
    const position = props.position || "left";

    const [open, setOpen] = React.useState<boolean>(false);
    const [pinned, setPinned] = React.useState<boolean>(
        props.initiallyPinned || false
    );

    const menuBarRef = React.useRef<HTMLDivElement>(null);
    const menuDrawerRef = React.useRef<HTMLDivElement>(null);
    const menuBarSize = useContainerDimensions(menuBarRef);
    const menuDrawerSize = useContainerDimensions(menuDrawerRef);

    const menuContentSpacing = 50;

    React.useEffect(() => {
        document.body.style.marginLeft = pinned
            ? `${menuDrawerSize.width + menuContentSpacing}px`
            : `${menuBarSize.width + menuContentSpacing}px`;
    }, [menuBarSize, menuDrawerSize, pinned]);

    return (
        <div className="Menu">
            <Overlay visible={open && !pinned} onClick={() => setOpen(false)} />
            <MenuBar
                position={position as MenuPosition}
                visible={!open}
                onMenuOpen={() => setOpen(true)}
                ref={menuBarRef}
            />
            <MenuDrawer
                position={position as MenuPosition}
                open={open}
                ref={menuDrawerRef}
            >
                <TopMenu
                    pinned={pinned}
                    onPinnedChange={() => setPinned(!pinned)}
                />
                <MenuContent content={props.navigationItems} />
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

    /**
     * A list of navigation items to show in the menu.
     */
    navigationItems: any,
};

Menu.defaultProps = {
    id: "some-id",
    setProps: () => {
        return;
    },
    initiallyPinned: false,
    position: "left",
};
