import React from "react";
import PropTypes from "prop-types";

import { SmartNodeSelector } from "../src/lib";
import { TreeDataNode } from "../src/lib/components/SmartNodeSelector";
import { PropType } from "./SmartNodeSelector.test";

export const SmartNodeSelectorInteractiveContainer: React.FC<{
    setProps: (props: PropType) => void;
    data: TreeDataNode[];
}> = (props): JSX.Element => {
    const { setProps } = props;
    const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
    const [data, setData] = React.useState(props.data);
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

SmartNodeSelectorInteractiveContainer.propTypes = {
    setProps: PropTypes.func.isRequired,
    data: PropTypes.array.isRequired,
};
