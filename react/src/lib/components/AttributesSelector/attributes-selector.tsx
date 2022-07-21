import React from "react";

import { AttributeSelector } from "./components";
import { Attribute } from "./types";

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
