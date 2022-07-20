import React from "react";

import "./value-tag.css";

export type ValueTagProps = {
    value: string;
    onRemove: (value: string) => void;
};

export const ValueTag: React.FC<ValueTagProps> = (props) => {
    return (
        <li className="WebvizAttributeSelector_ValueTag">
            {props.value}
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
