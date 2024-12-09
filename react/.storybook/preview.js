import { fn } from "@storybook/test";

export const parameters = {
    // Remove the argTypesRegex
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
};

// Add a default action handler
export const args = {
    // This will catch any events starting with 'on'
    ...Object.fromEntries(
        Object.keys(parameters.controls.matchers)
            .filter((key) => key.startsWith("on"))
            .map((key) => [key, fn()])
    ),
};
export const tags = ["autodocs"];
