import { Icon } from "@equinor/eds-core-react";
import { chevron_down, chevron_up, world } from "@equinor/eds-icons";
import { IconButton, Tooltip } from "@material-ui/core";
import useSize from "@react-hook/size";
import React from "react";

import "./webviz-settings-group.css";
import PropTypes from "prop-types";
import { useStore } from "../WebvizContentManager/WebvizContentManager";

Icon.add({ chevron_down, chevron_up, world });

export type WebvizSettingsGroupProps = {
    id: string;
    title: string;
    open?: boolean;
    viewId: string;
    visibleInViews?: string[];
    notVisibleInViews?: string[];
    pluginId: string;
    alwaysOpen?: boolean;
    children?: React.ReactNode;
    onToggle?: (id: string) => void;
};

export const WebvizSettingsGroup: React.FC<WebvizSettingsGroupProps> = (
    props
) => {
    const store = useStore();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const contentSize = useSize(contentRef);
    const [isCompletelyVisible, setIsCompletelyVisible] =
        React.useState<boolean>(
            (props.open !== undefined && props.open) ||
                (props.alwaysOpen !== undefined && props.alwaysOpen)
        );
    const completelyVisibleTimeoutRef =
        React.useRef<ReturnType<typeof setTimeout> | null>(null);

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

    React.useEffect(() => {
        return () => {
            if (completelyVisibleTimeoutRef.current) {
                clearTimeout(completelyVisibleTimeoutRef.current);
            }
        };
    }, []);

    React.useEffect(() => {
        if (props.alwaysOpen) {
            return;
        }
        if (completelyVisibleTimeoutRef.current) {
            clearTimeout(completelyVisibleTimeoutRef.current);
        }
        if (props.open) {
            completelyVisibleTimeoutRef.current = setTimeout(
                () => setIsCompletelyVisible(true),
                500
            );
        } else {
            setIsCompletelyVisible(false);
        }
    }, [props.open, props.alwaysOpen]);

    const makeTitle = React.useCallback(
        (children: React.ReactElement): React.ReactElement => {
            if (props.alwaysOpen) {
                return children;
            }
            return (
                <Tooltip
                    title={`${props.open ? "Close" : "Open"} settings group '${
                        props.title
                    }`}
                >
                    {children}
                </Tooltip>
            );
        },
        [props.open, props.title, props.alwaysOpen]
    );

    return (
        <div
            className="WebvizSettingsGroup"
            style={{ display: visible ? "block" : "none" }}
        >
            {makeTitle(
                <div
                    className={
                        props.alwaysOpen
                            ? "WebvizSettingsGroup__Label"
                            : "WebvizSettingsGroup__Title"
                    }
                    onClick={() => props.onToggle && props.onToggle(props.id)}
                >
                    {props.viewId === "" && (
                        <div className="WebvizSettingsGroup__GlobalIcon">
                            <Icon
                                name="world"
                                title="Global settings group"
                                size={16}
                            />
                        </div>
                    )}
                    <div className="WebvizSettingsGroup__TitleText">
                        {props.title}
                    </div>
                    {!props.alwaysOpen && (
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
                    )}
                </div>
            )}
            <div
                className={
                    props.alwaysOpen
                        ? "WebvizSettingsGroup__FlatContent"
                        : "WebvizSettingsGroup__Content"
                }
                style={{
                    height: props.open || props.alwaysOpen ? contentSize[1] : 0,
                    overflow:
                        isCompletelyVisible || props.alwaysOpen ? "" : "hidden",
                }}
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
    alwaysOpen: PropTypes.bool,
    children: PropTypes.node,
    onToggle: PropTypes.func,
};
