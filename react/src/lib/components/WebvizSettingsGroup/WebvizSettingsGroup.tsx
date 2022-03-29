import { Icon } from "@equinor/eds-core-react";
import { chevron_down, chevron_up } from "@equinor/eds-icons";
import { IconButton } from "@material-ui/core";
import useSize from "@react-hook/size";
import React from "react";

import "./webviz-settings-group.css";
import PropTypes from "prop-types";
import { useStore } from "../WebvizContentManager/WebvizContentManager";

Icon.add({ chevron_down, chevron_up });

export type WebvizSettingsGroupProps = {
    id: string;
    title: string;
    open?: boolean;
    viewId: string;
    visibleInViews?: string[];
    notVisibleInViews?: string[];
    pluginId: string;
    children?: React.ReactNode;
    onToggle?: (id: string) => void;
};

export const WebvizSettingsGroup: React.FC<WebvizSettingsGroupProps> = (
    props
) => {
    const store = useStore();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const contentSize = useSize(contentRef);

    const activePlugin = store.state.pluginsData.find(
        (plugin) => plugin.id === store.state.activePluginId
    );

    let visible = true;

    // Is this settings group part of the current plugin?
    if (
        props.pluginId !== store.state.activePluginId &&
        props.pluginId !== ""
    ) {
        visible = false;
    }

    // Is the currently active plugin defined?

    if (visible && activePlugin === undefined) {
        visible = false;
    }

    // Is this settings group part of the current view or is it a shared setting?
    if (
        visible &&
        activePlugin &&
        ((activePlugin.activeViewId !== props.viewId && props.viewId !== "") ||
            (props.visibleInViews &&
                !props.visibleInViews.includes(activePlugin.activeViewId)) ||
            (props.notVisibleInViews &&
                props.notVisibleInViews.includes(activePlugin.activeViewId)))
    ) {
        visible = false;
    }

    return (
        <div
            className="WebvizSettingsGroup"
            style={{ display: visible ? "block" : "none" }}
        >
            <div
                className="WebvizSettingsGroup__Title"
                onClick={() => props.onToggle && props.onToggle(props.id)}
            >
                <div className="WebvizSettingsGroup__TitleText">
                    {props.title}
                </div>
                <div>
                    <IconButton>
                        <Icon
                            name={
                                props.open === true
                                    ? "chevron_up"
                                    : "chevron_down"
                            }
                        />
                    </IconButton>
                </div>
            </div>
            <div
                className="WebvizSettingsGroup__Content"
                style={{ height: props.open === true ? contentSize[1] : 0 }}
            >
                <div ref={contentRef}>{props.children}</div>
            </div>
        </div>
    );
};

WebvizSettingsGroup.propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    open: PropTypes.bool,
    viewId: PropTypes.string.isRequired,
    pluginId: PropTypes.string.isRequired,
    visibleInViews: PropTypes.arrayOf(PropTypes.string.isRequired),
    notVisibleInViews: PropTypes.arrayOf(PropTypes.string.isRequired),
    children: PropTypes.node,
    onToggle: PropTypes.func,
};
