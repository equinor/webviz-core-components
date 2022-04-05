import React from "react";
import PropTypes from "prop-types";

import { ScrollArea } from "../ScrollArea";

import {
    useStore,
    StoreActions,
} from "../WebvizContentManager/WebvizContentManager";

import "./webviz-settings.css";

export type WebvizSettingsProps = {
    visible: boolean;
    width: number;
    children?: React.ReactNode;
};

export const WebvizSettings: React.FC<WebvizSettingsProps> = (
    props: WebvizSettingsProps
) => {
    const [activeGroupId, setActiveGroupId] = React.useState<string>("");
    const store = useStore();

    React.useEffect(() => {
        if (store.state.openSettingsGroupId !== activeGroupId) {
            setActiveGroupId(store.state.openSettingsGroupId);
        }
    }, [store.state.openSettingsGroupId]);

    const handleGroupToggle = React.useCallback(
        (id: string) => {
            const groupId = id === activeGroupId ? "" : id;
            store.dispatch({
                type: StoreActions.SetOpenSettingsGroupId,
                payload: {
                    settingsGroupId: groupId,
                },
            });
            setActiveGroupId(groupId);
        },
        [activeGroupId]
    );

    return (
        <div
            className="WebvizSettings"
            style={{ opacity: props.visible ? 1 : 0, width: props.width }}
        >
            <ScrollArea>
                {props.children &&
                    React.Children.map(props.children, (child, index) => {
                        if (React.isValidElement(child)) {
                            return React.cloneElement(child, {
                                _dashprivate_layout: {
                                    ...child.props._dashprivate_layout,
                                    props: {
                                        ...child.props._dashprivate_layout
                                            .props,
                                        open:
                                            activeGroupId ===
                                                child.props._dashprivate_layout
                                                    .props.id ||
                                            (activeGroupId === "" &&
                                                index === 0),
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
