import React from "react";
import PropTypes from "prop-types";
import { Icon as EdsIcon } from "@equinor/eds-core-react";
import { arrow_drop_right, arrow_drop_down } from "@equinor/eds-icons";

import { Icon } from "../Icon";

EdsIcon.add({ arrow_drop_down, arrow_drop_right });

import "./Group.css";

type GroupProps = {
    title: string;
    level: number;
    icon?: string;
    open?: boolean;
    children?: React.ReactNode;
};

export const Group: React.FC<GroupProps> = (props) => {
    const [collapsed, setCollapsed] = React.useState<boolean>(
        !props.open || false
    );

    return (
        <div className="Group" style={{ paddingLeft: 16 * props.level }}>
            <div
                className="GroupHeader"
                onClick={() => setCollapsed(!collapsed)}
            >
                <div className="GroupTitle">
                    {props.icon && <Icon className="Icon" icon={props.icon} />}
                    {props.title}
                </div>
                <div>
                    <EdsIcon
                        name={
                            collapsed && !props.open
                                ? "arrow_drop_right"
                                : "arrow_drop_down"
                        }
                    />
                </div>
            </div>
            <div
                className="GroupContent"
                style={{ display: collapsed && !props.open ? "none" : "block" }}
            >
                {props.children}
            </div>
        </div>
    );
};

Group.propTypes = {
    title: PropTypes.string.isRequired,
    level: PropTypes.number.isRequired,
    icon: PropTypes.string,
    open: PropTypes.bool,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
};
