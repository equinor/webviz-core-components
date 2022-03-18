import React from "react";
import PropTypes from "prop-types";

import "./webviz-plugin-layout-column.css";

export type WebvizPluginLayoutColumnProps = {
    flexGrow?: number;
    children?: React.ReactNode;
};

export const WebvizPluginLayoutColumn: React.FC<WebvizPluginLayoutColumnProps> =
    (props) => {
        return (
            <div
                className="Webviz_PluginLayout__Column"
                style={{ flexGrow: props.flexGrow || 1 }}
            >
                {props.children}
            </div>
        );
    };

WebvizPluginLayoutColumn.propTypes = {
    flexGrow: PropTypes.number,
    children: PropTypes.node,
};
