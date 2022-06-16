import React from "react";
import PropTypes from "prop-types";

import "./backdrop.css";

export type BackdropProps = {
    opacity: number;
};

export const Backdrop: React.FC<BackdropProps> = (props: BackdropProps) => {
    return (
        <div
            className="Webviz__Backdrop"
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
