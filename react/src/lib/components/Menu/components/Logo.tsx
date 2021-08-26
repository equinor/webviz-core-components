import React from "react";
import PropTypes from "prop-types";

import "./Logo.css";

type LogoProps = {
    url: string;
    size: "small" | "large";
};

export const Logo: React.FC<LogoProps> = (props) => {
    return (
        <div
            className={`Logo Logo${props.size
                .charAt(0)
                .toUpperCase()}${props.size.substring(1)}`}
            style={{ backgroundImage: `url(${props.url})` }}
        ></div>
    );
};

Logo.propTypes = {
    url: PropTypes.string.isRequired,
    size: PropTypes.oneOf<"small" | "large">(["small", "large"]).isRequired,
};
