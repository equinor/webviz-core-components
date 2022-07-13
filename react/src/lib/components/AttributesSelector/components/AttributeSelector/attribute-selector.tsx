import React from "react";
import { Attribute } from "../../types";

import { CollapseExpandButton } from "./components";
import "./attribute-selector.css";

export type AttributeSelectorProps = {
    id: string;
    attribute: Attribute;
};

export const AttributeSelector: React.FC<AttributeSelectorProps> = (props) => {
    return (
        <div className="WebvizAttributeSelector">
            <div className="WebvizAttributeSelector__Header">
                <label htmlFor={`WebvizAttributeSelector_${props.id}`}>
                    {props.attribute.name}
                </label>
                <CollapseExpandButton expanded={false} />
            </div>
        </div>
    );
};
