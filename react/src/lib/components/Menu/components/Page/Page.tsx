import React from "react";
import PropTypes from "prop-types";

import { Icon } from "../Icon";
import { checkIfUrlIsCurrent } from "../../utils/check-url";

import "./Page.css";

type PageProps = {
    title: string;
    href: string;
    level: number;
    icon?: string;
    applyIconIndentation: boolean;
    onClick: () => void;
};

export const Page: React.FC<PageProps> = (props) => {
    const active = checkIfUrlIsCurrent(props.href);

    return (
        <a
            className={`Menu__Page${
                active ? " Menu__CurrentPage" : ""
            } Menu__Item`}
            href={props.href}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                props.onClick();
                e.preventDefault();
            }}
            style={{ paddingLeft: 16 * props.level }}
        >
            {props.icon && (
                <Icon
                    className="Menu__Icon"
                    icon={props.icon}
                    active={active}
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
        </a>
    );
};

Page.propTypes = {
    title: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    level: PropTypes.number.isRequired,
    icon: PropTypes.string,
    applyIconIndentation: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
};
