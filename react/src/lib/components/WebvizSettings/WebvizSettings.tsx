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
    const store = useStore();

    React.useEffect(() => {
        if (store.state.openSettingsGroupIds.length !== 0) {
            return;
        }
    }, [props.children]);

    const handleGroupToggle = React.useCallback(
        (id: string) => {
            if (store.state.openSettingsGroupIds.includes(id)) {
                store.dispatch({
                    type: StoreActions.RemoveOpenSettingsGroupId,
                    payload: {
                        settingsGroupId: id,
                    },
                });
            } else {
                store.dispatch({
                    type: StoreActions.AddOpenSettingsGroupId,
                    payload: {
                        settingsGroupId: id,
                    },
                });
            }
        },
        [store.state]
    );

    return (
        <div
            className="WebvizSettings"
            style={{
                opacity: props.visible ? 1 : 0,
                width: props.width,
                pointerEvents: props.visible ? "all" : "none",
            }}
        >
            <ScrollArea noScrollbarPadding={true}>
                {props.children &&
                    React.Children.map(props.children, (child) => {
                        if (React.isValidElement(child)) {
                            return React.cloneElement(child, {
                                _dashprivate_layout: {
                                    ...child.props._dashprivate_layout,
                                    props: {
                                        ...child.props._dashprivate_layout
                                            .props,
                                        open: store.state.openSettingsGroupIds.includes(
                                            child.props._dashprivate_layout
                                                .props.id
                                        ),
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
