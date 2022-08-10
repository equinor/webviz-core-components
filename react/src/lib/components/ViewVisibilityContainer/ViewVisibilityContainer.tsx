import React from "react";
import PropTypes from "prop-types";

import { useStore } from "../WebvizContentManager/WebvizContentManager";

export type ViewVisibilityContainerProps = {
    children?: React.ReactNode;
    showInViews?: string[];
    notShowInViews?: string[];
};

export const ViewVisibilityContainer: React.FC<ViewVisibilityContainerProps> = (
    props
) => {
    const store = useStore();

    const [activeViewId, setActiveViewId] = React.useState<string>("");
    const [visible, setVisible] = React.useState<boolean>(false);

    React.useEffect(() => {
        const plugin = store.state.pluginsData.find(
            (plugin) => plugin.id === store.state.activePluginId
        );

        setActiveViewId(
            plugin?.activeViewId.replace(plugin.id + "-", "") || ""
        );
    }, [store.state, setActiveViewId]);

    React.useEffect(() => {
        if (props.showInViews) {
            setVisible(props.showInViews.some((elm) => elm === activeViewId));
            return;
        }
        if (props.notShowInViews) {
            setVisible(
                !props.notShowInViews.some((elm) => elm === activeViewId)
            );
        }
    }, [activeViewId, setVisible, props.showInViews, props.notShowInViews]);

    return (
        <div
            className="ViewVisibilityContainer"
            style={{
                display: visible ? "block" : "none",
            }}
        >
            {props.children}
        </div>
    );
};

ViewVisibilityContainer.propTypes = {
    children: PropTypes.node,
    showInViews: PropTypes.arrayOf(PropTypes.string.isRequired),
    notShowInViews: PropTypes.arrayOf(PropTypes.string.isRequired),
};
