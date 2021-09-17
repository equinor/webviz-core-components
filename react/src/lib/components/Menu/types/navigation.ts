export interface PropertyNavigationItemType {
    type: string;
    title: string;
    icon?: string;
}

export interface PropertyPageType extends PropertyNavigationItemType {
    type: "page";
    title: string;
    icon?: string;
    href: string;
}

export interface PropertyGroupType extends PropertyNavigationItemType {
    type: "group";
    title: string;
    icon?: string;
    content: (PropertyGroupType | PropertyPageType)[];
}

export interface PropertySectionType extends PropertyNavigationItemType {
    type: "section";
    title: string;
    icon?: string;
    href?: undefined;
    content: (PropertyGroupType | PropertyPageType)[];
}

export type PropertyNavigationType =
    | PropertySectionType[]
    | PropertyGroupType[]
    | PropertyPageType[]
    | (PropertyGroupType | PropertyPageType)[];

export interface NavigationItemType extends PropertyNavigationItemType {
    id: string;
}

export interface PageType extends PropertyPageType {
    id: string;
}

export interface GroupType extends PropertyGroupType {
    id: string;
    content: (GroupType | PageType)[];
}

export interface SectionType extends PropertySectionType {
    id: string;
    content: (GroupType | PageType)[];
}

export type NavigationType =
    | SectionType[]
    | GroupType[]
    | PageType[]
    | (GroupType | PageType)[];
