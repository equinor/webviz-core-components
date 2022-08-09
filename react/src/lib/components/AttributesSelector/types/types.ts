export type Attributes = {
    [key: string]: string | string[];
};

export type SelectionObjects = {
    name: string;
    attributes: Attributes;
};

export type Attribute = {
    name: string;
    values: string[];
};
