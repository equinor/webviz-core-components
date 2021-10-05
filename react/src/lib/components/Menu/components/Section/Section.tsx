import React from "react";
import PropTypes from "prop-types";

import { Icon } from "../Icon";

import "./Section.css";

type SectionProps = {
    title: string;
    icon?: string;
    applyIconIndentation: boolean;
    children?: React.ReactNode;
};

export const Section: React.FC<SectionProps> = (props) => {
    return (
        <div className="Menu__Section">
            <div className="Menu__SectionTitle Menu__Item">
                {props.icon && (
                    <Icon
                        className="Menu__Icon"
                        icon={props.icon}
                        active={false}
                    />
                )}
                <span
                    className={
                        props.icon
                            ? "Icon"
                            : props.applyIconIndentation
                            ? "IconPlaceholder"
                            : ""
                    }
                >
                    {props.title}
                </span>
            </div>
            {props.children}
        </div>
    );
};

Section.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.string,
    applyIconIndentation: PropTypes.bool.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
};
