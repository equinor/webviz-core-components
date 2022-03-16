import { ScrollArea } from "../../../ScrollArea";
import React from "react";

import "./settings.css";

export type SettingsProps = {
    visible: boolean;
    width: number;
    children?: React.ReactNode;
};

export const Settings: React.FC<SettingsProps> = (props: SettingsProps) => {
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
