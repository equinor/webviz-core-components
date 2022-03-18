import React from "react";
import PropTypes from "prop-types";

import "./webviz-plugin-layout-row.css";

export type WebvizPluginLayoutRowProps = {
    flexGrow?: number;
    children?: React.ReactNode;
};

export const WebvizPluginLayoutRow: React.FC<WebvizPluginLayoutRowProps> = (
    props
) => {
    return (
        <div
            className="Webviz_PluginLayout__Row"
            style={{ flexGrow: props.flexGrow || 1 }}
        >
            {props.children}
        </div>
    );
};

WebvizPluginLayoutRow.propTypes = {
    flexGrow: PropTypes.number,
    children: PropTypes.node,
};
