import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { Topic } from "../core/StateManager/StateManager";
import { useElementBoundingRect } from "../hooks/useElementBoundingRect";
import { computeTextWidthAndHeight } from "../utils/caretToCoordinateMapping";

export type CaretAndSelectionRendererProps = {
    mainRef: React.RefObject<HTMLDivElement>;
};

export function CaretAndSelectionRenderer(
    props: CaretAndSelectionRendererProps
): React.ReactElement {
    const { stateManager, delimiter } = React.useContext(
        SmartNodeSelectorDataContext
    );

    const segmentTextSelections = useSubscribeToTopic(
        stateManager,
        Topic.SEGMENT_TEXT_SELECTIONS
    );

    const queryItems = useSubscribeToTopic(stateManager, Topic.QUERY_ITEMS);

    // Track main container bounding rect changes
    const mainBoundingRect = useElementBoundingRect(props.mainRef.current);

    const [mappedCaretPositions, setMappedCaretPositions] = React.useState<
        Array<{ left: number; top: number }>
    >([]);

    const [mappedSelectionPositions, setMappedSelectionPositions] =
        React.useState<
            Array<{ left: number; top: number; width: number; height: number }>
        >([]);

    const [fontSize, setFontSize] = React.useState<number>(16);

    React.useLayoutEffect(
        function updateCaretPositions() {
            const newMappedCaretPositions: Array<{
                left: number;
                top: number;
            }> = [];
            const newMappedSelectionPositions: Array<{
                left: number;
                top: number;
                width: number;
                height: number;
            }> = [];

            for (const position of segmentTextSelections) {
                const queryItem = stateManager.getQueryItemById(
                    position.queryId
                );

                if (!queryItem) {
                    continue;
                }

                if (!mainBoundingRect) {
                    continue;
                }

                const parsedQuery = stateManager.getParsedQuery(
                    queryItem.query
                );
                if (!parsedQuery) {
                    continue;
                }

                // Get chip element for height calculation
                const chipElement = props.mainRef.current?.querySelector(
                    `[data-querychip-id="${position.queryId}"]>[data-query-chip-content]`
                ) as HTMLElement | null;

                if (!chipElement) {
                    continue;
                }

                const chipBoundingRect = chipElement.getBoundingClientRect();
                const caretHeight = chipBoundingRect.height - 4;
                const caretTop = chipBoundingRect.top + 1;

                // Render caret at focus position
                const focusSegment =
                    parsedQuery.segments[position.focusSegmentIndex];
                if (focusSegment) {
                    const focusSegmentElement =
                        props.mainRef.current?.querySelector(
                            `[data-segment-query-id="${position.queryId}"][data-segment-index="${position.focusSegmentIndex}"]`
                        ) as HTMLElement | null;

                    if (focusSegmentElement) {
                        const focusSegmentRect =
                            focusSegmentElement.getBoundingClientRect();
                        const focusSegmentText = queryItem.query.slice(
                            focusSegment.charRange.start,
                            focusSegment.charRange.end
                        );

                        const textBeforeCaret = focusSegmentText.slice(
                            0,
                            position.focus
                        );

                        const { width: textWidth } = computeTextWidthAndHeight(
                            textBeforeCaret,
                            focusSegmentElement
                        );

                        newMappedCaretPositions.push({
                            left:
                                focusSegmentRect.left +
                                textWidth -
                                mainBoundingRect.left,
                            top: caretTop - mainBoundingRect.top,
                        });

                        setFontSize(caretHeight);
                    }
                }

                // Render a single selection highlight spanning from anchor to focus
                if (
                    position.focusSegmentIndex !==
                        position.anchorSegmentIndex ||
                    position.focus !== position.anchor
                ) {
                    // Determine which position comes first visually
                    const anchorIsFirst =
                        position.anchorSegmentIndex <
                            position.focusSegmentIndex ||
                        (position.anchorSegmentIndex ===
                            position.focusSegmentIndex &&
                            position.anchor < position.focus);

                    const startSegIdx = anchorIsFirst
                        ? position.anchorSegmentIndex
                        : position.focusSegmentIndex;
                    const startOffset = anchorIsFirst
                        ? position.anchor
                        : position.focus;
                    const endSegIdx = anchorIsFirst
                        ? position.focusSegmentIndex
                        : position.anchorSegmentIndex;
                    const endOffset = anchorIsFirst
                        ? position.focus
                        : position.anchor;

                    // Get start segment element and calculate start X position
                    const startSegment = parsedQuery.segments[startSegIdx];
                    const startSegmentElement =
                        props.mainRef.current?.querySelector(
                            `[data-segment-query-id="${position.queryId}"][data-segment-index="${startSegIdx}"]`
                        ) as HTMLElement | null;

                    // Get end segment element and calculate end X position
                    const endSegment = parsedQuery.segments[endSegIdx];
                    const endSegmentElement =
                        props.mainRef.current?.querySelector(
                            `[data-segment-query-id="${position.queryId}"][data-segment-index="${endSegIdx}"]`
                        ) as HTMLElement | null;

                    if (
                        startSegment &&
                        startSegmentElement &&
                        endSegment &&
                        endSegmentElement
                    ) {
                        const startSegmentRect =
                            startSegmentElement.getBoundingClientRect();
                        const startSegmentText = queryItem.query.slice(
                            startSegment.charRange.start,
                            startSegment.charRange.end
                        );
                        const { width: startTextWidth } =
                            computeTextWidthAndHeight(
                                startSegmentText.slice(0, startOffset),
                                startSegmentElement
                            );
                        const selectionStartX =
                            startSegmentRect.left +
                            startTextWidth -
                            mainBoundingRect.left;

                        const endSegmentRect =
                            endSegmentElement.getBoundingClientRect();
                        const endSegmentText = queryItem.query.slice(
                            endSegment.charRange.start,
                            endSegment.charRange.end
                        );
                        const { width: endTextWidth } =
                            computeTextWidthAndHeight(
                                endSegmentText.slice(0, endOffset),
                                endSegmentElement
                            );
                        const selectionEndX =
                            endSegmentRect.left +
                            endTextWidth -
                            mainBoundingRect.left;

                        const selectionWidth = selectionEndX - selectionStartX;

                        if (selectionWidth > 0) {
                            newMappedSelectionPositions.push({
                                left: selectionStartX,
                                top: caretTop - mainBoundingRect.top,
                                width: selectionWidth,
                                height: caretHeight,
                            });
                        }
                    }
                }
            }

            setMappedCaretPositions(newMappedCaretPositions);
            setMappedSelectionPositions(newMappedSelectionPositions);
        },
        [
            segmentTextSelections,
            queryItems,
            stateManager,
            props.mainRef,
            mainBoundingRect,
            delimiter,
        ]
    );

    return (
        <>
            <style>
                {`
        @keyframes blink { 50% { opacity: 0; } }
      `}
            </style>
            {mappedCaretPositions.map((position, index) => (
                <div
                    key={`caret-${index}`}
                    data-caret-index={index}
                    style={{
                        width: 1,
                        height: fontSize,
                        backgroundColor: "black",
                        position: "absolute",
                        left: position.left,
                        top: position.top,
                        transform: "translateX(-1px)",
                        pointerEvents: "none" as const,
                        animation: "blink 1s step-end infinite",
                    }}
                />
            ))}
            {mappedSelectionPositions.map((position, index) => (
                <div
                    key={`selection-${index}`}
                    data-selection-index={index}
                    style={{
                        position: "absolute",
                        left: position.left,
                        top: position.top,
                        width: position.width,
                        height: position.height,
                        backgroundColor: "rgba(0, 120, 215, 0.3)",
                        pointerEvents: "none" as const,
                    }}
                />
            ))}
        </>
    );
}

