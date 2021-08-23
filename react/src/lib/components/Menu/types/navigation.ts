export interface NavigationItemType {
    type: string;
    title: string;
    icon?: string;
}

export interface PageType extends NavigationItemType {
    type: "page";
    title: string;
    icon?: string;
    href: string;
}

export interface GroupType extends NavigationItemType {
    type: "group";
    title: string;
    icon?: string;
    content: (GroupType | PageType)[];
}

export interface SectionType extends NavigationItemType {
    type: "section";
    title: string;
    icon?: string;
    href?: undefined;
    content: (GroupType | PageType)[];
}

export type NavigationType =
    | SectionType[]
    | GroupType[]
    | PageType[]
    | (GroupType | PageType)[];
