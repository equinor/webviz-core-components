import React from "react";
import PropTypes from "prop-types";

import "./Logo.css";

type LogoProps = {
    size: "small" | "large";
    homepage: string;
    onClick: (url: string) => void;
};

export const Logo: React.FC<LogoProps> = (props) => {
    return (
        <div
            className={`Menu__Logo${
                props.size.charAt(0).toUpperCase() + props.size.substr(1)
            }`}
        >
            <a
                href={props.homepage}
                id={`Logo${
                    props.size.charAt(0).toUpperCase() + props.size.substr(1)
                }`}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    props.onClick(props.homepage);
                    e.preventDefault();
                }}
            ></a>
        </div>
    );
};

Logo.propTypes = {
    size: PropTypes.oneOf<"small" | "large">(["small", "large"]).isRequired,
    homepage: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
};
