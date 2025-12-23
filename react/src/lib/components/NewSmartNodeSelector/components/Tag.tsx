import React from "react";
import { makeInputValues } from "../utils/makeInputValues";
import {
    SmartNodeSelectorDataContext,
    SmartNodeSelectorSlotsContext,
} from "../SmartNodeSelector";
import type { Tag as TagType } from "../state/type";
import { ActionType } from "../state/actions";
import { useMatches } from "../hooks/useMatches";
import { MatchesCounter } from "./MatchesCounter";
import { TagEditor } from "./TagEditor/tagEditor";

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

    const handleValueChange = React.useCallback(
        function handleValueChange(newValue: string) {
            const newTagValue = newValue;
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

    const handleFocusedSegmentChange = React.useCallback(
        function handleFocusedSegmentChange(segmentIndex: number) {
            dataContext.dispatch({
                type: ActionType.CHANGE_FOCUSED_ADDRESS,
                payload: {
                    tagId: props.tag.id,
                    segmentIndex,
                },
            });
        },
        [dataContext.dispatch, props.tag.id]
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

    const focusedAddress = dataContext.state.focusedAddress;
    const isFocused =
        focusedAddress !== null && focusedAddress.tagId === props.tag.id;

    return (
        <TagComponent
            {...tagProps}
            data-smartnodeselector-tag
            style={makeStyle(props.tag.isLast && segments.length === 1)}
        >
            <MatchesCounter matches={matches} />
            <TagEditor tag={props.tag} delimiter={dataContext.delimiter} focusedSegmentIndex={isFocused ? focusedAddress.segmentIndex : undefined} onChange={handleValueChange} onFocusedSegmentChange={handleFocusedSegmentChange} />
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
