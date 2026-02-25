import React from "react";
import {
    SmartNodeSelectorDataContext,
    SmartNodeSelectorOptionsContext,
} from "../SmartNodeSelector";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { Topic } from "../core/StateManager/StateManager";
import { type Token } from "../core/query-language/lexer";
import type { Diagnostic } from "../core/query-language/types/diagnostics";
import { TokenRenderer } from "./TokenRenderer";

export type QuerySegmentProps = {
    queryId: string;
    mayUseCustomRenderer: boolean;
    segmentIndex: number;
    tokens: Token[];
    diagnostics?: Diagnostic[];
};

export function QuerySegment(props: QuerySegmentProps): React.ReactElement {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);
    const options = React.useContext(SmartNodeSelectorOptionsContext);

    const focusedSegment = useSubscribeToTopic(
        dataContext.stateManager,
        Topic.FOCUSED_SEGMENT
    );

    const segmentSelection = useSubscribeToTopic(
        dataContext.stateManager,
        Topic.SEGMENT_SELECTION
    );

    const isSegmentSelected =
        segmentSelection?.queryId === props.queryId &&
        props.segmentIndex >= Math.min(segmentSelection.anchor, segmentSelection.focus) &&
        props.segmentIndex <= Math.max(segmentSelection.anchor, segmentSelection.focus);

    const textSelections = useSubscribeToTopic(
        dataContext.stateManager,
        Topic.QUERY_TEXT_SELECTIONS
    );

    const isFocused =
        focusedSegment?.queryId === props.queryId &&
        focusedSegment?.segmentIndex === props.segmentIndex;

    const hasSelectionInSegment = React.useMemo(() => {
        const selectionsForQuery = textSelections.filter(
            (s) => s.queryId === props.queryId
        );
        if (selectionsForQuery.length === 0) return false;

        const queryItem = dataContext.stateManager.getQueryItemById(
            props.queryId
        );
        if (!queryItem) return false;

        const parsedQuery = dataContext.stateManager.getParsedQuery(
            queryItem.query
        );
        const segment = parsedQuery?.segments[props.segmentIndex];
        if (!segment) return false;

        const segStart = segment.charRange.start;
        const segEnd = segment.charRange.end;

        return selectionsForQuery.some((sel) => {
            const selStart = Math.min(sel.anchor, sel.focus);
            const selEnd = Math.max(sel.anchor, sel.focus);
            // Check if selection intersects segment using inclusive boundaries
            // A point is in segment if: segStart <= point <= segEnd
            // Selection intersects if either endpoint is in segment, or selection spans segment
            const startInSegment = selStart >= segStart && selStart <= segEnd;
            const endInSegment = selEnd >= segStart && selEnd <= segEnd;
            const selectionSpansSegment =
                selStart <= segStart && selEnd >= segEnd;
            return startInSegment || endInSegment || selectionSpansSegment;
        });
    }, [
        textSelections,
        props.queryId,
        props.segmentIndex,
        dataContext.stateManager,
    ]);

    const isActive = isFocused || hasSelectionInSegment;

    const matchedNodes =
        dataContext.stateManager.getMatchedNodesForQuerySegment(
            props.queryId,
            props.segmentIndex
        );

    const { tokensToRender, isTruncated, truncationInfo } =
        React.useMemo(() => {
            if (!options.queryChips.truncation.enable || isFocused) {
                return {
                    tokensToRender: props.tokens,
                    isTruncated: false,
                    truncationInfo: null,
                };
            }

            const totalLength = props.tokens.reduce(
                (sum, token) => sum + token.value.length,
                0
            );

            if (totalLength <= options.queryChips.truncation.maxSegmentChars) {
                return {
                    tokensToRender: props.tokens,
                    isTruncated: false,
                    truncationInfo: null,
                };
            }

            return truncateTokensMiddle(
                props.tokens,
                options.queryChips.truncation.maxSegmentChars
            );
        }, [props.tokens, isFocused, options.queryChips.truncation.enable]);

    function makeContent() {
        const Component = options.ui.inactiveSegmentRenderer?.(
            props.segmentIndex
        );
        if (!isActive && Component && props.mayUseCustomRenderer) {
            return (
                <Component matchedNodes={matchedNodes?.matches ?? new Set()} />
            );
        }
        return tokensToRender.map((token, index) => (
            <TokenRenderer
                key={index}
                token={token}
                queryId={props.queryId}
                diagnostics={props.diagnostics}
            />
        ));
    }

    return (
        <div
            data-segment-query-id={props.queryId}
            data-segment-index={props.segmentIndex}
            data-segment-truncated={isTruncated}
            data-truncation-start={truncationInfo?.startText ?? ""}
            data-truncation-hidden={truncationInfo?.hiddenText ?? ""}
            data-truncation-end={truncationInfo?.endText ?? ""}
            data-truncation-ellipsis={truncationInfo?.ellipsisText ?? ""}
            style={
                isSegmentSelected
                    ? {
                          outline: "2px solid #1a73e8",
                          borderRadius: 2,
                          backgroundColor: "#e8f0fe",
                      }
                    : undefined
            }
        >
            {makeContent()}
        </div>
    );
}

