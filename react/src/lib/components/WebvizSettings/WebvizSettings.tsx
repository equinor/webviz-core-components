import React from "react";
import PropTypes from "prop-types";

import { ScrollArea } from "../ScrollArea";

import "./webviz-settings.css";

export type WebvizSettingsProps = {
    visible: boolean;
    width: number;
    children?: React.ReactNode;
};

export const WebvizSettings: React.FC<WebvizSettingsProps> = (
    props: WebvizSettingsProps
) => {
    const [activeGroup, setActiveGroup] = React.useState<string>("");

    const handleGroupToggle = React.useCallback(
        (id: string) => {
            if (activeGroup === id) {
                setActiveGroup("");
                return;
            }
            setActiveGroup(id);
        },
        [activeGroup]
    );

    return (
        <div
            className="WebvizSettings"
            style={{ opacity: props.visible ? 1 : 0, width: props.width }}
        >
            <ScrollArea>
                {props.children &&
                    React.Children.map(props.children, (child) => {
                        if (React.isValidElement(child)) {
                            return React.cloneElement(child, {
                                _dashprivate_layout: {
                                    ...child.props._dashprivate_layout,
                                    props: {
                                        ...child.props._dashprivate_layout
                                            .props,
                                        open:
                                            activeGroup ===
                                            child.props._dashprivate_layout
                                                .props.id,
                                        onToggle: handleGroupToggle,
                                    },
                                },
                            });
                        }
                        return child;
                    })}
            </ScrollArea>
        </div>
    );
};

WebvizSettings.propTypes = {
    visible: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
    children: PropTypes.node,
};
