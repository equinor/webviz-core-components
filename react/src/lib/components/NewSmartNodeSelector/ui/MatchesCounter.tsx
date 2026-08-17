import React from "react";
import type { IndexedNode } from "../core";
import { SmartNodeSelectorSlotsContext } from "../SmartNodeSelector";

export type MatchesCounterProps = {
    visible: boolean;
    matches: IndexedNode[];
};

export function MatchesCounter(props: MatchesCounterProps) {
    const slotsContext = React.useContext(SmartNodeSelectorSlotsContext);

    const MatchesCounterComponent = slotsContext.slots.matchesCounter;
    const matchesCounterProps = {
        style: {
            padding: 2,
            backgroundColor: "#e0e0e0",
        },
        ...slotsContext.slotProps.matchesCounter,
    };

    if (!props.visible) {
        return null;
    }

    function makeTitle() {
        let title = "";
        for (const match of props.matches) {
            title += `${match.path}\n`;
        }
        return title.trim();
    }

    return (
        <MatchesCounterComponent {...matchesCounterProps} title={makeTitle()}>
            {props.matches.length}
        </MatchesCounterComponent>
    );
}
