import React, { WeakValidationMap } from "react";

import { Menu, MenuProps } from "../Menu";

import { ContentManager } from "./components/ContentManager";
import { PluginsWrapper } from "./components/PluginsWrapper";
import { SettingsDrawer } from "./components/SettingsDrawer/settings-drawer";
import { Plugin, PluginPropTypes } from "./shared-types/webviz";

import "./webviz-content-wrapper.css";
import PropTypes from "prop-types";

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
        <ContentManager plugins={props.plugins}>
            <Menu
                {...props.menuProps}
                setProps={(propsFromMenu) =>
                    handleUrlChanged(propsFromMenu.url)
                }
            />
            <SettingsDrawer />
            <PluginsWrapper />
        </ContentManager>
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
