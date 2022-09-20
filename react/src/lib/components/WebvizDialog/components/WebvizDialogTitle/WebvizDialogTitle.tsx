import React from "react";
import PropTypes from "prop-types";

import { IconButton } from "@material-ui/core";

import "./webviz-dialog-title.css";

import { Icon } from "@equinor/eds-core-react";
import { close } from "@equinor/eds-icons";

Icon.add({ close });

export type WebvizDialogTitleProps = {
    id?: string;
    onClose?: () => void;
    onClick?: () => void;
};

export const WebvizDialogTitle: React.FC<WebvizDialogTitleProps> = (props) => {
    const handleCloseClick = React.useCallback(() => {
        if (props.onClose) {
            props.onClose();
        }
    }, [props.onClose]);

    const handleTitleClick = React.useCallback(() => {
        if (props.onClick) {
            props.onClick();
        }
    }, [props.onClick]);

    return (
        <div
            className="WebvizDialogTitle"
            id={props.id}
            onClick={() => handleTitleClick()}
        >
            {props.children}
            {props.onClose && (
                <IconButton
                    aria-label="close"
                    onClick={() => handleCloseClick()}
                    style={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        // color: "#ccc",
                    }}
                >
                    <Icon name="close" />
                </IconButton>
            )}
        </div>
    );
};

WebvizDialogTitle.propTypes = {
    id: PropTypes.string,
    onClose: PropTypes.func,
    onClick: PropTypes.func,
};
