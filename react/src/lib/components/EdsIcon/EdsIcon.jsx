import React from "react";
import PropTypes from "prop-types";
import { EdsIcon as EdsIconComponent } from "./components/EdsIcon";

export const EdsIcon = (props) => {
    return <EdsIconComponent {...props} />;
};

EdsIcon.propTypes = {
    icon: PropTypes.string.isRequired,
    size: PropTypes.oneOf([16, 24, 32, 40, 48]),
    color: PropTypes.string,
};
