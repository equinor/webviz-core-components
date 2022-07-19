import React from "react";

import { AttributeSelector } from "./components";

import { Attribute } from "./types";

type ActionMap<
    M extends {
        [index: string]: {
            [key: string]: string;
        } | null;
    }
> = {
    [Key in keyof M]: M[Key] extends undefined
        ? {
              type: Key;
          }
        : {
              type: Key;
              payload: M[Key];
          };
};

export enum StoreActions {
    AddAttributeValues = "add_attribute_values",
}

export type AttributesSelectorProps = {
    id: string;
    attributes: Attribute[];
};

export const AttributesSelector: React.FC<AttributesSelectorProps> = (
    props
) => {
    return (
        <div className="WebvizAttributesSelector">
            {props.attributes.map((attribute, index) => (
                <AttributeSelector
                    id={`${props.id}-${attribute.name}`}
                    key={`AttributeSelector-${index}`}
                    attribute={attribute}
                />
            ))}
        </div>
    );
};
