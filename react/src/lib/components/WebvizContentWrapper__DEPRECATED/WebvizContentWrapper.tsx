import React, { WeakValidationMap } from "react";

import { Menu, MenuProps } from "../Menu";

import { WebvizContentManager } from "../WebvizContentManager";
import { WebvizPluginsWrapper } from "../WebvizPluginsWrapper";
import { WebvizPluginWrapper } from "../WebvizPluginWrapper";
import { WebvizSettingsDrawer } from "../WebvizSettingsDrawer/WebvizSettingsDrawer";
import {
    Plugin,
    PluginPropTypes,
} from "../../shared-types/webviz-content/webviz";

import "./webviz-content-wrapper.css";
import PropTypes from "prop-types";
import { WebvizViewElement } from "../WebvizViewElement";

type DashProps = {
    url: string;
};

export type WebvizContentWrapperProps = {
    id: string;
    menuProps: MenuProps;
    plugins: Plugin[];
    setProps: (props: DashProps) => void;
};

export const WebvizContentWrapper: React.FC<WebvizContentWrapperProps> = (
    props
) => {
    const handleUrlChanged = (url: string) => {
        props.setProps({ url: url });
    };
    return (
        <WebvizContentManager
            pluginsMetadata={props.plugins}
            id="manager"
            setProps={(props: { activeViewId: string }) => {
                console.log(props);
            }}
        >
            <Menu
                {...props.menuProps}
                setProps={(propsFromMenu) =>
                    handleUrlChanged(propsFromMenu.url)
                }
            />
            <WebvizSettingsDrawer id="drawer" />
            <WebvizPluginsWrapper id="plugins-wrapper">
                <WebvizPluginWrapper name="MyPlugin" id="plugin-wrapper">
                    <WebvizViewElement id="view-element">
                        <h1>Test plugin view element</h1>
                    </WebvizViewElement>
                </WebvizPluginWrapper>
            </WebvizPluginsWrapper>
        </WebvizContentManager>
    );
};

WebvizContentWrapper.propTypes = {
    id: PropTypes.string.isRequired,
    menuProps: PropTypes.shape(Menu.propTypes as WeakValidationMap<MenuProps>)
        .isRequired,
    plugins: PropTypes.arrayOf(PropTypes.shape(PluginPropTypes).isRequired)
        .isRequired,
    setProps: PropTypes.func.isRequired,
};
