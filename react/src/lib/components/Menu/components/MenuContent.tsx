import React from "react";
import PropTypes from "prop-types";
import useSize from "@react-hook/size";

import { FilterInput } from "./FilterInput";
import { Section } from "./Section";
import { Group } from "./Group";
import { Page } from "./Page";
import { usePan } from "../hooks/usePan";

import {
    NavigationType,
    SectionType,
    GroupType,
    PageType,
    NavigationItemType,
} from "../types/navigation";

import "./MenuContent.css";
import { Size } from "../types/size";

type MenuContentProps = {
    content: NavigationType;
};

const recursivelyFilterNavigation = (
    navigation: NavigationType,
    filter: string
): NavigationType => {
    const newNavigation: NavigationType = [];

    const makeFilteredNavigation = (
        filterItem: NavigationItemType,
        parentItem: GroupType | SectionType
    ): boolean => {
        if (
            filterItem.type === "page" &&
            filterItem.title.toLowerCase().includes(filter.toLowerCase())
        ) {
            parentItem.content.push(filterItem as PageType);
            return true;
        } else {
            let test = false;
            const newItem: GroupType = {
                type: filterItem.type as "group",
                title: filterItem.title,
                icon: filterItem.icon,
                content: [],
                uuid: filterItem.uuid,
            };
            if ((filterItem as GroupType).content) {
                (filterItem as GroupType).content.forEach((el) => {
                    test = makeFilteredNavigation(el, newItem) || test;
                });
            }
            if (test) {
                parentItem.content.push(newItem);
                return true;
            }
        }
        return false;
    };

    navigation.forEach((el: NavigationItemType) => {
        if (
            el.type === "page" &&
            el.title.toLowerCase().includes(filter.toLowerCase())
        ) {
            (newNavigation as (GroupType | PageType)[]).push(el as PageType);
        } else if (el.type === "group") {
            let test = false;
            const newItem: GroupType = {
                type: el.type as "group",
                title: el.title,
                icon: el.icon,
                content: [],
                uuid: el.uuid,
            };
            (el as GroupType).content.forEach((el) => {
                test = makeFilteredNavigation(el, newItem) || test;
            });
            if (test) {
                (newNavigation as (GroupType | PageType)[]).push(newItem);
            }
        } else if (el.type === "section") {
            let test = false;
            const newItem: SectionType = {
                type: el.type as "section",
                title: el.title,
                icon: el.icon,
                content: [],
                uuid: el.uuid,
            };
            if ((el as SectionType).content) {
                (el as SectionType).content.forEach(
                    (el: NavigationItemType) => {
                        test = makeFilteredNavigation(el, newItem) || test;
                    }
                );
            }
            if (test) {
                (newNavigation as SectionType[]).push(newItem);
            }
        }
    });
    return newNavigation;
};

const makeNavigation = (navigation: NavigationType): JSX.Element => {
    const recursivelyMakeNavigation = (
        items: NavigationItemType[]
    ): JSX.Element => (
        <>
            {items.map((item) => {
                if (item.type === "section") {
                    return (
                        <Section
                            key={item.uuid}
                            title={item.title}
                            icon={item.icon}
                        >
                            {recursivelyMakeNavigation(
                                (item as SectionType).content
                            )}
                        </Section>
                    );
                } else if (item.type === "group") {
                    return (
                        <Group
                            key={item.uuid}
                            title={item.title}
                            icon={item.icon}
                        >
                            {recursivelyMakeNavigation(
                                (item as GroupType).content
                            )}
                        </Group>
                    );
                } else if (item.type === "page") {
                    return <Page key={item.uuid} {...(item as PageType)} />;
                } else {
                    return null;
                }
            })}
        </>
    );
    return recursivelyMakeNavigation(navigation);
};

