import React from "react";
import PropTypes from "prop-types";

import { useStore } from "../WebvizContentManager/WebvizContentManager";

export type WebvizViewToggleContainerProps = {
    children?: React.ReactNode;
    showInViews?: string[];
    notShowInViews?: string[];
};

export const WebvizViewToggleContainer: React.FC<WebvizViewToggleContainerProps> =
    (props) => {
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
        }, [store.state]);

        React.useEffect(() => {
            if (props.showInViews) {
                setVisible(
                    props.showInViews.some((elm) => elm === activeViewId)
                );
                return;
            }
            if (props.notShowInViews) {
                setVisible(
                    !props.notShowInViews.some((elm) => elm === activeViewId)
                );
            }
        }, [activeViewId, props.showInViews, props.notShowInViews]);

        return (
            <div
                className="WebvizViewToggleContainer"
                style={{
                    display: visible ? "block" : "none",
                }}
            >
                {props.children}
            </div>
        );
    };

WebvizViewToggleContainer.propTypes = {
    children: PropTypes.node, // Todo: Required or not required?
    showInViews: PropTypes.arrayOf(PropTypes.string.isRequired),
    notShowInViews: PropTypes.arrayOf(PropTypes.string.isRequired),
};
