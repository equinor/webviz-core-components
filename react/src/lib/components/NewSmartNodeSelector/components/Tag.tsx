import React from "react";
import { makeInputValues } from "../utils/makeInputValues";
import {
    SmartNodeSelectorDataContext,
    SmartNodeSelectorSlotsContext,
} from "../SmartNodeSelector";
import type { Tag as TagType } from "../state/type";
import { Input } from "./Input";
import { ActionType } from "../state/actions";
import { useMatches } from "../hooks/useMatches";
import { MatchesCounter } from "./MatchesCounter";

export type TagProps = {
    tag: TagType;
    index: number;
};

export function Tag(props: TagProps): React.ReactElement {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);
    const slotsContext = React.useContext(SmartNodeSelectorSlotsContext);

    const matches = useMatches(props.tag.id);

    const segments = React.useMemo(
        () => makeInputValues(props.tag.value, dataContext.delimiter),
        [props.tag.value, dataContext.delimiter]
    );

    const handleInputChange = React.useCallback(
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
        },
        [dataContext.dispatch, dataContext.delimiter, props.tag.id, segments]
    );

    const handleRemoveTagClick = React.useCallback(
        function handleRemoveTagClick() {
            dataContext.dispatch({
                type: ActionType.REMOVE_TAG,
                payload: {
                    tagId: props.tag.id,
                },
            });
        },
        [dataContext.dispatch, props.tag.id]
    );

    const TagComponent = slotsContext.slots.tagChip;
    const tagProps = slotsContext.slotProps.tagChip ?? {};

    return (
        <TagComponent
            {...tagProps}
            data-smartnodeselector-tag
            style={makeStyle(props.tag.isLast && segments.length === 1)}
        >
            <MatchesCounter matches={matches} />
            {segments.map((value, index) => {
                const isFirstSegment = index === 0;
                let placeholder = dataContext.placeholders.incompleteTag;
                if (isFirstSegment && props.tag.isLast) {
                    placeholder = dataContext.placeholders.newTag;
                }
                return (
                    <div key={index} style={{ padding: "4px 2px" }}>
                        {!isFirstSegment && (
                            <span>{dataContext.delimiter}</span>
                        )}
                        <Input
                            tagId={props.tag.id}
                            segmentIndex={index}
                            value={value}
                            onChange={(newValue) => {
                                handleInputChange(index, newValue);
                            }}
                            placeholder={placeholder}
                        />
                    </div>
                );
            })}
            {segments.length > 1 && (
                <button
                    data-smartnodeselector-remove-segment-button
                    onClick={handleRemoveTagClick}
                    aria-label="Remove Tag"
                >
                    ×
                </button>
            )}
        </TagComponent>
    );
}

function makeStyle(isLast: boolean): React.CSSProperties {
    if (isLast) {
        return {
            display: "flex",
            alignItems: "center",
            gap: "1px",
            flexGrow: 1,
        };
    }
    return {
        display: "flex",
        alignItems: "center",
        gap: "1px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        backgroundColor: "#f5f5f5",
    };
}
