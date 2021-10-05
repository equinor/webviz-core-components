import React from "react";
import PropTypes from "prop-types";
import useSize from "@react-hook/size";

import { TopMenu } from "./components/TopMenu/TopMenu";
import { MenuBar } from "./components/MenuBar/MenuBar";
import { MenuDrawer } from "./components/MenuDrawer/MenuDrawer";
import { Overlay } from "../Overlay/Overlay";
import { Logo } from "./components/Logo/Logo";
import { MenuBarPosition, MenuDrawerPosition } from "./types/menu-position";
import { MenuContent } from "./components/MenuContent/MenuContent";
import { useWindowSize } from "../../hooks/useWindowSize";

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

export type ParentProps = {
    url: string;
};

type MenuProps = {
    id?: string;
    navigationItems: PropertyNavigationType;
    initiallyPinned?: boolean;
    initiallyCollapsed?: boolean;
    menuBarPosition?: "top" | "left" | "right" | "bottom";
    menuDrawerPosition?: "left" | "right";
    showLogo?: boolean;
    url?: string;
    setProps?: (props: ParentProps) => void;
};

const calculateTextWidth = (text: string): number => {
    const span = document.createElement("span");
    span.classList.add("Menu__Ruler");
    const menu = document.getElementsByClassName("Menu")[0];
    if (menu) {
        const fontSize = window.getComputedStyle(menu).fontSize;
        span.style.fontSize = fontSize;
    }
    const textNode = document.createTextNode(text.replace(/ /g, "\u00A0"));
    span.appendChild(textNode);
    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);
    return Math.max(width);
};

const makeNavigationItemsWithAssignedIds = (
    navigationItems: PropertyNavigationType
): NavigationType => {
    const indices = {
        section: 0,
        group: 0,
        page: 0,
    };
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
                id: `group-${indices.group++}`,
            };
        } else if (item.type === "page") {
            return {
                ...item,
                type: "page",
                id: `page-${indices.page++}`,
            };
        } else {
            return {
                ...item,
                type: "section",
                content: (item as PropertySectionType).content.map(
                    (el) => recursivelyAssignUuids(el) as GroupType | PageType
                ),
                id: `section-${indices.section++}`,
            };
        }
    };
    return navigationItems.map(
        (el: PropertySectionType | PropertyGroupType | PropertyPageType) =>
            recursivelyAssignUuids(el)
    ) as NavigationType;
};

const getNavigationMaxWidth = (
    navigationItems: PropertyNavigationType
): number => {
    const recursivelyParseItems = (
        items: (PropertyPageType | PropertyGroupType | PropertySectionType)[],
        iconAtParentLevel?: boolean,
        depth = 0
    ) => {
        let maxWidth = 0;
        const atLeastOneIconUsed = items.some((el) => el.icon !== undefined);
        items.forEach((item) => {
            maxWidth = Math.max(
                maxWidth,
                depth * 16 +
                    calculateTextWidth(item.title) +
                    (item.icon || iconAtParentLevel ? 40 : 0)
            );
            if (item.type !== "page") {
                maxWidth = Math.max(
                    maxWidth,
                    recursivelyParseItems(
                        item.content,
                        atLeastOneIconUsed,
                        depth + 1
                    )
                );
            }
        });
        return maxWidth;
    };
    return recursivelyParseItems(navigationItems);
};

/**
 * Menu is a component that allows to create an interactive menu with flexible depth that
 * can be pinned and filtered.
 */
