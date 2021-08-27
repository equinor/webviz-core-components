import React from "react";
import PropTypes from "prop-types";

import "./Logo.css";

type LogoProps = {
    url: string;
    size: "small" | "large";
    homepage: string;
};

export const Logo: React.FC<LogoProps> = (props) => {
    return (
        <div className="Logo">
            <a href="">
                <img
                    src={props.url}
                    alt="Logo"
                    title="Back to landing page"
                    className={`LogoImage${
                        props.size.charAt(0).toUpperCase() +
                        props.size.substr(1)
                    }`}
                />
            </a>
        </div>
    );
};

Logo.propTypes = {
    url: PropTypes.string.isRequired,
    size: PropTypes.oneOf<"small" | "large">(["small", "large"]).isRequired,
    homepage: PropTypes.string.isRequired,
};
