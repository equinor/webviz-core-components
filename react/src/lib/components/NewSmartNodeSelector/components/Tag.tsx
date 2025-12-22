import React from "react";
import { makeInputValues } from "../utils/makeInputValues";
import { SmartNodeSelectorDataContext, SmartNodeSelectorSlotsContext } from "../SmartNodeSelector";
import type { Tag as TagType } from "../state/type";
import { Input } from "./Input";
import { ActionType } from "../state/actions";

export type TagProps = {
    tag: TagType;
    index: number;
};

export function Tag(props: TagProps): React.ReactElement {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);
    const slotsContext = React.useContext(
        SmartNodeSelectorSlotsContext
    );

    const segments = makeInputValues(props.tag.value, dataContext.delimiter);

    function handleInputChange(segmentIndex: number, newValue: string) {
        const newSegments = [...segments];
        newSegments[segmentIndex] = newValue;
        const newTagValue = newSegments.join(dataContext.delimiter);
        dataContext.dispatch({
            type: ActionType.UPDATE_TAG_VALUE,
            payload: {
                tagId: props.tag.id,
                newValue: newTagValue,
            },
        });
    }

    const TagComponent = slotsContext.slots.tagChip;
    const tagProps = slotsContext.slotProps.tagChip || {};

    return (
        <TagComponent {...tagProps} data-smartnodeselector-tag style={makeStyle(props.tag.isLast && segments.length === 1)}>
            {segments.map((value, index) => {
                const isLastValue = index === segments.length - 1;
                let placeholder = dataContext.placeholders.incompleteTag;
                if (isLastValue && props.tag.isLast) {
                    placeholder = dataContext.placeholders.newTag;
                }
                return (<>
                    <Input
                        key={index}
                        tagId={props.tag.id}
                        segmentIndex={index}
                        value={value}
                        onChange={(newValue) => {
                            handleInputChange(index, newValue);
                        }}
                        placeholder={placeholder}
                    />
                    {!isLastValue && (<span>{dataContext.delimiter}</span>)}
                    </>
                );
            })}
        </TagComponent>
    );
}

function makeStyle(isLast: boolean): React.CSSProperties {
    if (isLast) {
        return {
            display: "flex",
            alignItems: "center",
            gap: "1px",
            padding: "6px 10px",
        }
    }
    return {
        display: "flex",
        alignItems: "center",
        gap: "1px",
        padding: "4px 8px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        backgroundColor: "#f5f5f5",
    };
}