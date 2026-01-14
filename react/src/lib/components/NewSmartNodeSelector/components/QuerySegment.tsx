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

    const isFocused =
        focusedSegment?.queryId === props.queryId &&
        focusedSegment?.segmentIndex === props.segmentIndex;

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

    return (
        <div
            data-segment-query-id={props.queryId}
            data-segment-index={props.segmentIndex}
            data-segment-truncated={isTruncated}
            data-truncation-start={truncationInfo?.startText ?? ""}
            data-truncation-hidden={truncationInfo?.hiddenText ?? ""}
            data-truncation-end={truncationInfo?.endText ?? ""}
            data-truncation-ellipsis={truncationInfo?.ellipsisText ?? ""}
        >
            {tokensToRender.map((token, index) => (
                <TokenRenderer
                    key={index}
                    token={token}
                    queryId={props.queryId}
                    diagnostics={props.diagnostics}
                />
            ))}
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
