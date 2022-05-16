import React from "react";
import PropTypes from "prop-types";

import "./webviz-plugin-layout-column.css";

export type WebvizPluginLayoutColumnProps = {
    id: string;
    hidden?: boolean;
    flexGrow?: number;
    children?: React.ReactNode;
};

export const WebvizPluginLayoutColumn: React.FC<WebvizPluginLayoutColumnProps> =
    (props) => {
        return (
            <div
                className="Webviz_PluginLayout__Column"
                style={{
                    flexGrow: props.flexGrow || 1,
                    display: props.hidden ? "none" : "flex",
                }}
            >
                {props.children}
            </div>
        );
    };

WebvizPluginLayoutColumn.propTypes = {
    id: PropTypes.string.isRequired,
    hidden: PropTypes.bool,
    flexGrow: PropTypes.number,
    children: PropTypes.node,
};
