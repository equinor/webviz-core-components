import React from "react";
import PropTypes from "prop-types";

import { Icon } from "./Icon";
import { checkIfUrlIsCurrent } from "../utils/check-url";

import "./Page.css";

type PageProps = {
    title: string;
    href: string;
    icon?: string;
};

export const Page: React.FC<PageProps> = (props) => {
    const active = checkIfUrlIsCurrent(props.href);

    return (
        <a className={`Page${active ? " CurrentPage" : ""}`} href={props.href}>
            {props.icon && (
                <Icon className="Icon" icon={props.icon} active={active} />
            )}
            {props.title}
        </a>
    );
};

Page.propTypes = {
    title: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    icon: PropTypes.string,
};
