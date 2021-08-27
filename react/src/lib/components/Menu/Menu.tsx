import React from "react";
import PropTypes, { string } from "prop-types";
import useSize from "@react-hook/size";

import { TopMenu } from "./components/TopMenu/TopMenu";
import { MenuBar } from "./components/MenuBar/MenuBar";
import { MenuDrawer } from "./components/MenuDrawer/MenuDrawer";
import { Overlay } from "./components/Overlay/Overlay";
import { Logo } from "./components/Logo/Logo";
import { MenuPosition } from "./types/menu-position";
import { MenuContent } from "./components/MenuContent/MenuContent";

import {
    PropertyNavigationType,
    NavigationType,
    PropertySectionType,
    PropertyGroupType,
    PropertyPageType,
    PageType,
    GroupType,
    SectionType,
} from "./types/navigation";

import "./Menu.css";

type MenuProps = {
    id?: string;
    setProps?: () => void;
    navigationItems: PropertyNavigationType;
    initiallyPinned?: boolean;
    position?: "top" | "left" | "right" | "bottom";
    smallLogoUrl?: string;
    logoUrl?: string;
};

const makeNavigationItemsWithAssignedIds = (
    navigationItems: PropertyNavigationType
): NavigationType => {
    let index = 0;
    const recursivelyAssignUuids = (
        item: PropertyPageType | PropertyGroupType | PropertySectionType
    ): GroupType | PageType | SectionType => {
        if (item.type === "group") {
            return {
                ...item,
                type: "group",
                content: (item as PropertyGroupType).content.map(
                    (el) => recursivelyAssignUuids(el) as GroupType | PageType
                ),
                uuid: `${index++}`,
            };
        } else if (item.type === "page") {
            return {
                ...item,
                type: "page",
                uuid: `${index++}`,
            };
        } else {
            return {
                ...item,
                type: "section",
                content: (item as PropertySectionType).content.map(
                    (el) => recursivelyAssignUuids(el) as GroupType | PageType
                ),
                uuid: `${index++}`,
            };
        }
    };
    return navigationItems.map(
        (el: PropertySectionType | PropertyGroupType | PropertyPageType) =>
            recursivelyAssignUuids(el)
    ) as NavigationType;
};

export const Menu: React.FC<MenuProps> = (props) => {
    const position = props.position || "left";

    const [open, setOpen] = React.useState<boolean>(false);
    const [pinned, setPinned] = React.useState<boolean>(
        props.initiallyPinned || false
    );
    const [
        navigationItemsWithAssignedIds,
        setNavigationsItemsWithAssignedIds,
    ] = React.useState<NavigationType>(
        makeNavigationItemsWithAssignedIds(props.navigationItems)
    );
    const [homepage, setHomepage] = React.useState<string>("");

    React.useEffect(() => {
        setHomepage(window.location.href);
    }, []);

    const menuBarRef = React.useRef<HTMLDivElement>(null);
    const menuDrawerRef = React.useRef<HTMLDivElement>(null);
    const [menuBarWidth, menuBarHeight] = useSize(menuBarRef);
    const [menuDrawerWidth, menuDrawerHeight] = useSize(menuDrawerRef);

    const menuContentSpacing = 50;

    React.useEffect(() => {
        setNavigationsItemsWithAssignedIds(
            makeNavigationItemsWithAssignedIds(props.navigationItems)
        );
    }, [props.navigationItems]);

    React.useEffect(() => {
        document.body.style.marginLeft = pinned
            ? `${menuDrawerWidth + menuContentSpacing}px`
            : `${menuBarWidth + menuContentSpacing}px`;
    }, [menuBarWidth, menuDrawerWidth, pinned]);

    return (
        <div className="Menu">
            <Overlay visible={open && !pinned} onClick={() => setOpen(false)} />
            <MenuBar
                position={position as MenuPosition}
                visible={!open && !pinned}
                onMenuOpen={() => setOpen(true)}
                ref={menuBarRef}
                homepage={homepage}
                logoUrl={props.smallLogoUrl}
            />
            <MenuDrawer
                position={position as MenuPosition}
                open={open || pinned}
                ref={menuDrawerRef}
            >
                <TopMenu
                    pinned={pinned}
                    onPinnedChange={() => setPinned(!pinned)}
                />
                {props.logoUrl && (
                    <Logo
                        homepage={homepage}
                        size="large"
                        url={props.logoUrl}
                    />
                )}
                <MenuContent content={navigationItemsWithAssignedIds} />
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
    navigationItems: PropTypes.any,
};

Menu.defaultProps = {
    id: "some-id",
    setProps: () => {
        return;
    },
    initiallyPinned: false,
    position: "left",
};
