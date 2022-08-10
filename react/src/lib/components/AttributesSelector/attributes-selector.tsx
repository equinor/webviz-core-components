import React from "react";

import { AttributeSelector } from "./components";
import { SelectionObjects, Attribute } from "./types";

type ParentProps = {
    selectedObjects: string[];
};

export type AttributesSelectorProps = {
    id: string;
    selectionData: SelectionObjects[];
    setProps?: (props: ParentProps) => void;
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
    }, [props.selectionData]);

    const handleSelectedValuesChanged = (
        attributeName: string,
        values: string[]
    ) => {
        if (
            selectedAttributeValues.some(
                (el) => el.attributeName === attributeName
            )
        ) {
            setSelectedAttributeValues(
                selectedAttributeValues.map((el) =>
                    el.attributeName === attributeName
                        ? { attributeName: attributeName, values: values }
                        : el
                )
            );
        } else {
            setSelectedAttributeValues([
                ...selectedAttributeValues,
                { attributeName: attributeName, values: values },
            ]);
        }
    };

    React.useEffect(() => {
        if (!props.setProps) {
            return;
        }
        let selectedObjects: string[] = [];
        selectedAttributeValues.forEach((selectedAttribute, index) => {
            props.selectionData.forEach((object) => {
                const attributeName = Object.keys(object.attributes).find(
                    (el) => el === selectedAttribute.attributeName
                );
                let check = false;
                if (attributeName) {
                    if (
                        selectedAttribute.values.some((el) =>
                            object.attributes[attributeName].includes(el)
                        )
                    ) {
                        check = true;
                    }
                } else if (selectedAttribute.values.includes("Undefined")) {
                    check = true;
                }
                if (check && index === 0) {
                    selectedObjects.push(object.name);
                } else if (!check && selectedObjects.includes(object.name)) {
                    selectedObjects = selectedObjects.filter(
                        (el) => el !== object.name
                    );
                }
            });
        });
        props.setProps({ selectedObjects: selectedObjects });
    }, [selectedAttributeValues]);

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
