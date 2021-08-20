export type Page = {
    title: string;
    icon?: string;
    href: string;
};

export type Group = {
    type: "group";
    title: string;
    icon?: string;
    content: (Group | Page)[];
};

export type Section = {
    type: "section";
    title: string;
    icon?: string;
    content: (Group | Page)[];
};

export type Navigation = Section[] | Group[] | Page[] | (Group | Page)[];
