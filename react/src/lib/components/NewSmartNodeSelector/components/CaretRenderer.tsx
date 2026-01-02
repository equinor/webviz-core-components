import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import {
    Topic,
    useSubscribeToStateManagerTopicValue,
} from "../core/StateManager";
import { computeTextWidth } from "../utils/caretToCoordinateMapping";

export type CaretRendererProps = {
    mainRef: React.RefObject<HTMLDivElement>;
};

export function CaretRenderer(props: CaretRendererProps): React.ReactElement {
    const { stateManager } = React.useContext(SmartNodeSelectorDataContext);

    const caretPositions = useSubscribeToStateManagerTopicValue(
        stateManager,
        Topic.CARET_POSITIONS
    );

    const mappedCaretPositions = React.useMemo(
        function mapCaretPositions() {
            const mappedCaretPositions = [];
            for (const position of caretPositions) {
                const chip = props.mainRef.current?.querySelector(
                    `[data-querychip-id="${position.queryId}"] > div`
                ) as HTMLElement | null;
                if (!chip) {
                    continue;
                }

                const bcr = chip.getBoundingClientRect();
                const queryItem = stateManager.getQueryItemById(
                    position.queryId
                );
                if (!queryItem) {
                    continue;
                }

                const textBeforeCaret = queryItem.query.slice(
                    0,
                    position.offset
                );

                const textWidth = computeTextWidth(textBeforeCaret, chip);

                mappedCaretPositions.push({
                    left: bcr.left + textWidth,
                    top: bcr.top,
                });
            }

            return mappedCaretPositions;
        },
        [caretPositions]
    );

    return (
        <>
            {mappedCaretPositions.map((position, index) => (
                <>
                    <style>
                        {`
        @keyframes blink { 50% { opacity: 0; } }
      `}
                    </style>
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
                </>
            ))}
        </>
    );
}
