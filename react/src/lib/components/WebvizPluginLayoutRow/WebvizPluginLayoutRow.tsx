import React from "react";
import PropTypes from "prop-types";

import "./webviz-plugin-layout-row.css";

export type WebvizPluginLayoutRowProps = {
    id: string;
    hidden?: boolean;
    flexGrow?: number;
    children?: React.ReactNode;
};

export const WebvizPluginLayoutRow: React.FC<WebvizPluginLayoutRowProps> = (
    props
) => {
    return (
        <div
            id={props.id}
            className="Webviz_PluginLayout__Row"
            style={{
                flexGrow: props.flexGrow || 1,
                display: props.hidden ? "none" : "flex",
            }}
        >
            {props.children}
        </div>
    );
};

WebvizPluginLayoutRow.propTypes = {
    id: PropTypes.string.isRequired,
    hidden: PropTypes.bool,
    flexGrow: PropTypes.number,
    children: PropTypes.node,
};
