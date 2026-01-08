import React from "react";
import {
    SmartNodeSelectorDataContext,
    SmartNodeSelectorSlotsContext,
} from "../SmartNodeSelector";
import { useMatches } from "../hooks/useMatches";
import { MatchesCounter } from "./MatchesCounter";
import { Topic } from "../core/StateManager/StateManager";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { QuerySegment } from "./QuerySegment";
import { TokenRenderer } from "./TokenRenderer";
import type { QueryItem } from "../core/StateManager/types";

export type QueryChipProps = {
    queryItem: QueryItem;
    isLast: boolean;
};

export function QueryChip(props: QueryChipProps): React.ReactElement {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);
    const slotsContext = React.useContext(SmartNodeSelectorSlotsContext);

    const matches = useMatches(props.queryItem);

    const caretPositions = useSubscribeToTopic(
        dataContext.stateManager,
        Topic.CARET_POSITIONS
    );

    const handleRemoveTagClick = React.useCallback(
        function handleRemoveTagClick() {
            dataContext.stateManager.removeQueryItemById(props.queryItem.id);
        },
        [props.queryItem.id]
    );

    const QueryChipComponent = slotsContext.slots.queryChip;
    const queryChipProps = slotsContext.slotProps.queryChip ?? {};

    const isValid = matches.length > 0;
    const isEditing =
        caretPositions.find((pos) => pos.queryId === props.queryItem.id) !==
        undefined;
    const hasMoreThanOneSegment = props.queryItem.query.includes(
        dataContext.delimiter
    );

    const content = React.useMemo(
        function makeContent() {
            const nodes: React.ReactNode[] = [];
            let segmentIndex = 0;
            let tokenIndex = 0;

            for (const segment of props.queryItem.parsedQuery.segments) {
                for (let i = tokenIndex; i < segment.tokenStartIndex; i++) {
                    const token = props.queryItem.parsedQuery.tokens[i];
                    // Token not part of any segment, must be a delimiter
                    nodes.push(
                        <TokenRenderer
                            key={nodes.length}
                            token={token}
                            queryId={props.queryItem.id}
                        />
                    );
                }

                const segmentTokens = props.queryItem.parsedQuery.tokens.slice(
                    segment.tokenStartIndex,
                    segment.tokenEndIndex
                );

                nodes.push(
                    <QuerySegment
                        key={nodes.length}
                        queryId={props.queryItem.id}
                        segmentIndex={segmentIndex}
                        tokens={segmentTokens}
                    />
                );

                segmentIndex++;
                tokenIndex = segment.tokenEndIndex;
            }

            for (
                let i = tokenIndex;
                i < props.queryItem.parsedQuery.tokens.length;
                i++
            ) {
                const token = props.queryItem.parsedQuery.tokens[i];
                // Token not part of any segment, must be a delimiter
                nodes.push(
                    <TokenRenderer
                        key={nodes.length}
                        token={token}
                        queryId={props.queryItem.id}
                    />
                );
            }

            return nodes;
        },
        [props.queryItem.parsedQuery]
    );

    return (
        <QueryChipComponent
            {...queryChipProps}
            data-querychip-id={props.queryItem.id}
            tabIndex={0}
            style={makeStyle(
                props.isLast && !hasMoreThanOneSegment,
                isValid || isEditing
            )}
        >
            <MatchesCounter matches={matches} />
            <div
                data-query-chip-content
                style={{
                    display: "flex",
                    alignItems: "center",
                    alignSelf: "stretch",
                    flex: 1,
                    whiteSpace: "pre",
                    marginRight: 4,
                }}
            >
                {content}
                <Placeholder
                    isVisible={props.queryItem.query === ""}
                    isLast={props.isLast}
                />
            </div>
            <button onClick={handleRemoveTagClick} aria-label="Remove tag">
                &#x2715;
            </button>
        </QueryChipComponent>
    );
}

type PlaceholderProps = {
    isVisible?: boolean;
    isLast?: boolean;
};

function Placeholder(props: PlaceholderProps) {
    const context = React.useContext(SmartNodeSelectorDataContext);

    if (!props.isVisible) {
        return null;
    }

    const placeholderText = props.isLast
        ? context.placeholders.newTag
        : context.placeholders.incompleteTag;

    return (
        <div
            style={{
                color: "black",
                opacity: 0.3,
                marginLeft: 2,
            }}
        >
            {placeholderText}
        </div>
    );
}

function makeStyle(isLast: boolean, isValid: boolean): React.CSSProperties {
    if (isLast) {
        return {
            display: "flex",
            alignItems: "center",
            gap: "1px",
            flexGrow: 1,
            minHeight: 20,
        };
    }
    return {
        display: "flex",
        alignItems: "center",
        gap: "1px",
        border: isValid ? "1px solid #ccc" : "1px solid #f4bdbdff",
        borderRadius: "4px",
        backgroundColor: isValid ? "#f5f5f5" : "#f4bdbdff",
        padding: "2px 4px",
    };
}
