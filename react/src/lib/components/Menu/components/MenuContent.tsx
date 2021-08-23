import React from "react";
import PropTypes from "prop-types";

import { FilterInput } from "./FilterInput";
import { Section } from "./Section";
import { Group } from "./Group";

import {
    NavigationType,
    SectionType,
    GroupType,
    PageType,
    NavigationItemType,
} from "../types/navigation";
import { Page } from "./Page";

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
                        <Section title={item.title} icon={item.icon}>
                            {recursivelyMakeNavigation(
                                (item as SectionType).content
                            )}
                        </Section>
                    );
                } else if (item.type === "group") {
                    return (
                        <Group title={item.title} icon={item.icon}>
                            {recursivelyMakeNavigation(
                                (item as GroupType).content
                            )}
                        </Group>
                    );
                } else if (item.type === "page") {
                    return <Page {...(item as PageType)} />;
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

    React.useEffect(() => {
        setContent(recursivelyFilterNavigation(props.content, filter));
    }, [filter, props.content]);

    return (
        <div className="ContentWrapper">
            <FilterInput filter={filter} onFilterChange={setFilter} />
            <div className="Content">{makeNavigation(content)}</div>
        </div>
    );
};

MenuContent.propTypes = {
    content: PropTypes.any,
};
