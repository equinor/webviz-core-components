import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { Topic } from "../core/StateManager/StateManager";
import { computeTextWidthAndHeight } from "../utils/caretToCoordinateMapping";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { useElementBoundingRect } from "../hooks/useElementBoundingRect";

export type CaretRendererProps = {
    mainRef: React.RefObject<HTMLDivElement>;
};

export function CaretRenderer(props: CaretRendererProps): React.ReactElement {
    const { stateManager, delimiter } = React.useContext(
        SmartNodeSelectorDataContext
    );

    const segmentCaretPositions = useSubscribeToTopic(
        stateManager,
        Topic.SEGMENT_CARET_POSITIONS
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
            const newMappedCaretPositions = [];
            const newMappedSelectionPositions = [];
            for (const position of segmentCaretPositions) {
                // Find the segment element instead of the chip content
                const segmentElement = props.mainRef.current?.querySelector(
                    `[data-segment-query-id="${position.queryId}"][data-segment-index="${position.segmentIndex}"]`
                ) as HTMLElement | null;
                if (!segmentElement) {
                    continue;
                }

                const segmentBoundingRect =
                    segmentElement.getBoundingClientRect();
                const queryItem = stateManager.getQueryItemById(
                    position.queryId
                );
                if (!queryItem) {
                    continue;
                }

                if (!mainBoundingRect) {
                    continue;
                }

                // Get the query chip element to determine the correct height
                const chipElement = props.mainRef.current?.querySelector(
                    `[data-querychip-id="${position.queryId}"]`
                ) as HTMLElement | null;
                const chipBoundingRect = chipElement?.getBoundingClientRect();

                // Get the segment text
                const segments = queryItem.query.split(delimiter);
                const segmentText = segments[position.segmentIndex] ?? "";

                const textBeforeCaret = segmentText.slice(0, position.offset);

                const { width: textWidth } = computeTextWidthAndHeight(
                    textBeforeCaret,
                    segmentElement
                );

                // Get height from chip element to handle empty segments correctly
                const caretHeight =
                    chipBoundingRect?.height ?? segmentBoundingRect.height;

                // Use chip's top position for empty segments to ensure correct alignment
                const caretTop =
                    chipBoundingRect?.top ?? segmentBoundingRect.top;

                newMappedCaretPositions.push({
                    left:
                        segmentBoundingRect.left +
                        textWidth -
                        mainBoundingRect.left,
                    top: caretTop - mainBoundingRect.top,
                });

                setFontSize(caretHeight);

                if (position.anchorOffset !== position.offset) {
                    const startOffset = Math.min(
                        position.offset,
                        position.anchorOffset
                    );
                    const endOffset = Math.max(
                        position.offset,
                        position.anchorOffset
                    );

                    // Calculate selection bounds within the segment
                    const { width: startWidth } = computeTextWidthAndHeight(
                        segmentText.slice(0, startOffset),
                        segmentElement
                    );
                    const { width: endWidth } = computeTextWidthAndHeight(
                        segmentText.slice(0, endOffset),
                        segmentElement
                    );

                    const selectionStartX =
                        segmentBoundingRect.left +
                        startWidth -
                        mainBoundingRect.left;
                    const selectionWidth = endWidth - startWidth;

                    newMappedSelectionPositions.push({
                        left: selectionStartX,
                        top: caretTop - mainBoundingRect.top,
                        width: selectionWidth,
                        height: caretHeight,
                    });
                }
            }

            setMappedCaretPositions(newMappedCaretPositions);
            setMappedSelectionPositions(newMappedSelectionPositions);
        },
        [
            segmentCaretPositions,
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
