import React from "react";

import { Menu, MenuProps } from "../Menu";

import { ContentManager } from "./components/ContentManager";
import { PluginsWrapper } from "./components/PluginsWrapper";
import { SettingsDrawer } from "./components/SettingsDrawer/settings-drawer";

import "./webviz-content-wrapper.css";

export const WebvizContentWrapper: React.FC<MenuProps> = (props) => {
    return (
        <ContentManager>
            <Menu {...props} />
            <SettingsDrawer />
            <PluginsWrapper />
        </ContentManager>
    );
};
