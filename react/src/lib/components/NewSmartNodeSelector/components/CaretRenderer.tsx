import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { Topic } from "../core/StateManager";
import { computeTextWidth } from "../utils/caretToCoordinateMapping";
import { useSubscribeToTopic } from "../core/PubSubDelegate";

export type CaretRendererProps = {
    mainRef: React.RefObject<HTMLDivElement>;
};

export function CaretRenderer(props: CaretRendererProps): React.ReactElement {
    const { stateManager } = React.useContext(SmartNodeSelectorDataContext);

    const caretPositions = useSubscribeToTopic(
        stateManager,
        Topic.CARET_POSITIONS
    );

    const queryItems = useSubscribeToTopic(
        stateManager,
        Topic.QUERY_ITEMS
    );

    const [mappedCaretPositions, setMappedCaretPositions] = React.useState<
        Array<{ left: number; top: number }>
    >([]);

    React.useLayoutEffect(
        function updateCaretPositions() {
            const newMappedCaretPositions = [];
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

                const mainBoundingRect =
                    props.mainRef.current?.getBoundingClientRect();
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
            }

            setMappedCaretPositions(newMappedCaretPositions);
        },
        [caretPositions, queryItems, stateManager, props.mainRef]
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
                    key={index}
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
        </>
    );
}
