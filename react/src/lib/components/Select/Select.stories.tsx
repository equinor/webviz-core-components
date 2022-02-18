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

const Template: ComponentStory<typeof Select> = (args) => <Select {...args} />;

export const Basic = Template.bind({});
Basic.args = {
    id: Select.defaultProps?.id || "select-component",
    size: Select.defaultProps?.size || 4,
    options: Select.defaultProps?.options || [],
    value: Select.defaultProps?.value || [],
    multi: Select.defaultProps?.multi || true,
    className: Select.defaultProps?.className || "",
    style: Select.defaultProps?.style || {},
    parent_className: Select.defaultProps?.parent_className || "",
    parent_style: Select.defaultProps?.parent_style || {},
    persistence: Select.defaultProps?.persistence || false,
    persisted_props: Select.defaultProps?.persisted_props || ["value"],
    persistence_type: Select.defaultProps?.persistence_type || "local",
};
