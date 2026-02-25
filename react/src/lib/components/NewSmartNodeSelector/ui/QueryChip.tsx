import React from "react";
import {
    SmartNodeSelectorDataContext,
    SmartNodeSelectorOptionsContext,
    SmartNodeSelectorSlotsContext,
} from "../SmartNodeSelector";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { Topic } from "../core/StateManager/StateManager";
import type { QueryItem } from "../core/StateManager/types";
import { useLeafNodeMatches } from "../hooks/useLeafNodeMatches";
import { MatchesCounter } from "./MatchesCounter";
import { QuerySegment } from "./QuerySegment";
import { TokenRenderer } from "./TokenRenderer";
import { usePreviousQueriesLeafNodeMatches } from "../hooks/usePreviousQueriesLeafNodeMatches";

export type QueryChipProps = {
    index: number;
    queryItem: QueryItem;
    isLast: boolean;
};

export function QueryChip(props: QueryChipProps): React.ReactElement {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);
    const options = React.useContext(SmartNodeSelectorOptionsContext);
    const slotsContext = React.useContext(SmartNodeSelectorSlotsContext);

    const matchedLeafNodes = useLeafNodeMatches(props.queryItem);
    const previousQueriesMatchedLeafNodes = usePreviousQueriesLeafNodeMatches(
        props.queryItem
    );

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
            Math.min(querySelection.anchor, querySelection.focus),
            Math.max(querySelection.anchor, querySelection.focus),
        ];

        return props.index >= range[0] && props.index <= range[1];
    }, [querySelection, props.index]);

    const isDuplicate = React.useMemo(() => {
        for (const match of matchedLeafNodes) {
            if (previousQueriesMatchedLeafNodes.includes(match)) {
                return true;
            }
        }
        return false;
    }, [matchedLeafNodes, previousQueriesMatchedLeafNodes]);

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

    const parsedQuery = dataContext.stateManager.getParsedQuery(
        props.queryItem.query
    );
    const hasMoreThanOneSegment = (parsedQuery?.segments.length ?? 0) > 1;

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

            // Get selections for this query to determine which segments are active
            const selectionsForQuery = textSelections.filter(
                (s) => s.queryId === props.queryItem.id
            );

            // Helper to check if a segment is active (has selection intersecting it)
            function isSegmentActive(segIndex: number): boolean {
                if (selectionsForQuery.length === 0) return false;
                const seg = parsedQuery?.segments[segIndex];
                if (!seg) return false;

                const segStart = seg.charRange.start;
                const segEnd = seg.charRange.end;

                return selectionsForQuery.some((sel) => {
                    const selStart = Math.min(sel.anchor, sel.focus);
                    const selEnd = Math.max(sel.anchor, sel.focus);
                    // Check if selection intersects segment using inclusive boundaries
                    const startInSegment =
                        selStart >= segStart && selStart <= segEnd;
                    const endInSegment = selEnd >= segStart && selEnd <= segEnd;
                    const selectionSpansSegment =
                        selStart <= segStart && selEnd >= segEnd;
                    return (
                        startInSegment || endInSegment || selectionSpansSegment
                    );
                });
            }

            // Helper to check if a segment uses custom renderer
            function segmentUsesCustomRenderer(segIndex: number): boolean {
                const Component =
                    options.ui.inactiveSegmentRenderer?.(segIndex);
                return Component !== null && !isSegmentActive(segIndex);
            }

            for (const segment of parsedQuery?.segments ?? []) {
                // Render delimiter tokens before this segment, but skip if previous segment used custom renderer
                const prevSegmentUsedCustomRenderer =
                    segmentIndex > 0 &&
                    segmentUsesCustomRenderer(segmentIndex - 1);

                if (!prevSegmentUsedCustomRenderer) {
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
                        mayUseCustomRenderer={
                            !(props.isLast && !hasMoreThanOneSegment)
                        }
                    />
                );

                segmentIndex++;
                tokenIndex = segment.tokenEndIndex;
            }

            // Render trailing delimiter tokens, but skip if last segment used custom renderer
            const lastSegmentUsedCustomRenderer =
                segmentIndex > 0 && segmentUsesCustomRenderer(segmentIndex - 1);

            if (!lastSegmentUsedCustomRenderer) {
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
            }

            return nodes;
        },
        [props.queryItem, dataContext.stateManager, textSelections, options]
    );

    return (
        <QueryChipComponent
            {...queryChipProps}
            data-querychip-id={props.queryItem.id}
            style={makeStyle(
                props.isLast && !hasMoreThanOneSegment,
                isValid || isEditing,
                isSelected,
                isDuplicate
            )}
            title={
                !isValid
                    ? "No matches for this query"
                    : isDuplicate
                      ? "This query has matches that were already matched by previous queries"
                      : undefined
            }
        >
            <MatchesCounter
                visible={hasMoreThanOneSegment}
                matches={matchedLeafNodes}
            />
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
            {hasMoreThanOneSegment && (
                <button onClick={handleRemoveTagClick} aria-label="Remove tag">
                    &#x2715;
                </button>
            )}
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
    isSelected: boolean,
    isDuplicate: boolean
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
        border: !isValid
            ? "1px solid #f4bdbdff"
            : isDuplicate
              ? "1px solid rgb(173, 116, 0)"
              : "1px solid #ccc",
        borderRadius: "4px",
        backgroundColor: !isValid
            ? "#f4bdbdff"
            : isDuplicate
              ? "rgb(255, 234, 172)"
              : "#f5f5f5",
        padding: "2px 4px",
        outline: isSelected ? "2px solid #272727" : "none",
    };
}
