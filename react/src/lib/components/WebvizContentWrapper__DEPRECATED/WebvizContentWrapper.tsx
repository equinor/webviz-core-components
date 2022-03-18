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
import { WebvizPluginLayoutRow } from "../WebvizPluginLayoutRow";
import { WebvizPluginLayoutColumn } from "../WebvizPluginLayoutColumn";

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
                    <WebvizPluginLayoutRow>
                        <WebvizPluginLayoutColumn>
                            <WebvizViewElement id="view-element-1">
                                <h1>Test 1</h1>
                            </WebvizViewElement>
                            <WebvizViewElement id="view-element-2">
                                <h1>Test 2</h1>
                            </WebvizViewElement>
                        </WebvizPluginLayoutColumn>
                        <WebvizViewElement id="view-element-3">
                            <h1>Test 3</h1>
                        </WebvizViewElement>
                    </WebvizPluginLayoutRow>
                    <WebvizViewElement id="view-element-4">
                        <h1>Test 4</h1>
                    </WebvizViewElement>
                    <WebvizViewElement id="view-element-5">
                        <h1>Test 5</h1>
                    </WebvizViewElement>
                </WebvizPluginWrapper>
                <WebvizPluginWrapper name="MyPlugin" id="plugin-wrapper-2">
                    <WebvizViewElement id="view-element-6">
                        <h1>Test 6</h1>
                    </WebvizViewElement>
                    <WebvizViewElement id="view-element-7">
                        <h1>Test 7</h1>
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
