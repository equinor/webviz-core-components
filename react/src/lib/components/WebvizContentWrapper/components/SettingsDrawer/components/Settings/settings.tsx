import { ScrollArea } from "../../../../../ScrollArea";
import React from "react";
import { useStore } from "../../../ContentManager";
import { SettingsGroup as SettingsGroupType } from "../../../../shared-types/webviz";
import { SettingsGroup } from "../SettingsGroup/settings-group";

import "./settings.css";

export type SettingsProps = {
    visible: boolean;
};

export const Settings: React.FC<SettingsProps> = (props: SettingsProps) => {
    const [activeGroup, setActiveGroup] = React.useState<string>("");
    const [settingsGroups, setSettingsGroups] = React.useState<
        SettingsGroupType[]
    >([]);
    const store = useStore();

    React.useEffect(() => {
        const settings: SettingsGroupType[] = [];

        const plugin = store.state.pluginsData.find(
            (plugin) => plugin.id === store.state.activePluginId
        );

        settings.push(
            ...(store.state.pluginsData.find(
                (plugin) => plugin.id === store.state.activePluginId
            )?.sharedSettings || [])
        );

        settings.push(
            ...(plugin?.views.find((view) => view.id === plugin.activeViewId)
                ?.settings || [])
        );

        setSettingsGroups(settings);
    }, [store.state.activePluginId, store.state.pluginsData]);

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
            style={{ opacity: props.visible ? 1 : 0 }}
        >
            <ScrollArea>
                {settingsGroups.map((group) => (
                    <SettingsGroup
                        key={group.id}
                        title={group.title}
                        open={activeGroup === group.id}
                        id={group.id}
                        onToggle={handleGroupToggle}
                    >
                        {group.content}
                    </SettingsGroup>
                ))}
            </ScrollArea>
        </div>
    );
};
