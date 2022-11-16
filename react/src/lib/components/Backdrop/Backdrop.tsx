import React from "react";
import PropTypes from "prop-types";

import "./backdrop.css";

export type BackdropProps = {
    opacity: number;
    onClick?: () => void;
};

export const Backdrop: React.FC<BackdropProps> = (props: BackdropProps) => {
    const handleClick = React.useCallback(() => {
        if (props.onClick !== undefined) {
            props.onClick();
        }
    }, [props.onClick]);
    return (
        <div
            className="Webviz__Backdrop"
            onClick={() => handleClick()}
            style={{
                opacity: props.opacity,
                display: props.opacity === 0 ? "none" : "block",
            }}
        ></div>
    );
};

Backdrop.propTypes = {
    opacity: PropTypes.number.isRequired,
};
