import React from "react";
import PropTypes from "prop-types";

import "./webviz-plugin-loading-indicator.css";

export type WebvizPluginLoadingIndicatorProps = {
    id?: string;
};

export const WebvizPluginLoadingIndicator: React.FC<WebvizPluginLoadingIndicatorProps> =
    (props) => {
        return <div id={props.id} className="WebvizPluginLoadingIndicator" />;
    };

WebvizPluginLoadingIndicator.propTypes = {
    id: PropTypes.string,
};
