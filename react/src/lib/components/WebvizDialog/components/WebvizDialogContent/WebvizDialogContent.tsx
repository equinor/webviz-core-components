import React from "react";
import PropTypes from "prop-types";

import "./webviz-dialog-content.css";

export type WebvizDialogContentProps = {
    id?: string;
};

export const WebvizDialogContent: React.FC<WebvizDialogContentProps> = (
    props
) => {
    return (
        <div className="WebvizDialogContent" id={props.id}>
            {props.children}
        </div>
    );
};

WebvizDialogContent.propTypes = {
    id: PropTypes.string,
};
