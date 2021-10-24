import React from "react";
import PropTypes from "prop-types";
import { Icon as EdsIcon } from "@equinor/eds-core-react";
import { arrow_drop_right, arrow_drop_down } from "@equinor/eds-icons";

import { Icon } from "../Icon";

EdsIcon.add({ arrow_drop_down, arrow_drop_right });

import "./Group.css";

type GroupProps = {
    id: string;
    title: string;
    level: number;
    icon?: string;
    applyIconIndentation: boolean;
    forceOpen?: boolean;
    initiallyCollapsed?: boolean;
    children?: React.ReactNode;
};

export const Group: React.FC<GroupProps> = (props) => {
    const [collapsed, setCollapsed] = React.useState<boolean>(
        localStorage.getItem(`${props.id}-${props.title}`) === "true" ||
            props.initiallyCollapsed ||
            false
    );

    React.useEffect(() => {
        localStorage.setItem(
            `${props.id}-${props.title}`,
            collapsed ? "true" : "false"
        );
    }, [collapsed]);

    return (
        <div className="Menu__Group">
            <div
                className="Menu__GroupHeader"
                onClick={() => {
                    if (!props.forceOpen) {
                        setCollapsed(!collapsed);
                    }
                }}
            >
                <div
                    className="Menu__GroupTitle Menu__Item"
                    style={{ paddingLeft: 16 * props.level }}
                >
                    {props.icon && (
                        <Icon className="Menu__Icon" icon={props.icon} />
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
                <div
                    className={props.forceOpen ? "Menu__disabled" : ""}
                    title={
                        props.forceOpen
                            ? "Clear filter first to enable group collapse."
                            : collapsed
                            ? "Open group"
                            : "Collapse group"
                    }
                >
                    <EdsIcon
                        name={
                            !collapsed || props.forceOpen
                                ? "arrow_drop_down"
                                : "arrow_drop_right"
                        }
                        color={props.forceOpen ? "#ccc" : "currentColor"}
                    />
                </div>
            </div>
            <div
                className="Menu__GroupContent"
                style={{
                    display: !collapsed || props.forceOpen ? "block" : "none",
                }}
            >
                {props.children}
            </div>
        </div>
    );
};

Group.propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    level: PropTypes.number.isRequired,
    icon: PropTypes.string,
    applyIconIndentation: PropTypes.bool.isRequired,
    forceOpen: PropTypes.bool,
    initiallyCollapsed: PropTypes.bool,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
};
