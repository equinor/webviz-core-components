import React from "react";
import PropTypes from "prop-types";

import { useStore } from "../../Menu";

import "./Logo.css";

type LogoProps = {
    size: "small" | "large";
};

export const Logo: React.FC<LogoProps> = (props) => {
    const store = useStore();

    const handleLogoClick = () => {
        window.history.pushState({}, "", store.homepage || store.firstPageHref);
        window.dispatchEvent(new CustomEvent("_dashprivate_pushstate"));
        window.scrollTo(0, 0);
    };
    return (
        <div
            className={`Menu__Logo${
                props.size.charAt(0).toUpperCase() + props.size.substr(1)
            }`}
        >
            <a
                href={store.homepage}
                id={`Logo${
                    props.size.charAt(0).toUpperCase() + props.size.substring(1)
                }`}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    handleLogoClick();
                    e.preventDefault();
                }}
            ></a>
        </div>
    );
};

Logo.propTypes = {
    size: PropTypes.oneOf<"small" | "large">(["small", "large"]).isRequired,
};
