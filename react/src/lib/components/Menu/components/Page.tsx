import React from "react";
import PropTypes from "prop-types";
import * as edsIcons from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";

import "./Page.css";

type PageProps = {
    title: string;
    href: string;
    icon?: string;
};

export const Page: React.FC<PageProps> = (props) => {
    const active = window.location.href === props.href;

    if (props.icon) {
        for (const property of edsIcons) {
            Icon.add(property);
        }
    }

    return (
        <a className={`Page${active ? " CurrentPage" : ""}`} href={props.href}>
            {props.icon && <Icon name={props.icon} color="#989898" />}
            {props.title}
        </a>
    );
};

Page.propTypes = {
    title: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    icon: PropTypes.string,
};