export const Menu: React.FC<MenuProps> = (props) => {
    const menuBarPosition = props.menuBarPosition || "left";
    const menuDrawerPosition = props.menuDrawerPosition || "left";
    const showLogo = props.showLogo || false;

    const [open, setOpen] = React.useState<boolean>(false);
    const [pinned, setPinned] = React.useState<boolean>(
        localStorage.getItem("pinned") === "true" ||
            props.initiallyPinned ||
            false
    );
    const [currentUrl, setCurrentUrl] = React.useState<string>(
        window.location.href
    );

    const [menuWidth, setMenuWidth] = React.useState<number>(
        getNavigationMaxWidth(props.navigationItems) + 40
    );

    const [
        navigationItemsWithAssignedIds,
        setNavigationsItemsWithAssignedIds,
    ] = React.useState<NavigationType>(
        makeNavigationItemsWithAssignedIds(props.navigationItems)
    );

    React.useEffect(() => {
        localStorage.setItem("pinned", pinned ? "true" : "false");
    }, [pinned]);

    const menuBarRef = React.useRef<HTMLDivElement>(null);
    const menuDrawerRef = React.useRef<HTMLDivElement>(null);
    const [menuBarWidth, menuBarHeight] = useSize(menuBarRef);
    const menuDrawerWidth = useSize(menuDrawerRef)[0];
    const windowSize = useWindowSize();

    const menuContentSpacing = 50;
    const menuPadding = 32;

    React.useEffect(() => {
        setNavigationsItemsWithAssignedIds(
            makeNavigationItemsWithAssignedIds(props.navigationItems)
        );
        setMenuWidth(
            Math.max(
                250,
                Math.min(
                    getNavigationMaxWidth(props.navigationItems) + menuPadding,
                    windowSize.width / 4,
                    400
                )
            )
        );
    }, [props.navigationItems, windowSize.width]);

    React.useEffect(() => {
        const bodyMargins = { left: 16, top: 16, right: 16, bottom: 16 };

        if (!pinned) {
            if (props.menuBarPosition === "left") {
                bodyMargins.left = menuBarWidth + menuContentSpacing;
            } else if (props.menuBarPosition === "top") {
                bodyMargins.top = menuBarHeight + menuContentSpacing;
            } else if (props.menuBarPosition === "right") {
                bodyMargins.right = menuBarWidth + menuContentSpacing;
            } else if (props.menuBarPosition === "bottom") {
                bodyMargins.bottom = menuBarHeight + menuContentSpacing;
            }
        } else {
            if (props.menuDrawerPosition === "left") {
                bodyMargins.left += menuDrawerWidth;
            } else if (props.menuBarPosition === "right") {
                bodyMargins.right += menuDrawerWidth;
            }
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

    const handlePageChange = React.useCallback(
        (url: string) => {
            setOpen(false);
            setTimeout(() => {
                props.setProps && props.setProps({ url: url });
                window.history.pushState({}, "", url);
                setCurrentUrl(url);
            }, 350);
        },
        [setOpen]
    );

    return (
        <div className="Menu" id={props.id}>
            <Overlay visible={open && !pinned} onClick={() => setOpen(false)} />
            <MenuBar
                position={menuBarPosition as MenuBarPosition}
                menuButtonPosition={menuDrawerPosition as MenuDrawerPosition}
                visible={!pinned}
                onMenuOpen={() => setOpen(true)}
                ref={menuBarRef}
                homepage={"/"}
                showLogo={showLogo}
                onLogoClick={handlePageChange}
            />
            <MenuDrawer
                position={menuDrawerPosition as MenuDrawerPosition}
                open={open || pinned}
                pinned={pinned}
                ref={menuDrawerRef}
                maxWidth={menuWidth}
                currentUrl={currentUrl}
            >
                <TopMenu
                    pinned={pinned}
                    onPinnedChange={() => setPinned(!pinned)}
                />
                {showLogo && (
                    <Logo
                        onClick={handlePageChange}
                        homepage={"/"}
                        size="large"
                    />
                )}
                <MenuContent
                    content={navigationItemsWithAssignedIds}
                    groupsInitiallyCollapsed={props.initiallyCollapsed}
                    onPageChange={handlePageChange}
                />
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
     * Set to true if you want all groups in the menu to be initially collapsed.
     */
    initiallyCollapsed: PropTypes.bool,

    /**
     * Define the position the menu bar shall be displayed at.
     */
    menuBarPosition: PropTypes.oneOf(["left", "top", "right", "bottom"]),

    /**
     * Define the position the menu drawer shall be displayed at.
     */
    menuDrawerPosition: PropTypes.oneOf(["left", "right"]),

    /**
     * Set to true if a logo shall be shown, false if not.
     */
    showLogo: PropTypes.bool,

    /**
     * A list of navigation items to show in the menu.
     */
    navigationItems: PropTypes.any.isRequired,

    /**
     * Currently selected URL. Leave blank.
     */
    url: PropTypes.string,
};

Menu.defaultProps = {
    id: "some-id",
    setProps: () => {
        return;
    },
    initiallyPinned: false,
    showLogo: true,
    menuBarPosition: "left",
    menuDrawerPosition: "left",
    url: "",
};
