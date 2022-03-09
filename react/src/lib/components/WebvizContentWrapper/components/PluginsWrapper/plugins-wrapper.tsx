import React from "react";
import { useStore } from "../ContentManager/content-manager";
import { PluginWrapper } from "./components/PluginWrapper";

export const PluginsWrapper: React.FC = () => {
    const store = useStore();
    return (
        <>
            {store.state.pluginsData.map((plugin) => (
                <PluginWrapper
                    id={plugin.id}
                    name={plugin.name}
                    key={plugin.id}
                />
            ))}
        </>
    );
};
