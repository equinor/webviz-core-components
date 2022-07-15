import React from "react";

import "./collapse-expand-button.css";

export type CollapseExpandButtonProps = {
    onToggle: (expanded: boolean) => void;
    expanded: boolean;
};

export const CollapseExpandButton: React.FC<CollapseExpandButtonProps> = (
    props
) => {
    return (
        <div
            className={`WebvizAttributesSelector__CollapseExpandButton ${
                props.expanded
                    ? "WebvizAttributesSelector__CollapseExpandButton__collapse"
                    : "WebvizAttributesSelector__CollapseExpandButton__expand"
            }`}
            onClick={() => props.onToggle(!props.expanded)}
        >
            Keep options open
        </div>
    );
};
