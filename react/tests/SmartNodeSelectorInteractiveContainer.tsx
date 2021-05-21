import React from 'react';
import { SmartNodeSelector } from '../src/lib';
import { PropType } from './SmartNodeSelector.test';

const data = [
    {
        "id": "1",
        "name": "Data1",
        "description": "Description",
    },
    {
        "id": "2",
        "name": "Data2",
        "description": "Description",
    }
];

export const SmartNodeSelectorInteractiveContainer: React.FC<{ setProps: (props: PropType) => void }> = (
    props: { setProps: (props: PropType) => void }
): JSX.Element => {
    const { setProps } = props;
    const [selectedTags, setSelectedTags] = React.useState([]);

    const handleButtonClick = () => {
        setSelectedTags(["Data1", "Data2"]);
    };

    return (
        <>
            <SmartNodeSelector
                id="SmartNodeSelector"
                key="SmartNodeSelector"
                delimiter=":"
                showSuggestions={false}
                setProps={setProps}
                label="Smart Node Selector"
                numSecondsUntilSuggestionsAreShown={0.5}
                data={data}
                selectedTags={selectedTags}
            />
            <button onClick={handleButtonClick} id="setValuesButton">Set values</button>
        </>
    )
};