type TruncationInfo = {
    startText: string;
    hiddenText: string;
    endText: string;
    ellipsisText: string;
};

function truncateTokensMiddle(
    tokens: Token[],
    maxChars: number
): {
    tokensToRender: Token[];
    isTruncated: boolean;
    truncationInfo: TruncationInfo;
} {
    const ellipsisLength = 3;
    const keepStartChars = Math.floor((maxChars - ellipsisLength) / 2);
    const keepEndChars = Math.ceil((maxChars - ellipsisLength) / 2);

    // Get the full text
    const fullText = tokens.map((t) => t.value).join("");

    // Extract start, hidden, and end text
    const startText = fullText.slice(0, keepStartChars);
    const endText = fullText.slice(-keepEndChars);
    const hiddenText = fullText.slice(
        keepStartChars,
        fullText.length - keepEndChars
    );

    // Now rebuild tokens for rendering based on the truncated text
    const startTokens: Token[] = [];
    const endTokens: Token[] = [];

    let charCount = 0;

    // Build start tokens
    for (const token of tokens) {
        if (charCount >= keepStartChars) {
            break;
        }

        if (charCount + token.value.length <= keepStartChars) {
            // Token fits completely in start
            startTokens.push(token);
            charCount += token.value.length;
        } else {
            // Token needs to be truncated - only truncate LITERAL tokens
            if (token.type === "LITERAL") {
                const remainingChars = keepStartChars - charCount;
                const truncatedToken: Token = {
                    ...token,
                    value: token.value.slice(0, remainingChars),
                };
                startTokens.push(truncatedToken);
            }
            break;
        }
    }

    // Build end tokens
    charCount = 0;
    const reversedTokens = [...tokens].reverse();
    const tempEndTokens: Token[] = [];

    for (const token of reversedTokens) {
        if (charCount >= keepEndChars) {
            break;
        }

        if (charCount + token.value.length <= keepEndChars) {
            // Token fits completely in end
            tempEndTokens.push(token);
            charCount += token.value.length;
        } else {
            // Token needs to be truncated - only truncate LITERAL tokens
            if (token.type === "LITERAL") {
                const remainingChars = keepEndChars - charCount;
                const truncatedToken: Token = {
                    ...token,
                    value: token.value.slice(-remainingChars),
                };
                tempEndTokens.push(truncatedToken);
            }
            break;
        }
    }

    // Reverse end tokens back to correct order
    endTokens.push(...tempEndTokens.reverse());

    const ellipsisText = "...";

    // Create ellipsis token
    const ellipsisToken: Token = {
        type: "LITERAL",
        value: ellipsisText,
        id: -1,
        charRange: { start: -1, end: -1 },
    };

    return {
        tokensToRender: [...startTokens, ellipsisToken, ...endTokens],
        isTruncated: true,
        truncationInfo: {
            startText,
            hiddenText,
            endText,
            ellipsisText,
        },
    };
}
