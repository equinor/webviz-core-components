import React from "react";
import {
    SmartNodeSelectorDataContext,
    SmartNodeSelectorSlotsContext,
} from "../SmartNodeSelector";
import { useMatches } from "../hooks/useMatches";
import { MatchesCounter } from "./MatchesCounter";
import { Topic, type QueryItem } from "../core/StateManager";
import { TokenRenderer } from "./TokenRenderer";
import { TagTokenizer } from "../core/TagTokenizer";
import { useSubscribeToTopic } from "../core/PubSubDelegate";

export type QueryChipProps = {
    queryItem: QueryItem;
    isLast: boolean;
};

export function QueryChip(props: QueryChipProps): React.ReactElement {
    const dataContext = React.useContext(SmartNodeSelectorDataContext);
    const slotsContext = React.useContext(SmartNodeSelectorSlotsContext);

    const matches = useMatches(props.queryItem);

    const caretPositions = useSubscribeToTopic(
        dataContext.stateManager,
        Topic.CARET_POSITIONS
    );

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

    const isValid = matches.length > 0;
    const isEditing =
        caretPositions.find((pos) => pos.queryId === props.queryItem.id) !==
        undefined;
    const hasMoreThanOneSegment = props.queryItem.query.includes(
        dataContext.delimiter
    );

    return (
        <QueryChipComponent
            {...queryChipProps}
            data-querychip-id={props.queryItem.id}
            tabIndex={0}
            style={makeStyle(
                props.isLast && !hasMoreThanOneSegment,
                isValid || isEditing
            )}
        >
            <MatchesCounter matches={matches} />
            <div
                data-query-chip-content
                style={{
                    display: "flex",
                    alignItems: "center",
                    alignSelf: "stretch",
                    flex: 1,
                    whiteSpace: "pre",
                }}
            >
                <TokenRenderer token={tokens} queryId={props.queryItem.id} />
                <Placeholder
                    isVisible={props.queryItem.query === ""}
                    isLast={props.isLast}
                />
            </div>
        </QueryChipComponent>
    );
}

type PlaceholderProps = {
    isVisible?: boolean;
    isLast?: boolean;
};

function Placeholder(props: PlaceholderProps) {
    const context = React.useContext(SmartNodeSelectorDataContext);

    if (!props.isVisible) {
        return null;
    }

    const placeholderText = props.isLast
        ? context.placeholders.newTag
        : context.placeholders.incompleteTag;

    return (
        <div
            style={{
                color: "black",
                opacity: 0.3,
                marginLeft: 2,
            }}
        >
            {placeholderText}
        </div>
    );
}

function makeStyle(isLast: boolean, isValid: boolean): React.CSSProperties {
    if (isLast) {
        return {
            display: "flex",
            alignItems: "center",
            gap: "1px",
            flexGrow: 1,
            minHeight: 20,
        };
    }
    return {
        display: "flex",
        alignItems: "center",
        gap: "1px",
        border: isValid ? "1px solid #ccc" : "1px solid #f4bdbdff",
        borderRadius: "4px",
        backgroundColor: isValid ? "#f5f5f5" : "#f4bdbdff",
        padding: "2px 4px",
    };
}
