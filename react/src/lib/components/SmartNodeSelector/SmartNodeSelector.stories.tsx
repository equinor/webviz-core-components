import React from 'react';

import { Meta, Story } from '@storybook/react';

import SmartNodeSelector from "./SmartNodeSelector";
import SmartNodeSelectorComponent, { SmartNodeSelectorPropsType } from './components/SmartNodeSelectorComponent';

export default {
    title: "Components/SmartNodeSelector",
    component: SmartNodeSelector
} as Meta;

const Template: Story<SmartNodeSelectorPropsType> = (args) => <SmartNodeSelectorComponent {...args} />;

export const OneDimensional = Template.bind({});
OneDimensional.args = {
    id: "SmartNodeSelector",
    delimiter: ":",
    maxNumSelectedNodes: 1,
    numMetaNodes: 0,
    label: "SmartNodeSelector",
    showSuggestions: true,
    numSecondsUntilSuggestionsAreShown: 1
};
