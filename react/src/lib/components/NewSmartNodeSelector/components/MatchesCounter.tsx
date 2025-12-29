import React from "react";
import type { IndexedNode } from "../core";
import { SmartNodeSelectorSlotsContext } from "../SmartNodeSelector";

export type MatchesCounterProps = {
    matches: IndexedNode[];
};

export function MatchesCounter(props: MatchesCounterProps) {
    const slotsContext = React.useContext(SmartNodeSelectorSlotsContext);

    if (props.matches.length === 0) {
        return null;
    }

    const MatchesCounterComponent = slotsContext.slots.matchesCounter;
    const matchesCounterProps = {
        style: {
            padding: 2,
            backgroundColor: "#e0e0e0",
        },
        ...slotsContext.slotProps.matchesCounter
    };

    return (
        <MatchesCounterComponent {...matchesCounterProps}>
            {props.matches.length}
        </MatchesCounterComponent>
    );
}
