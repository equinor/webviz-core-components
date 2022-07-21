import React from "react";
import { Tooltip } from "@material-ui/core";

import "./value-tag.css";

export type ValueTagProps = {
    value: string;
    highlighted: boolean;
    matchedValues: string[];
    onRemove: (value: string) => void;
};

export const ValueTag: React.FC<ValueTagProps> = (props) => {
    return (
        <li
            className={`WebvizAttributeSelector_ValueTag${
                props.highlighted
                    ? " WebvizAttributeSelector_ValueTag--highlighted"
                    : ""
            }`}
        >
            {props.matchedValues.length > 1 && (
                <span className="WebvizAttributeSelector_ValueTag__NumMatches">
                    {props.matchedValues.length}
                </span>
            )}
            <Tooltip title={props.matchedValues.join(", ")}>
                <span>{props.value}</span>
            </Tooltip>
            <button
                type="button"
                className="WebvizAttributeSelector_ValueTag__RemoveButton"
                title="Remove"
                onClick={() => props.onRemove(props.value)}
            >
                x
            </button>
        </li>
    );
};
