import React from "react";
import PropTypes from "prop-types";

import { FilterInput } from "../FilterInput";
import { Section } from "../Section";
import { Group } from "../Group";
import { Page } from "../Page";
import { ScrollArea } from "../../../ScrollArea";

import {
    NavigationType,
    SectionType,
    GroupType,
    PageType,
    NavigationItemType,
} from "../../types/navigation";

import "./MenuContent.css";

type MenuContentProps = {
    content: NavigationType;
    groupsInitiallyCollapsed?: boolean;
    onPageChange: (url: string) => void;
};

const searchTitle = (title: string, query: string): boolean => {
    return title
        .toLowerCase()
        .replace(" ", "")
        .includes(query.toLowerCase().replace(" ", ""));
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
            searchTitle(filterItem.title, filter)
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
                id: filterItem.id,
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
        if (el.type === "page" && searchTitle(el.title, filter)) {
            (newNavigation as (GroupType | PageType)[]).push(el as PageType);
        } else if (el.type === "group") {
            let test = false;
            const newItem: GroupType = {
                type: el.type as "group",
                title: el.title,
                icon: el.icon,
                content: [],
                id: el.id,
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
                id: el.id,
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

const makeNavigation = (
    navigation: NavigationType,
    filtered: boolean,
    initiallyCollapsed: boolean,
    onPageChange: (url: string) => void
): JSX.Element => {
    const recursivelyMakeNavigation = (
        items: NavigationItemType[],
        iconAtParentLevel?: boolean,
        level = 1
    ): JSX.Element => {
        const atLeastOneIconUsed = items.some((el) => el.icon !== undefined);
        return (
            <>
                {items.map((item) => {
                    if (item.type === "section") {
                        return (
                            <Section
                                key={item.id}
                                title={item.title}
                                icon={item.icon}
                                applyIconIndentation={atLeastOneIconUsed}
                            >
                                {recursivelyMakeNavigation(
                                    (item as SectionType).content,
                                    atLeastOneIconUsed
                                )}
                            </Section>
                        );
                    } else if (item.type === "group") {
                        return (
                            <Group
                                id={item.id}
                                key={item.id}
                                level={level}
                                title={item.title}
                                icon={item.icon}
                                forceOpen={filtered}
                                applyIconIndentation={
                                    atLeastOneIconUsed ||
                                    iconAtParentLevel ||
                                    false
                                }
                                initiallyCollapsed={initiallyCollapsed}
                            >
                                {recursivelyMakeNavigation(
                                    (item as GroupType).content,
                                    atLeastOneIconUsed,
                                    level + 1
                                )}
                            </Group>
                        );
                    } else if (item.type === "page") {
                        return (
                            <Page
                                key={item.id}
                                level={level}
                                applyIconIndentation={
                                    atLeastOneIconUsed ||
                                    iconAtParentLevel ||
                                    false
                                }
                                {...(item as PageType)}
                                onClick={() =>
                                    onPageChange((item as PageType).href)
                                }
                            />
                        );
                    } else {
                        return null;
                    }
                })}
            </>
        );
    };
    return recursivelyMakeNavigation(navigation);
};

export const MenuContent: React.FC<MenuContentProps> = (props) => {
    const [filter, setFilter] = React.useState<string>("");
    const [content, setContent] = React.useState<NavigationType>(props.content);

    React.useEffect(() => {
        setContent(recursivelyFilterNavigation(props.content, filter));
    }, [filter, props.content]);

    return (
        <div className="Menu__ContentWrapper">
            <div className="Menu__FilterInputWrapper">
                <FilterInput filter={filter} onFilterChange={setFilter} />
            </div>
            <ScrollArea>
                {content.length === 0 ? (
                    <div className="Menu__NoResults">
                        No pages matching the query...
                    </div>
                ) : (
                    makeNavigation(
                        content,
                        filter !== "",
                        props.groupsInitiallyCollapsed || false,
                        props.onPageChange
                    )
                )}
            </ScrollArea>
        </div>
    );
};

MenuContent.propTypes = {
    content: PropTypes.any.isRequired,
    groupsInitiallyCollapsed: PropTypes.bool,
    onPageChange: PropTypes.func.isRequired,
};
