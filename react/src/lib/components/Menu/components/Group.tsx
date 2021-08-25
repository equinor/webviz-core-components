import React from "react";
import PropTypes from "prop-types";
import { Icon } from "@equinor/eds-core-react";
import { arrow_drop_right, arrow_drop_down } from "@equinor/eds-icons";

Icon.add({ arrow_drop_down, arrow_drop_right });

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
                className="GroupHeader"
                onClick={() => setCollapsed(!collapsed)}
            >
                <div className="GroupTitle">{props.title}</div>
                <div>
                    <Icon
                        name={
                            collapsed ? "arrow_drop_right" : "arrow_drop_down"
                        }
                    />
                </div>
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
