import React from "react";
import {
    useStore,
    ViewElement as ViewElementType,
} from "../../../ContentManager/content-manager";
import { ViewElement } from "../ViewElement";

import "./plugin-wrapper.css";
import { StoreActions } from "../../../ContentManager/content-manager";

export type PluginWrapperProps = {
    id: string;
    name: string;
};

export const PluginWrapper: React.FC<PluginWrapperProps> = (
    props: PluginWrapperProps
) => {
    const store = useStore();
    const [active, setActive] = React.useState<boolean>(false);
    const [viewElements, setViewElements] = React.useState<ViewElementType[]>(
        []
    );

    React.useLayoutEffect(() => {
        setActive(store.state.activePluginId === props.id);
    }, [store.state.activePluginId, props.id]);

    React.useLayoutEffect(() => {
        const plugin = store.state.pluginsData.find(
            (plugin) => plugin.id === props.id
        );
        setViewElements(
            plugin?.views.find((view) => view.id === plugin.activeViewId)
                ?.elements || []
        );
    }, [props.id, store.state.pluginsData]);

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
            <span>{props.name}</span>
            {viewElements.map((viewElement) => (
                <ViewElement
                    key={viewElement.id}
                    id={viewElement.id}
                    settings={viewElement.settings}
                >
                    {viewElement.layout}
                </ViewElement>
            ))}
        </div>
    );
};
