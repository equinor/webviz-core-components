import React from "react";
import {
    SmartNodeSelectorDataContext,
    SmartNodeSelectorSlotsContext,
} from "../SmartNodeSelector";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { Topic } from "../core/StateManager/StateManager";
import type { QueryItem } from "../core/StateManager/types";
import { useLeafNodeMatches } from "../hooks/useLeafNodeMatches";
import { MatchesCounter } from "./MatchesCounter";
import { QuerySegment } from "./QuerySegment";
import { TokenRenderer } from "./TokenRenderer";

export type QueryChipProps = {
    index: number;
    queryItem: QueryItem;
    isLast: boolean;
};

export function QueryChip(props: QueryChipProps): React.ReactElement {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);
    const slotsContext = React.useContext(SmartNodeSelectorSlotsContext);

    const matchedLeafNodes = useLeafNodeMatches(props.queryItem);

    const textSelections = useSubscribeToTopic(
        dataContext.stateManager,
        Topic.QUERY_TEXT_SELECTIONS
    );

    const querySelection = useSubscribeToTopic(
        dataContext.stateManager,
        Topic.QUERY_SELECTION
    );

    const isSelected = React.useMemo(() => {
        if (!querySelection) {
            return false;
        }

        const range = [
            Math.min(querySelection.anchorIndex, querySelection.focusIndex),
            Math.max(querySelection.anchorIndex, querySelection.focusIndex),
        ];

        return props.index >= range[0] && props.index <= range[1];
    }, [querySelection, props.index]);

    const handleRemoveTagClick = React.useCallback(
        function handleRemoveTagClick() {
            dataContext.stateManager.removeQueryItemById(props.queryItem.id);
        },
        [props.queryItem.id]
    );

    const QueryChipComponent = slotsContext.slots.queryChip;
    const queryChipProps = slotsContext.slotProps.queryChip ?? {};

    const isValid = matchedLeafNodes.length > 0;
    const isEditing =
        textSelections.find((pos) => pos.queryId === props.queryItem.id) !==
        undefined;
    const hasMoreThanOneSegment = props.queryItem.query.includes(
        dataContext.delimiter
    );

    const content = React.useMemo(
        function makeContent() {
            const parsedQuery = dataContext.stateManager.getParsedQuery(
                props.queryItem.query
            );
            const nodes: React.ReactNode[] = [];
            let segmentIndex = 0;
            let tokenIndex = 0;

            if (!parsedQuery) {
                // Fallback: render entire query as a single token
                return null;
            }

            const diagnostics = parsedQuery.diagnostics;

            for (const segment of parsedQuery?.segments ?? []) {
                for (let i = tokenIndex; i < segment.tokenStartIndex; i++) {
                    const token = parsedQuery.tokens[i];
                    // Token not part of any segment, must be a delimiter
                    nodes.push(
                        <TokenRenderer
                            key={nodes.length}
                            token={token}
                            queryId={props.queryItem.id}
                            diagnostics={diagnostics}
                        />
                    );
                }

                const segmentTokens = parsedQuery.tokens.slice(
                    segment.tokenStartIndex,
                    segment.tokenEndIndex
                );

                nodes.push(
                    <QuerySegment
                        key={nodes.length}
                        queryId={props.queryItem.id}
                        segmentIndex={segmentIndex}
                        tokens={segmentTokens}
                        diagnostics={diagnostics}
                    />
                );

                segmentIndex++;
                tokenIndex = segment.tokenEndIndex;
            }

            for (let i = tokenIndex; i < parsedQuery.tokens.length; i++) {
                const token = parsedQuery.tokens[i];
                // Token not part of any segment, must be a delimiter
                nodes.push(
                    <TokenRenderer
                        key={nodes.length}
                        token={token}
                        queryId={props.queryItem.id}
                        diagnostics={diagnostics}
                    />
                );
            }

            return nodes;
        },
        [props.queryItem, dataContext.stateManager]
    );

    return (
        <QueryChipComponent
            {...queryChipProps}
            data-querychip-id={props.queryItem.id}
            tabIndex={0}
            style={makeStyle(
                props.isLast && !hasMoreThanOneSegment,
                isValid || isEditing,
                isSelected
            )}
        >
            <MatchesCounter matches={matchedLeafNodes} />
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

function makeStyle(
    isLast: boolean,
    isValid: boolean,
    isSelected: boolean
): React.CSSProperties {
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
        outline: isSelected ? "2px solid #272727" : "none",
    };
}
