import React from "react";
import { makeInputValues } from "../utils/makeInputValues";
import { SmartNodeSelectorContext } from "../SmartNodeSelector";
import type { Tag as TagType } from "../state/type";
import { Input } from "./Input";
import { ActionType } from "../state/actions";

export type TagProps = {
    tag: TagType;
    index: number;
};

export function Tag(props: TagProps): React.ReactElement {
    const context = React.useContext(SmartNodeSelectorContext);

    const segments = makeInputValues(props.tag.value, context.delimiter);

    function handleInputChange(segmentIndex: number, newValue: string) {
        const newSegments = [...segments];
        newSegments[segmentIndex] = newValue;
        const newTagValue = newSegments.join(context.delimiter);
        context.dispatch({
            type: ActionType.UPDATE_TAG_VALUE,
            payload: {
                tagId: props.tag.id,
                newValue: newTagValue,
            },
        });
    }

    return (
        <>
            {segments.map((value, index) => {
                const isLastValue = index === segments.length - 1;
                let placeholder = context.placeholders.incompleteTag;
                if (isLastValue && props.tag.isLast) {
                    placeholder = context.placeholders.newTag;
                }
                return (
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
                );
            })}
        </>
    );
}
