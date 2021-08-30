import React from "react";
import PropTypes, { string } from "prop-types";
import useSize from "@react-hook/size";

import { TopMenu } from "./components/TopMenu/TopMenu";
import { MenuBar } from "./components/MenuBar/MenuBar";
import { MenuDrawer } from "./components/MenuDrawer/MenuDrawer";
import { Overlay } from "./components/Overlay/Overlay";
import { Logo } from "./components/Logo/Logo";
import { MenuBarPosition, MenuDrawerPosition } from "./types/menu-position";
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
    menuBarPosition?: "top" | "left" | "right" | "bottom";
    menuDrawerPosition?: "left" | "right";
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
    const menuBarPosition = props.menuBarPosition || "left";
    const menuDrawerPosition = props.menuDrawerPosition || "left";

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
    const [menuDrawerWidth, _] = useSize(menuDrawerRef);

    const menuContentSpacing = 50;

    React.useEffect(() => {
        setNavigationsItemsWithAssignedIds(
            makeNavigationItemsWithAssignedIds(props.navigationItems)
        );
    }, [props.navigationItems]);

    React.useEffect(() => {
        const bodyMargins = { left: 16, top: 16, right: 16, bottom: 16 };

        if (props.menuBarPosition === "left" && !pinned) {
            bodyMargins.left = menuBarWidth + menuContentSpacing;
        } else if (props.menuBarPosition === "top") {
            bodyMargins.top = menuBarHeight + menuContentSpacing;
        } else if (props.menuBarPosition === "right" && !pinned) {
            bodyMargins.right = menuBarWidth + menuContentSpacing;
        } else if (props.menuBarPosition === "bottom") {
            bodyMargins.bottom = menuBarHeight + menuContentSpacing;
        }

        if (props.menuDrawerPosition === "left" && pinned) {
            bodyMargins.left = menuDrawerWidth + menuContentSpacing;
        } else if (props.menuDrawerPosition === "right" && pinned) {
            bodyMargins.right = menuDrawerWidth + menuContentSpacing;
        }

        document.body.style.marginLeft = bodyMargins.left + "px";
        document.body.style.marginTop = bodyMargins.top + "px";
        document.body.style.marginRight = bodyMargins.right + "px";
        document.body.style.marginBottom = bodyMargins.bottom + "px";
    }, [
        menuBarWidth,
        menuDrawerWidth,
        pinned,
        menuBarPosition,
        menuDrawerPosition,
    ]);

    return (
        <div className="Menu">
            <Overlay visible={open && !pinned} onClick={() => setOpen(false)} />
            <MenuBar
                position={menuBarPosition as MenuBarPosition}
                menuButtonPosition={menuDrawerPosition as MenuDrawerPosition}
                visible={!open && !pinned}
                onMenuOpen={() => setOpen(true)}
                ref={menuBarRef}
                homepage={homepage}
                logoUrl={props.smallLogoUrl}
            />
            <MenuDrawer
                position={menuDrawerPosition as MenuDrawerPosition}
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
     * Define the position the menu bar shall be displayed at.
     */
    menuBarPosition: PropTypes.oneOf(["left", "top", "right", "bottom"]),

    /**
     * Define the position the menu drawer shall be displayed at.
     */
    menuDrawerPosition: PropTypes.oneOf(["left", "right"]),

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
    menuBarPosition: "left",
    menuDrawerPosition: "left",
};
