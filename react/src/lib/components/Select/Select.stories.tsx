import React from "react";

import { ComponentStory, ComponentMeta } from "@storybook/react";

import { Select } from "./Select";

export default {
    title: "Components/Select",
    component: Select,
    argTypes: {
        size: {
            control: "number",
        },
        multi: {
            control: "boolean",
        },
    },
} as ComponentMeta<typeof Select>;

const Template: ComponentStory<typeof Select> = (args) => {
    const { debounce_time_ms, ...other } = args;

    const [selected, setSelected] = React.useState<
        string | number | (string | number)[]
    >([]);

    return (
        <>
            <Select
                {...other}
                setProps={(prop) => setSelected(prop.value)}
                debounce_time_ms={debounce_time_ms}
            />
            <div>{`Debounce time: ${debounce_time_ms?.toString()} ms`}</div>
            <div>{`Selected values: ${selected.toString()}`}</div>
        </>
    );
};

export const Basic = Template.bind({});
Basic.args = {
    id: Select.defaultProps?.id || "select-component",
    size: 6,
    options: [
        { label: 0, value: 0 },
        { label: 1, value: 1 },
        { label: 2, value: 2 },
        { label: 3, value: 3 },
        { label: 4, value: 4 },
    ],
    value: Select.defaultProps?.value || [],
    debounce_time_ms: Select.defaultProps?.debounce_time_ms || 1000,
    multi: Select.defaultProps?.multi || true,
    className: Select.defaultProps?.className || "",
    style: Select.defaultProps?.style || {},
    parent_className: Select.defaultProps?.parent_className || "",
    parent_style: Select.defaultProps?.parent_style || {},
    persistence: Select.defaultProps?.persistence || false,
    persisted_props: Select.defaultProps?.persisted_props || ["value"],
    persistence_type: Select.defaultProps?.persistence_type || "local",
    setProps: () => {
        return;
    },
};
