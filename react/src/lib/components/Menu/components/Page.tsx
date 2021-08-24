import React from "react";
import PropTypes from "prop-types";
import * as edsIcons from "@equinor/eds-icons";
import { IconData } from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";
import { checkIfUrlIsCurrent } from "../utils/check-url";

import "./Page.css";

type PageProps = {
    title: string;
    href: string;
    icon?: string;
};

export const Page: React.FC<PageProps> = (props) => {
    const active = checkIfUrlIsCurrent(props.href);

    let icon: IconData | undefined = undefined;
    if (props.icon) {
        Object.values(edsIcons).forEach(el => {
            if (el.name === props.icon) {
                icon = el;
            }
        });
    }

    return (
        <a className={`Page${active ? " CurrentPage" : ""}`} href={props.href}>
            {props.icon && <Icon className="Icon" data={icon} color={active ? "#FF1243" : "#989898"} />}
            {props.title}
        </a>
    );
};

Page.propTypes = {
    title: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    icon: PropTypes.string,
};
