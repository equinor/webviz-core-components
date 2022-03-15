import React from "react";
import { useStore } from "../WebvizContentManager/WebvizContentManager";

import "./webviz-plugin-wrapper.css";
import { StoreActions } from "../WebvizContentManager/WebvizContentManager";
import PropTypes from "prop-types";

export type WebvizPluginWrapperProps = {
    id: string;
    name: string;
    children?: React.ReactNode;
};

export const WebvizPluginWrapper: React.FC<WebvizPluginWrapperProps> = (
    props: WebvizPluginWrapperProps
) => {
    const store = useStore();
    const [active, setActive] = React.useState<boolean>(false);

    React.useLayoutEffect(() => {
        setActive(store.state.activePluginId === props.id);
    }, [store.state.activePluginId, props.id]);

    const handlePluginClick = React.useCallback(() => {
        store.dispatch({
            type: StoreActions.SetActivePlugin,
            payload: { pluginId: props.id },
        });
    }, [props.id]);

    return (
        <div
            className={`WebvizPluginWrapper${
                active ? " WebvizPluginWrapper__Active" : ""
            }`}
            onClick={() => handlePluginClick()}
        >
            {props.children}
        </div>
    );
};

WebvizPluginWrapper.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    children: PropTypes.node,
};
