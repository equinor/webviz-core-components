import React from "react";
import PropTypes from "prop-types";

import { Icon } from "../Icon";

import "./Section.css";

type SectionProps = {
    title: string;
    icon?: string;
    children?: React.ReactNode;
};

export const Section: React.FC<SectionProps> = (props) => {
    return (
        <div className="Menu__Section">
            <div className="Menu__SectionTitle">
                {props.icon && (
                    <Icon
                        className="Menu__Icon"
                        icon={props.icon}
                        active={false}
                    />
                )}
                {props.title}
            </div>
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
