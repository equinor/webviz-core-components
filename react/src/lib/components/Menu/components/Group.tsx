import React from "react";
import PropTypes from "prop-types";

import "./Group.css";

type GroupProps = {
    title: string;
    icon?: string;
    children?: React.ReactNode;
};

export const Group: React.FC<GroupProps> = (props) => {
    const [collapsed, setCollapsed] = React.useState<boolean>(true);
    return (
        <div className="Group">
            <div
                className="GroupTitle"
                onClick={() => setCollapsed(!collapsed)}
            >
                {props.title}
            </div>
            <div
                className="GroupContent"
                style={{ display: collapsed ? "none" : "block" }}
            >
                {props.children}
            </div>
        </div>
    );
};

Group.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
};
