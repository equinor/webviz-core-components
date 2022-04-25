import React, { WeakValidationMap } from "react";

import { Menu, MenuProps } from "../Menu";

import { WebvizContentManager } from "../WebvizContentManager";
import { WebvizPluginsWrapper } from "../WebvizPluginsWrapper";
import { WebvizPluginWrapper } from "../WebvizPluginWrapper";
import { WebvizSettingsDrawer } from "../WebvizSettingsDrawer/WebvizSettingsDrawer";

import "./webviz-content-wrapper.css";
import PropTypes from "prop-types";
import { WebvizViewElement } from "../WebvizViewElement";
import { WebvizPluginLayoutRow } from "../WebvizPluginLayoutRow";
import { WebvizSettingsGroup } from "../WebvizSettingsGroup";

type DashProps = {
    url: string;
};

export type WebvizContentWrapperProps = {
    id: string;
    menuProps: MenuProps;
    setProps: (props: DashProps) => void;
};

export const WebvizContentWrapper: React.FC<WebvizContentWrapperProps> = (
    props
) => {
    const [view, setView] = React.useState<React.ReactNode>(
        <WebvizPluginLayoutRow>
            <WebvizViewElement id="view-element1" showDownload={false}>
                <h1 data-dash-is-loading="true">Test plugin view element 1</h1>
                <WebvizSettingsGroup
                    id="view-element1-settings"
                    title="Test"
                    viewId=""
                    pluginId=""
                >
                    Blabla
                </WebvizSettingsGroup>
            </WebvizViewElement>
            <WebvizViewElement id="view-element2" showDownload={false}>
                <h1>Test plugin view element 2</h1>
            </WebvizViewElement>
        </WebvizPluginLayoutRow>
    );
    const handleUrlChanged = (url: string) => {
        props.setProps({ url: url });
    };
    return (
        <WebvizContentManager
            id="manager"
            setProps={(props) => {
                if (props.activeViewId === "view1") {
                    setView(
                        <WebvizPluginLayoutRow>
                            <WebvizViewElement
                                id="view-element1"
                                showDownload={false}
                            >
                                <h1 data-dash-is-loading="true">
                                    Test plugin view element 1
                                </h1>
                                <WebvizSettingsGroup
                                    id="view-element1-settings"
                                    title="Test"
                                    viewId=""
                                    pluginId=""
                                >
                                    Blabla
                                </WebvizSettingsGroup>
                            </WebvizViewElement>
                            <WebvizViewElement
                                id="view-element2"
                                showDownload={false}
                            >
                                <h1>Test plugin view element 2</h1>
                            </WebvizViewElement>
                        </WebvizPluginLayoutRow>
                    );
                } else {
                    setView(
                        <WebvizPluginLayoutRow>
                            <WebvizViewElement
                                id="view-element3"
                                showDownload={false}
                            >
                                <h1 data-dash-is-loading="true">
                                    Test plugin view element 3
                                </h1>
                                <WebvizSettingsGroup
                                    id="view-element3-settings"
                                    title="Test"
                                    viewId=""
                                    pluginId=""
                                >
                                    Blabla
                                </WebvizSettingsGroup>
                            </WebvizViewElement>
                            <WebvizViewElement
                                id="view-element4"
                                showDownload={false}
                            >
                                <h1>Test plugin view element 4</h1>
                            </WebvizViewElement>
                        </WebvizPluginLayoutRow>
                    );
                }
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
                <WebvizPluginWrapper
                    name="MyPlugin"
                    id="plugin-wrapper"
                    views={[
                        {
                            id: "view1",
                            group: "",
                            name: "View 1",
                            showDownload: true,
                        },
                        {
                            id: "view2",
                            group: "",
                            name: "View 2",
                            showDownload: false,
                        },
                    ]}
                    screenshotFilename="MyScreenshot"
                    contactPerson={{
                        name: "Equinor Superman",
                        email: "superman@equinor.com",
                        phone: "+47 12345678",
                    }}
                    stretch={true}
                    deprecationWarnings={[
                        {
                            message: "This is a test warning",
                            url: "www.fakeurl...",
                        },
                        {
                            message: "This is a second test warning",
                            url: "www.fakeurl...",
                        },
                    ]}
                    feedbackUrl={
                        "https://github.com/equinor/webviz-core-components/issues/" +
                        "new?title=New+feedback&body=Feedback+text&labels=userfeedback"
                    }
                    tourSteps={[
                        {
                            elementId: "view-element1",
                            viewId: "view1",
                            content: "This is a test",
                        },
                        {
                            elementId: "view-element4",
                            viewId: "view2",
                            content: "This is another test",
                        },
                    ]}
                >
                    {view}
                </WebvizPluginWrapper>
                <WebvizPluginWrapper
                    name="MyPlugin2"
                    id="plugin-wrapper2"
                    views={[]}
                    screenshotFilename="MyScreenshot"
                >
                    <WebvizViewElement id="view-element" showDownload={false}>
                        <h1>Test plugin 2 view element</h1>
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
    setProps: PropTypes.func.isRequired,
};