export const MenuContent: React.FC<MenuContentProps> = (props) => {
    const [filter, setFilter] = React.useState<string>("");
    const [content, setContent] = React.useState<NavigationType>(props.content);
    const [scrollbarOpacity, setScrollbarOpacity] = React.useState<number>(0);
    const [scrollPosition, setScrollPosition] = React.useState<Size>({
        width: 0,
        height: 0,
    });
    const [scrollbarSelected, setScrollbarSelected] = React.useState<boolean>(
        false
    );
    const [scrollAreaHovered, setScrollAreaHovered] = React.useState<boolean>(
        false
    );

    const contentRef = React.useRef<HTMLDivElement>(null);
    const [contentWidth, contentHeight] = useSize(contentRef, {
        initialHeight: 0,
        initialWidth: 0,
    });
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const [scrollAreaWidth, scrollAreaHeight] = useSize(scrollAreaRef, {
        initialHeight: 0,
        initialWidth: 0,
    });
    const scrollbarRef = React.useRef<HTMLDivElement>(null);
    const offset = usePan(scrollbarRef);

    React.useEffect(() => {
        setContent(recursivelyFilterNavigation(props.content, filter));
    }, [filter, props.content]);

    React.useEffect(() => {
        setScrollPosition({
            height: Math.max(
                Math.min((offset.y / scrollAreaHeight) * contentHeight, 0),
                contentHeight > scrollAreaHeight
                    ? -(contentHeight - scrollAreaHeight)
                    : 0
            ),
            width: scrollPosition.width + offset.x,
        });
    }, [offset]);

    const fadeScrollbarIn = React.useCallback(
        (opacity: number) => {
            if (contentHeight > scrollAreaHeight) {
                const interval = setInterval(() => {
                    if (opacity >= 0.75) {
                        setScrollbarOpacity(0.75);
                        clearInterval(interval);
                        return;
                    }
                    opacity += 0.05;
                    setScrollbarOpacity(opacity);
                }, 10);
            }
        },
        [setScrollbarOpacity, contentHeight, scrollAreaHeight]
    );

    const fadeScrollbarOut = React.useCallback(
        (opacity: number) => {
            const interval = setInterval(() => {
                if (opacity <= 0) {
                    setScrollbarOpacity(0);
                    clearInterval(interval);
                    return;
                }
                opacity -= 0.05;
                setScrollbarOpacity(opacity);
            }, 10);
        },
        [setScrollbarOpacity]
    );

    const scroll = (e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setScrollPosition({
            height: Math.max(
                Math.min(scrollPosition.height - e.deltaY, 0),
                contentHeight > scrollAreaHeight
                    ? -(contentHeight - scrollAreaHeight)
                    : 0
            ),
            width: scrollPosition.width + e.deltaX,
        });
    };

    React.useEffect(() => {
        const unselectScrollbar = () => {
            if (scrollbarSelected) {
                setScrollbarSelected(false);
                if (!scrollAreaHovered) {
                    fadeScrollbarOut(0.75);
                }
            }
        };
        document.addEventListener("mouseup", unselectScrollbar, true);
        return () =>
            document.removeEventListener("mouseup", unselectScrollbar, true);
    }, [scrollAreaHovered, scrollbarSelected, setScrollbarSelected]);

    React.useEffect(() => {
        if (
            contentHeight > scrollAreaHeight &&
            (scrollAreaHovered || scrollbarSelected)
        ) {
            fadeScrollbarIn(scrollbarOpacity);
        } else {
            fadeScrollbarOut(scrollbarOpacity);
        }
    }, [scrollAreaHeight, contentHeight, scrollAreaHovered, scrollbarSelected]);

    return (
        <div className="ContentWrapper">
            <div className="FilterInputWrapper">
                <FilterInput filter={filter} onFilterChange={setFilter} />
            </div>
            <div
                className="ScrollArea"
                ref={scrollAreaRef}
                onMouseEnter={() => {
                    if (!scrollbarSelected) {
                        fadeScrollbarIn(scrollbarOpacity);
                    }
                    setScrollAreaHovered(true);
                }}
                onMouseLeave={() => {
                    if (!scrollbarSelected) {
                        fadeScrollbarOut(scrollbarOpacity);
                    }
                    //setScrollAreaHovered(false);
                }}
                onWheel={(e: React.WheelEvent) => scroll(e)}
            >
                <div
                    ref={scrollbarRef}
                    className="VerticalScrollBar"
                    style={{
                        display: scrollbarOpacity > 0 ? "block" : "none",
                        opacity: scrollbarOpacity,
                        height: `${
                            scrollAreaHeight *
                            scrollAreaHeight *
                            (1 / contentHeight)
                        }px`,
                        top: `${
                            Math.abs(contentHeight) > 0
                                ? (-scrollPosition.height / contentHeight) *
                                  scrollAreaHeight
                                : 0
                        }px`,
                    }}
                    onMouseDown={() => setScrollbarSelected(true)}
                ></div>
                <div
                    className="Content"
                    ref={contentRef}
                    style={{ top: scrollPosition.height }}
                >
                    {makeNavigation(content)}
                </div>
            </div>
        </div>
    );
};

MenuContent.propTypes = {
    content: PropTypes.any,
};
