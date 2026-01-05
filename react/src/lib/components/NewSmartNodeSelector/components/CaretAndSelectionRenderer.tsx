import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { Topic } from "../core/StateManager";
import { computeTextWidth } from "../utils/caretToCoordinateMapping";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { useElementBoundingRect } from "../hooks/useElementBoundingRect";

export type CaretRendererProps = {
    mainRef: React.RefObject<HTMLDivElement>;
};

export function CaretRenderer(props: CaretRendererProps): React.ReactElement {
    const { stateManager } = React.useContext(SmartNodeSelectorDataContext);

    const caretPositions = useSubscribeToTopic(
        stateManager,
        Topic.CARET_POSITIONS
    );

    const queryItems = useSubscribeToTopic(stateManager, Topic.QUERY_ITEMS);

    // Track main container bounding rect changes
    const mainBoundingRect = useElementBoundingRect(props.mainRef);

    const [mappedCaretPositions, setMappedCaretPositions] = React.useState<
        Array<{ left: number; top: number }>
    >([]);

    const [mappedSelectionPositions, setMappedSelectionPositions] =
        React.useState<
            Array<{ left: number; top: number; width: number; height: number }>
        >([]);

    React.useLayoutEffect(
        function updateCaretPositions() {
            const newMappedCaretPositions = [];
            const newMappedSelectionPositions = [];
            for (const position of caretPositions) {
                const chip = props.mainRef.current?.querySelector(
                    `[data-querychip-id="${position.queryId}"] [data-query-chip-content]`
                ) as HTMLElement | null;
                if (!chip) {
                    continue;
                }

                const chipBoundingRect = chip.getBoundingClientRect();
                const queryItem = stateManager.getQueryItemById(
                    position.queryId
                );
                if (!queryItem) {
                    continue;
                }

                if (!mainBoundingRect) {
                    continue;
                }

                const textBeforeCaret = queryItem.query.slice(
                    0,
                    position.offset
                );

                const textWidth = computeTextWidth(textBeforeCaret, chip);

                newMappedCaretPositions.push({
                    left:
                        chipBoundingRect.left +
                        textWidth -
                        mainBoundingRect.left,
                    top: chipBoundingRect.top - mainBoundingRect.top,
                });

                if (position.anchorOffset !== position.offset) {
                    const startOffset = Math.min(
                        position.offset,
                        position.anchorOffset
                    );
                    const endOffset = Math.max(
                        position.offset,
                        position.anchorOffset
                    );

                    const textBeforeSelectionStart = queryItem.query.slice(
                        0,
                        startOffset
                    );
                    const textInSelection = queryItem.query.slice(
                        startOffset,
                        endOffset
                    );

                    const selectionStartX =
                        chipBoundingRect.left +
                        computeTextWidth(textBeforeSelectionStart, chip) -
                        mainBoundingRect.left;
                    const selectionWidth = computeTextWidth(
                        textInSelection,
                        chip
                    );

                    newMappedSelectionPositions.push({
                        left: selectionStartX,
                        top: chipBoundingRect.top - mainBoundingRect.top,
                        width: selectionWidth,
                        height: chipBoundingRect.height,
                    });
                }
            }

            setMappedCaretPositions(newMappedCaretPositions);
            setMappedSelectionPositions(newMappedSelectionPositions);
        },
        [caretPositions, queryItems, stateManager, props.mainRef, mainBoundingRect]
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
                        height: 20,
                        backgroundColor: "black",
                        position: "absolute",
                        left: position.left,
                        top: position.top,
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
