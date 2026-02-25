import React from "react";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { Topic } from "../core/StateManager/StateManager";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { SiblingBrowserPopover } from "./SiblingBrowserPopover";

export type SiblingBrowserControllerProps = {
    mainRef: React.RefObject<HTMLDivElement>;
};

export function SiblingBrowserController(
    props: SiblingBrowserControllerProps
): React.ReactElement {
    const { stateManager } = React.useContext(SmartNodeSelectorDataContext);

    const segmentSelection = useSubscribeToTopic(
        stateManager,
        Topic.SEGMENT_SELECTION
    );

    // Subscribe to QUERY_ITEMS so we re-derive browser info after a sibling cycle
    const queryItems = useSubscribeToTopic(stateManager, Topic.QUERY_ITEMS);

    const siblingBrowserInfo = React.useMemo(() => {
        if (!segmentSelection) {
            return null;
        }
        return stateManager.getSegmentBrowserInfo(
            segmentSelection.queryId,
            segmentSelection.focus
        );
        // queryItems is intentionally listed so we refresh after cycling
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segmentSelection, stateManager, queryItems]);

    const anchorElement = React.useMemo(() => {
        if (!segmentSelection) {
            return null;
        }
        return (
            (props.mainRef.current?.querySelector(
                `[data-segment-query-id="${segmentSelection.queryId}"][data-segment-index="${segmentSelection.focus}"]`
            ) as HTMLElement | null) ?? null
        );
        // queryItems dependency ensures we re-query the DOM after a sibling cycle
        // rewrites the query text (segment elements get re-rendered)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segmentSelection, props.mainRef, queryItems]);

    const handleCycle = React.useCallback(
        function handleCycle(direction: 1 | -1) {
            stateManager.cycleSibling(direction);
        },
        [stateManager]
    );

    const handleWheel = React.useCallback(
        function handleWheel(e: WheelEvent) {
            if (stateManager.getSelectionMode() !== "segment") {
                return;
            }
            e.preventDefault();
            stateManager.cycleSibling(e.deltaY > 0 ? 1 : -1);
        },
        [stateManager]
    );

    // Attach wheel listener to the root element
    React.useEffect(
        function setupWheelListener() {
            const rootEl = props.mainRef.current;
            if (!rootEl) {
                return;
            }
            // passive: false is required to allow preventDefault
            rootEl.addEventListener("wheel", handleWheel, { passive: false });
            return () => {
                rootEl.removeEventListener("wheel", handleWheel);
            };
        },
        [props.mainRef, handleWheel]
    );

    if (!siblingBrowserInfo || siblingBrowserInfo.siblings.length === 0) {
        return <></>;
    }

    return (
        <SiblingBrowserPopover
            siblings={siblingBrowserInfo.siblings}
            currentIndex={siblingBrowserInfo.currentIndex}
            anchorElement={anchorElement}
            onCycle={handleCycle}
        />
    );
}
