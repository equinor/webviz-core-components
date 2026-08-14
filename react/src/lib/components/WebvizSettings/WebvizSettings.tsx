import React from "react";
import PropTypes from "prop-types";

import { ScrollArea } from "../ScrollArea";

import {
    useStore,
    StoreActions,
} from "../WebvizContentManager/WebvizContentManager";

import "./webviz-settings.css";

type DashChildProps = {
    id?: string;
    componentPath?: Array<string | number>;
    onToggle?: (id: string) => void;
};

export type WebvizSettingsProps = {
    visible: boolean;
    width: number;
    children?: React.ReactNode;
};

export const WebvizSettings: React.FC<WebvizSettingsProps> = (
    props: WebvizSettingsProps
) => {
    const store = useStore();

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
        [store]
    );

    React.useEffect(() => {
        React.Children.forEach(props.children, (child) => {
            if (!React.isValidElement<DashChildProps>(child)) {
                return;
            }

            const { componentPath, id } = child.props;

            if (!componentPath || !id) {
                return;
            }

            window.dash_clientside.set_props(componentPath, {
                open: store.state.openSettingsGroupIds.includes(id),
            });
        });
    }, [props.children, store.state.openSettingsGroupIds]);

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
                        if (!React.isValidElement<DashChildProps>(child)) {
                            return child;
                        }

                        return React.cloneElement(child, {
                            onToggle: handleGroupToggle,
                        });
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
