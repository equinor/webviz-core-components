import React from "react";
import { type Token } from "../core/query-language/lexer";
import { TokenRenderer } from "./TokenRenderer";

export type QuerySegmentProps = {
    queryId: string;
    segmentIndex: number;
    tokens: Token[];
};

export function QuerySegment(props: QuerySegmentProps): React.ReactElement {
    return (
        <div
            data-segment-query-id={props.queryId}
            data-segment-index={props.segmentIndex}
        >
            {props.tokens.map((token, index) => (
                <TokenRenderer
                    key={index}
                    token={token}
                    queryId={props.queryId}
                />
            ))}
        </div>
    );
}
