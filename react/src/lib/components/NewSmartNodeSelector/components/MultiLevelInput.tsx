import React from "react";
import { Input } from "./Input";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";

export type MultiLevelInputProps = {
    initialValue: string[];
    isLast: boolean;
};

export function MultiLevelInput(
    props: MultiLevelInputProps
): React.ReactElement {
    const [values, setValues] = React.useState<string[]>(props.initialValue);

    const context = React.useContext(SmartNodeSelectorDataContext);

    function handleChange(index: number, newValue: string) {
        const newValues = [...values];
        newValues[index] = newValue;
        setValues(newValues);
    }

    return (
        <>
            {values.map((value, index) => {
                const isLastValue = index === values.length - 1;
                let placeholder = context.placeholders.incompleteTag;
                if (isLastValue && props.isLast) {
                    placeholder = context.placeholders.newTag;
                }
                return (
                    <Input
                        key={index}
                        value={value}
                        onChange={(newValue) => {
                            handleChange(index, newValue);
                        }}
                        placeholder={placeholder}
                    />
                );
            })}
        </>
    );
}
