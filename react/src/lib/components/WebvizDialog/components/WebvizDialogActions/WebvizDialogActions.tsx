import React from "react";
import PropTypes from "prop-types";

import "./webviz-dialog-actions.css";

export type WebvizDialogActionsProps = {
    id?: string;
};

export const WebvizDialogActions: React.FC<WebvizDialogActionsProps> = (
    props
) => {
    return (
        <div className="WebvizDialogActions" id={props.id}>
            {props.children}
        </div>
    );
};

WebvizDialogActions.propTypes = {
    id: PropTypes.string,
};
