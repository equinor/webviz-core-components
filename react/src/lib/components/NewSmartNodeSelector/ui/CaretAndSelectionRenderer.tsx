import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { Topic } from "../core/StateManager/StateManager";
import { useElementBoundingRect } from "../hooks/useElementBoundingRect";
import { computeTextWidthAndHeight } from "../utils/caretToCoordinateMapping";

export type CaretRendererProps = {
    mainRef: React.RefObject<HTMLDivElement>;
};

export function CaretRenderer(props: CaretRendererProps): React.ReactElement {
    const { stateManager, delimiter } = React.useContext(
        SmartNodeSelectorDataContext
    );

    const queryTextSelections = useSubscribeToTopic(
        stateManager,
        Topic.QUERY_TEXT_SELECTIONS
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
            for (const position of queryTextSelections) {
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
                    `[data-querychip-id="${position.queryId}"]>[data-query-chip-content]`
                ) as HTMLElement | null;

                if (!chipElement) {
                    continue;
                }

                const chipBoundingRect = chipElement?.getBoundingClientRect();

                const textBeforeCaret = queryItem.query.slice(
                    0,
                    position.focus
                );

                const { width: textWidth } = computeTextWidthAndHeight(
                    textBeforeCaret,
                    chipElement
                );

                // Get height from chip element to handle empty segments correctly
                const caretHeight = chipBoundingRect.height - 4;

                // Use chip's top position for empty segments to ensure correct alignment
                const caretTop = chipBoundingRect.top + 1;

                newMappedCaretPositions.push({
                    left:
                        chipBoundingRect.left +
                        textWidth -
                        mainBoundingRect.left,
                    top: caretTop - mainBoundingRect.top,
                });

                setFontSize(caretHeight);

                if (position.anchor !== position.focus) {
                    const startOffset = Math.min(
                        position.focus,
                        position.anchor
                    );
                    const endOffset = Math.max(position.focus, position.anchor);

                    // Calculate selection bounds within the segment
                    const { width: startWidth } = computeTextWidthAndHeight(
                        queryItem.query.slice(0, startOffset),
                        chipElement
                    );
                    const { width: endWidth } = computeTextWidthAndHeight(
                        queryItem.query.slice(0, endOffset),
                        chipElement
                    );

                    const selectionStartX =
                        chipBoundingRect.left +
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
            queryTextSelections,
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
