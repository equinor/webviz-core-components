import React from "react";
import useSize from "@react-hook/size";
import { settings, chevron_right, chevron_left } from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";
Icon.add({ settings, chevron_right, chevron_left });

import { Button, Tooltip } from "@material-ui/core";

import { DrawerPosition } from "../../shared-types/webviz-content/drawer-position";

import { useStore } from "../WebvizContentManager";
import { ViewSelector } from "./components/ViewSelector/view-selector";

import { WebvizSettings } from "../WebvizSettings";
import { PluginActions } from "./components/PluginActions/plugin-actions";

import { SnackbarProvider } from "notistack";

import PropTypes from "prop-types";

import "./webviz-settings-drawer.css";
import { StoreActions } from "../WebvizContentManager/WebvizContentManager";

type Position = {
    left: number | "auto";
    top: number | "auto";
    right: number | "auto";
    bottom: number | "auto";
};

export type WebvizSettingsDrawerProps = {
    id: string;
    children?: React.ReactNode;
};

export const WebvizSettingsDrawer: React.FC<WebvizSettingsDrawerProps> = (
    props
) => {
    const [position, setPosition] = React.useState<Position>({
        left: "auto",
        top: "auto",
        right: "auto",
        bottom: "auto",
    });
    const store = useStore();
    const drawerRef = React.useRef<HTMLDivElement>(null);
    const drawerSize = useSize(drawerRef);
    const [oldDrawerSize, setOldDrawerSize] = React.useState<number>(0);
    const expandedWidth = 320;
    const collapsedWidth = 64;

    React.useLayoutEffect(() => {
        if (drawerRef.current && store.state.externalTrigger) {
            drawerRef.current.classList.remove(
                "WebvizSettingsDrawer__Transition"
            );
            window.setTimeout(() => {
                if (drawerRef.current) {
                    drawerRef.current.classList.add(
                        "WebvizSettingsDrawer__Transition"
                    );
                }
            }, 1000);
        }
    }, [store.state.settingsDrawerOpen, store.state.externalTrigger]);

    React.useLayoutEffect(() => {
        let top: "auto" | number = 0;
        let bottom: "auto" | number = "auto";
        let left: "auto" | number = "auto";
        let right: "auto" | number = "auto";

        if (store.state.bodyMargins.top > 16) {
            top = store.state.bodyMargins.top - 50;
        } else if (store.state.bodyMargins.bottom > 16) {
            top = "auto";
            bottom = store.state.bodyMargins.bottom - 50;
        }
        if (store.state.position === DrawerPosition.Left) {
            left = Math.max(store.state.bodyMargins.left - 50, 0);
        } else if (store.state.position === DrawerPosition.Right) {
            right = Math.max(store.state.bodyMargins.right - 50, 0);
        }
        setPosition({
            left: left,
            top: top,
            right: right,
            bottom: bottom,
        });
    }, [store.state.bodyMargins, store.state.position]);

    React.useLayoutEffect(() => {
        const bodyMargins = { ...store.state.bodyMargins };
        if (store.state.position === DrawerPosition.Left) {
            bodyMargins.left = bodyMargins.left - 50 + drawerSize[0];
            bodyMargins.right = 0;
        } else if (store.state.position === DrawerPosition.Right) {
            bodyMargins.left = 0;
            bodyMargins.right = bodyMargins.right - 50 + drawerSize[0];
        }
        document.body.style.marginLeft = bodyMargins.left + "px";
        document.body.style.marginRight = bodyMargins.right + "px";
        document.body.style.marginTop = "0px";
        document.body.style.marginBottom = "0px";
        setOldDrawerSize(drawerSize[0]);
    }, [
        drawerSize,
        store.state.position,
        store.state.bodyMargins,
        oldDrawerSize,
    ]);

    const handleToggleOpenClick = React.useCallback(() => {
        store.dispatch({
            type: StoreActions.SetSettingsDrawerOpen,
            payload: {
                settingsDrawerOpen: !store.state.settingsDrawerOpen,
                externalTrigger: false,
            },
        });
    }, [store]);

    return (
        <div
            id={props.id}
            ref={drawerRef}
            className={`WebvizSettingsDrawer WebvizSettingsDrawer__Transition WebvizSettingsDrawer__${
                store.state.position.charAt(0).toUpperCase() +
                store.state.position.slice(1)
            }`}
            style={{
                width:
                    store.state.settingsDrawerOpen &&
                    React.Children.count(props.children) > 0
                        ? expandedWidth
                        : collapsedWidth,
                left: position.left,
                top: position.top,
                right: position.right,
                bottom: position.bottom,
                height: `calc(100vh - ${
                    position.top !== "auto"
                        ? position.top
                        : position.bottom !== "auto"
                        ? position.bottom
                        : 0
                }px)`,
            }}
        >
            {React.Children.count(props.children) > 0 && (
                <div className="WebvizSettingsDrawer__TopButtons">
                    <Tooltip
                        title={
                            store.state.settingsDrawerOpen
                                ? "Close settings drawer"
                                : "Open settings drawer"
                        }
                    >
                        <Button
                            className={`WebvizSettingsDrawer__Toggle ${
                                !store.state.settingsDrawerOpen
                                    ? "WebvizSettingsDrawer__ToggleOpen"
                                    : "WebvizSettingsDrawer__ToggleClose"
                            }`}
                            onClick={() => handleToggleOpenClick()}
                        >
                            <Icon name="chevron_left" />
                            <Icon name="settings" />
                        </Button>
                    </Tooltip>
                </div>
            )}
            <ViewSelector
                open={
                    store.state.settingsDrawerOpen &&
                    React.Children.count(props.children) > 0
                }
                width={expandedWidth}
            />
            <WebvizSettings
                visible={
                    store.state.settingsDrawerOpen &&
                    React.Children.count(props.children) > 0
                }
                width={expandedWidth}
            >
                {props.children}
            </WebvizSettings>
            <SnackbarProvider maxSnack={3}>
                <PluginActions
                    open={
                        store.state.settingsDrawerOpen &&
                        React.Children.count(props.children) > 0
                    }
                />
            </SnackbarProvider>
        </div>
    );
};

WebvizSettingsDrawer.propTypes = {
    id: PropTypes.string.isRequired,
    children: PropTypes.node,
};
