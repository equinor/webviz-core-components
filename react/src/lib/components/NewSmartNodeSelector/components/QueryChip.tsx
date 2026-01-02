import React from "react";
import {
    SmartNodeSelectorDataContext,
    SmartNodeSelectorSlotsContext,
} from "../SmartNodeSelector";
import { useMatches } from "../hooks/useMatches";
import { MatchesCounter } from "./MatchesCounter";
import type { QueryItem } from "../core/StateManager";
import { TokenRenderer } from "./TokenRenderer";
import { TagTokenizer } from "../core/TagTokenizer";

export type QueryChipProps = {
    queryItem: QueryItem;
};

export function QueryChip(props: QueryChipProps): React.ReactElement {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);
    const slotsContext = React.useContext(SmartNodeSelectorSlotsContext);

    const matches = useMatches(props.queryItem);

    const handleRemoveTagClick = React.useCallback(
        function handleRemoveTagClick() {},
        [props.queryItem.id]
    );

    const QueryChipComponent = slotsContext.slots.queryChip;
    const queryChipProps = slotsContext.slotProps.queryChip ?? {};

    const tokenizer = React.useMemo(
        () => new TagTokenizer(dataContext.delimiter ?? ":"),
        [dataContext.delimiter]
    );

    // Tokenize the current value
    const tokens = React.useMemo(() => {
        try {
            return tokenizer.tokenize(props.queryItem.query);
        } catch (error) {
            // If tokenization fails, return a basic token structure
            return {
                type: "TAG" as const,
                children: [],
                start: 0,
                end: props.queryItem.query.length,
            };
        }
    }, [tokenizer, props.queryItem.query]);

    return (
        <QueryChipComponent
            {...queryChipProps}
            data-querychip-id={props.queryItem.id}
            tabIndex={0}
        >
            <div data-query-chip-content>
                <MatchesCounter matches={matches} />
                <TokenRenderer token={tokens} />
            </div>
        </QueryChipComponent>
    );
}

function makeStyle(isLast: boolean, isValid: boolean): React.CSSProperties {
    if (isLast) {
        return {
            display: "flex",
            alignItems: "center",
            gap: "1px",
            flexGrow: 1,
        };
    }
    return {
        display: "flex",
        alignItems: "center",
        gap: "1px",
        border: isValid ? "1px solid #ccc" : "1px solid #f4bdbdff",
        borderRadius: "4px",
        backgroundColor: isValid ? "#f5f5f5" : "#f4bdbdff",
    };
}
