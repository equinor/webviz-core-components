import React from "react";

import { AttributeSelector } from "./components";
import { SelectionObjects, Attribute } from "./types";

export type AttributesSelectorProps = {
    id: string;
    selectionData: SelectionObjects[];
};

export const AttributesSelector: React.FC<AttributesSelectorProps> = (
    props
) => {
    const [attributes, setAttributes] = React.useState<Attribute[]>([]);
    const [selectedAttributeValues, setSelectedAttributeValues] =
        React.useState<{ attributeName: string; values: string[] }[]>([]);

    React.useEffect(() => {
        const attr: {
            name: string;
            values: Set<string>;
        }[] = [];
        props.selectionData.forEach((object) => {
            Object.keys(object.attributes).forEach((attributeName) => {
                if (!attr.some((el) => el.name === attributeName)) {
                    attr.push({
                        name: attributeName,
                        values: new Set<string>(),
                    });
                }

                const attribute = attr.find((el) => el.name === attributeName);
                if (!attribute) {
                    return;
                }

                if (Array.isArray(object.attributes[attributeName])) {
                    (object.attributes[attributeName] as string[]).forEach(
                        (el) => attribute.values.add(el)
                    );
                } else {
                    attribute.values.add(
                        object.attributes[attributeName] as string
                    );
                }
            });
        });

        attr.forEach((attrEl) => {
            props.selectionData.every((object) => {
                if (!Object.keys(object.attributes).includes(attrEl.name)) {
                    attrEl.values.add("Undefined");
                    return false;
                }
                return true;
            });
        });

        setAttributes(
            attr.map((el) => ({ name: el.name, values: Array.from(el.values) }))
        );
    }, [props.selectionData, setAttributes]);

    const handleSelectedValuesChanged = (
        attributeName: string,
        values: string[]
    ) => {
        setSelectedAttributeValues(
            selectedAttributeValues.map((el) =>
                el.attributeName === attributeName
                    ? { attributeName: attributeName, values: values }
                    : el
            )
        );
    };

    return (
        <div className="WebvizAttributesSelector">
            {attributes.map((attribute, index) => (
                <AttributeSelector
                    id={`${props.id}-${attribute.name}`}
                    key={`AttributeSelector-${index}`}
                    attribute={attribute}
                    onValuesChange={(values: string[]) =>
                        handleSelectedValuesChanged(attribute.name, values)
                    }
                />
            ))}
        </div>
    );
};
