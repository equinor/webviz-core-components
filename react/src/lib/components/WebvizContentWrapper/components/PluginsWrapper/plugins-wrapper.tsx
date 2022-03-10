import React from "react";
import { useStore } from "../ContentManager/content-manager";
import { PluginWrapper } from "./components/PluginWrapper";
import { Snackbar, Slide } from "@material-ui/core";

import "./plugins-wrapper.css";

export const PluginsWrapper: React.FC = () => {
    const store = useStore();
    const [notificationVisible, setNotificationVisible] =
        React.useState<boolean>(false);
    const [activePluginId, setActivePluginId] = React.useState<string>(
        store.state.activePluginId
    );

    const notificationTimer =
        React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        return () => {
            if (notificationTimer.current) {
                clearTimeout(notificationTimer.current);
            }
        };
    }, []);

    React.useEffect(() => {
        if (activePluginId !== store.state.activePluginId) {
            if (notificationTimer.current) {
                clearTimeout(notificationTimer.current);
            }
            notificationTimer.current = setTimeout(() => {
                setNotificationVisible(false);
            }, 2000);
            setNotificationVisible(true);
            setActivePluginId(store.state.activePluginId);
        }
    }, [store.state.activePluginId, activePluginId]);

    return (
        <div className="WebvizPluginsWrapper">
            <Snackbar
                open={notificationVisible}
                anchorOrigin={{ horizontal: "center", vertical: "top" }}
                TransitionComponent={Slide}
            >
                <div className="WebvizPluginsWrapper__Notification">{`Now active: ${
                    store.state.pluginsData.find(
                        (plugin) => plugin.id === store.state.activePluginId
                    )?.name || "Unknown"
                }`}</div>
            </Snackbar>
            {store.state.pluginsData.map((plugin) => (
                <PluginWrapper
                    id={plugin.id}
                    name={plugin.name}
                    key={plugin.id}
                />
            ))}
        </div>
    );
};
