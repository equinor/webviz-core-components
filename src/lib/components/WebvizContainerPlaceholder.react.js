import React, { Component } from "react";
import PropTypes from "prop-types";
import htmlToImage from "html-to-image";
import Tour from "reactour";

import {
    faFileArchive,
    faAddressCard,
    faQuestionCircle,
    faCameraRetro,
    faExpand,
} from "@fortawesome/free-solid-svg-icons";

import WebvizToolbarButton from "../private-components/webviz-container-placeholder-resources/WebvizToolbarButton";
import WebvizContentOverlay from "../private-components/webviz-container-placeholder-resources/WebvizContentOverlay";
import download_file from "../private-components/webviz-container-placeholder-resources/download_file";

import "./webviz_container_component.css";

/**
 * WebvizContainerPlaceholder is a fundamental webviz dash component.
 * It takes a property, `label`, and displays it.
 * It renders an input with the property `value` which is editable by the user.
 */
export default class WebvizContainerPlaceholder extends Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false,
            showOverlay: false,
            tourIsOpen: false,
        };
    }

    componentDidUpdate(_, prevState) {
        if (this.props.zip_base64 !== "") {
            const now = new Date();
            const filename = `webviz-data-${now.getFullYear()}-${now.getMonth() +
                1}-${now.getDate()}.zip`;

            download_file(filename, this.props.zip_base64);
            this.props.setProps({ zip_base64: "" });
        }

        // Hide/show body scrollbar depending on container going in/out of full screen mode.
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
                        "webviz-config-container-wrapper" +
                        (this.state.expanded
                            ? " webviz-config-container-expand"
                            : "")
                    }
                >
                    <div
                        id={this.props.id}
                        className="webviz-container-content"
                    >
                        {this.props.children}

                        <WebvizContentOverlay
                            id={"overlay".concat(this.props.id)}
                            contactPerson={this.props.contact_person}
                            showOverlay={this.state.showOverlay}
                        />
                    </div>
                    <div
                        className="webviz-config-container-buttonbar"
                        id="camerabutton"
                    >
                        {this.props.buttons.includes("screenshot") && (
                            <WebvizToolbarButton
                                icon={faCameraRetro}
                                tooltip="Take screenshot"
                                onClick={() =>
                                    htmlToImage
                                        .toBlob(
                                            document.getElementById(
                                                this.props.id
                                            )
                                        )
                                        .then(function(blob) {
                                            download_file(
                                                "webviz-screenshot.png",
                                                blob,
                                                true
                                            );
                                        })
                                }
                            />
                        )}
                        {this.props.buttons.includes("expand") && (
                            <WebvizToolbarButton
                                icon={faExpand}
                                tooltip="Expand container"
                                selected={this.state.expanded}
                                onClick={() => {
                                    this.setState({
                                        expanded: !this.state.expanded,
                                    });
                                    // Trigger resize events of content in container,
                                    // relevant as long as this issue is open:
                                    // https://github.com/plotly/plotly.js/issues/3984
                                    window.dispatchEvent(new Event("resize"));
                                }}
                            />
                        )}
                        {this.props.buttons.includes("download_zip") && (
                            <WebvizToolbarButton
                                icon={faFileArchive}
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

WebvizContainerPlaceholder.defaultProps = {
    id: "some-id",
    buttons: [
        "screenshot",
        "expand",
        "download_zip",
        "guided_tour",
        "contact_person",
    ],
    contact_person: {},
    tour_steps: [],
    data_requested: 0,
    zip_base64: "",
};

WebvizContainerPlaceholder.propTypes = {
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
     * ['download_zip', 'contact_person', 'guided_tour', 'screenshot', 'expand']
     */
    buttons: PropTypes.array,

    /**
     * A dictionary of information regarding contact person for the data content.
     * Valid keys are 'name', 'email' and 'phone'.
     */
    contact_person: PropTypes.objectOf(PropTypes.string),

    /**
     * The zip archive to download encoded as base64 (when user clicks on the download csv file icon).
     */
    zip_base64: PropTypes.string,

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
