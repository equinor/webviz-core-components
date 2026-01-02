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
import { TagEditor, TagEditorKeyDownAction } from "./TagEditor/tagEditor";

export type TagProps = {
    id: string;
    tag: 
};

export function Tag(props: TagProps): React.ReactElement {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);
    const slotsContext = React.useContext(SmartNodeSelectorSlotsContext);

    const matches = useMatches(props.tag.id);

    const handleRemoveTagClick = React.useCallback(
        function handleRemoveTagClick() {
            
        },
        [props.tag.id]
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
            style={makeStyle(props.tag.isLast && segments.length === 1, matches.length > 0 || isFocused)}
        >
            <MatchesCounter matches={matches} />
            <TagEditor tag={props.tag} delimiter={dataContext.delimiter} focusedSegmentIndex={isFocused ? focusedAddress.segmentIndex : undefined} onChange={handleValueChange} onFocusedSegmentChange={handleFocusedSegmentChange} onKeyDown={handleKeyDown}/>
            {segments.length > 1 && (
                <button
                    data-smartnodeselector-remove-segment-button
                    onClick={handleRemoveTagClick}
                    aria-label="Remove Tag"
                    style={{ border: "none", background: "transparent", cursor: "pointer"}}
                >
                    ×
                </button>
            )}
        </TagComponent>
    );
}

function makeStyle(isLast: boolean, isValid: boolean): React.CSSProperties {
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
        border: isValid ? "1px solid #ccc" : "1px solid #f4bdbdff",
        borderRadius: "4px",
        backgroundColor: isValid ? "#f5f5f5" : "#f4bdbdff",
    };
}
