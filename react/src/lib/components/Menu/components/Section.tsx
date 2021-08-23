import React from "react";
import PropTypes from "prop-types";

import "./Section.css";

type SectionProps = {
    title: string;
    icon?: string;
    children?: React.ReactNode;
};

export const Section: React.FC<SectionProps> = (props) => {
    return (
        <div className="Section">
            <div className="SectionTitle">{props.title}</div>
            {props.children}
        </div>
    );
};

Section.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
};
