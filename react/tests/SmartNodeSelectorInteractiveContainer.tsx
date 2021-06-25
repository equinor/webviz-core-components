import React from "react";
import { SmartNodeSelector } from "../src/lib";
import { PropType } from "./SmartNodeSelector.test";

const initialData = [
    {
        id: "1",
        name: "Data1",
        description: "Description",
    },
    {
        id: "2",
        name: "Data2",
        description: "Description",
    },
];

export const SmartNodeSelectorInteractiveContainer: React.FC<{
    setProps: (props: PropType) => void;
}> = (props: { setProps: (props: PropType) => void }): JSX.Element => {
    const { setProps } = props;
    const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
    const [data, setData] = React.useState(initialData);
    const [delimiter, setDelimiter] = React.useState(":");

    const handleChangeSelectedTagsButtonClick = () => {
        setSelectedTags(["Data1", "Data2"]);
    };

    const handleChangeDelimiterButtonClick = () => {
        setDelimiter(";");
    };

    const handleChangeDataButtonClick = () => {
        setData([
            {
                id: "1",
                name: "ChangedData1",
                description: "Description",
            },
            {
                id: "2",
                name: "ChangedData2",
                description: "Description",
            },
        ]);
    };

    return (
        <>
            <SmartNodeSelector
                id="SmartNodeSelector"
                key="SmartNodeSelector"
                delimiter={delimiter}
                showSuggestions={false}
                setProps={setProps}
                label="Smart Node Selector"
                numSecondsUntilSuggestionsAreShown={0.5}
                data={data}
                selectedTags={selectedTags}
            />
            <button
                onClick={handleChangeSelectedTagsButtonClick}
                id="setValuesButton"
            >
                Set values
            </button>
            <button onClick={handleChangeDataButtonClick} id="setDataButton">
                Set data
            </button>
            <button
                onClick={handleChangeDelimiterButtonClick}
                id="setDelimiterButton"
            >
                Set delimiter
            </button>
        </>
    );
};
