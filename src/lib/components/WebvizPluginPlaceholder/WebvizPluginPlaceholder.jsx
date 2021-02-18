/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


import React, { Component } from "react";
import PropTypes from "prop-types";
import html2canvas from "html2canvas";
import Tour from "reactour";

import {
    faAddressCard,
    faQuestionCircle,
    faCameraRetro,
    faExpand,
    faDownload,
} from "@fortawesome/free-solid-svg-icons";

import WebvizToolbarButton from "./utils/WebvizToolbarButton";
import WebvizContentOverlay from "./utils/WebvizContentOverlay";
import download_file from "./utils/download_file";

import "./webviz_plugin_component.css";

/**
 * WebvizPluginPlaceholder is a fundamental webviz dash component.
 * It takes a property, `label`, and displays it.
 * It renders an input with the property `value` which is editable by the user.
 */
export default class WebvizPluginPlaceholder extends Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false,
            showOverlay: false,
            tourIsOpen: false,
        };
    }

    componentDidUpdate(_, prevState) {
        if (this.props.download !== null && this.props.download !== "") {
            download_file({
                filename: this.props.download.filename,
                data: this.props.download.content,
                mimeType: this.props.download.mime_type
            });
            this.props.setProps({ download: null });
        }

        // Hide/show body scrollbar depending on plugin going in/out of full screen mode.
        if (this.state.expanded !== prevState.expanded) {
            document.body.style.overflow = this.state.expanded
                ? "hidden"
                : null;
        }
    }

    render() {
        const showTour =
            this.props.buttons.includes("guided_tour") &&
            this.props.tour_steps.length > 0;

        return (
            <>
                <div
                    className={
                        "webviz-config-plugin-wrapper" +
                        (this.state.expanded
                            ? " webviz-config-plugin-expand"
                            : "")
                    }
                >
                    <div id={this.props.id} className="webviz-plugin-content">
                        {this.props.children}

                        <WebvizContentOverlay
                            id={"overlay".concat(this.props.id)}
                            contactPerson={this.props.contact_person}
                            showOverlay={this.state.showOverlay}
                        />
                    </div>
                    <div
                        className="webviz-config-plugin-buttonbar"
                    >
                        {this.props.buttons.includes("screenshot") && (
                            <WebvizToolbarButton
                                icon={faCameraRetro}
                                tooltip="Take screenshot"
                                onClick={() =>
                                    html2canvas(
                                        document.getElementById(this.props.id),
                                        {
                                            scrollX: -window.scrollX,
                                            scrollY: -window.scrollY,
                                        }
                                    ).then(canvas =>
                                        canvas.toBlob(blob =>
                                            download_file({
                                                filename: this.props.screenshot_filename,
                                                data: blob,
                                            }),
                                            "image/png"
                                        )
                                    )
                                }
                            />
                        )}
                        {this.props.buttons.includes("expand") && (
                            <WebvizToolbarButton
                                icon={faExpand}
                                tooltip="Expand"
                                selected={this.state.expanded}
                                onClick={() => {
                                    this.setState({
                                        expanded: !this.state.expanded,
                                    });
                                    // Trigger resize events of content in plugin,
                                    // relevant as long as this issue is open:
                                    // https://github.com/plotly/plotly.js/issues/3984
                                    window.dispatchEvent(new Event("resize"));
                                }}
                            />
                        )}
                        {this.props.buttons.includes("download") && (
                            <WebvizToolbarButton
                                icon={faDownload}
                                tooltip="Download data"
                                onClick={() =>
                                    this.props.setProps({
                                        data_requested:
                                            this.props.data_requested + 1,
                                    })
                                }
                            />
                        )}
                        {showTour && (
                            <WebvizToolbarButton
                                icon={faQuestionCircle}
                                tooltip="Guided tour"
                                onClick={() =>
                                    this.setState({ tourIsOpen: true })
                                }
                            />
                        )}
                        {this.props.buttons.includes("contact_person") &&
                            Object.keys(this.props.contact_person).length >
                            0 && (
                                <WebvizToolbarButton
                                    icon={faAddressCard}
                                    tooltip="Contact person"
                                    selected={this.state.showOverlay}
                                    onClick={() =>
                                        this.setState({
                                            showOverlay: !this.state
                                                .showOverlay,
                                        })
                                    }
                                />
                            )}
                    </div>
                </div>
                {showTour && (
                    <Tour
                        steps={this.props.tour_steps}
                        isOpen={this.state.tourIsOpen}
                        onRequestClose={() =>
                            this.setState({ tourIsOpen: false })
                        }
                        showNumber={false}
                        rounded={5}
                        accentColor="red"
                    />
                )}
            </>
        );
    }
}

WebvizPluginPlaceholder.defaultProps = {
    id: "some-id",
    buttons: [
        "screenshot",
        "expand",
        "download",
        "guided_tour",
        "contact_person",
    ],
    contact_person: {},
    tour_steps: [],
    data_requested: 0,
    download: null,
    screenshot_filename: "webviz-screenshot.png",
};

WebvizPluginPlaceholder.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string,

    /**
     * The children of this component
     */
    children: PropTypes.node,

    /**
     * Array of strings, representing which buttons to render. Full set is
     * ['download', 'contact_person', 'guided_tour', 'screenshot', 'expand']
     */
    buttons: PropTypes.array,

    /**
     * A dictionary of information regarding contact person for the data content.
     * Valid keys are 'name', 'email' and 'phone'.
     */
    contact_person: PropTypes.objectOf(PropTypes.string),

    /**
     * A dictionary with information regarding the resource file the plugin requested.
     * Dictionary keys are 'filename', 'content' and 'mime_type'.
     * The 'content' value should be a base64 encoded ASCII string.
     */
    download: PropTypes.objectOf(PropTypes.string),

    /**
     *  File name used when saving a screenshot of the plugin.
     */
    screenshot_filename: PropTypes.string,

    /**
     * Tour steps. List of dictionaries, each with two keys ('selector' and 'content').
     */
    tour_steps: PropTypes.array,

    /**
     * An integer that represents the number of times
     * that the data download button has been clicked.
     */
    data_requested: PropTypes.number,

    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change
     */
    setProps: PropTypes.func,
};
