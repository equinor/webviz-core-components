/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useRef } from "react";
import PropTypes, { InferProps } from "prop-types";
import html2canvas from "html2canvas";
import Tour from "reactour";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import Link from "@material-ui/core/Link";

import {
    faAddressCard,
    faQuestionCircle,
    faCameraRetro,
    faExpand,
    faDownload,
    faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";

import WebvizToolbarButton from "./utils/WebvizToolbarButton";
import WebvizContentOverlay from "./utils/WebvizContentOverlay";
import downloadFile from "./utils/downloadFile";

import "./webviz_plugin_component.css";

/**
 * WebvizPluginPlaceholder is a fundamental webviz dash component.
 * It takes a property, `label`, and displays it.
 * It renders an input with the property `value` which is editable by the user.
 */
const WebvizPluginPlaceholder = (
    props: InferProps<typeof WebvizPluginPlaceholder.propTypes>
): JSX.Element => {
    const {
        id,
        children,
        buttons,
        contact_person,
        download,
        screenshot_filename,
        tour_steps,
        data_requested,
        show_deprecation_warning,
        deprecation_message,
        deprecation_url,
        setProps
    } = props;

    const [expanded, setExpanded] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [tourIsOpen, setTourIsOpen] = useState(false);
    const [deprecationWarningOpen, setDeprecationWarningOpen] = useState(show_deprecation_warning);

    const prevExpandedRef = useRef(false);
    const didMountRef = useRef(false);

    const dataRequested = data_requested ? data_requested : 0;

    useEffect(() => {
        if (didMountRef.current) {
            if (download !== null && download !== undefined) {
                downloadFile({
                    filename: download.filename,
                    data: download.content,
                    mimeType: download.mime_type
                });
                setProps({ download: null });
            }

            // Hide/show body scrollbar depending on plugin going in/out of full screen mode.
            if (prevExpandedRef.current !== expanded) {
                document.body.style.overflow = expanded
                    ? "hidden"
                    : "visible";
            }
            prevExpandedRef.current = expanded;
        }
        else {
            didMountRef.current = true;
        }
    });

    const showTour =
        buttons && buttons.includes("guided_tour") &&
        tour_steps && tour_steps.length > 0;

    const ref = React.createRef<HTMLDivElement>();

    return (
        <>
            <div
                className={
                    "webviz-config-plugin-wrapper" +
                    (expanded
                        ? " webviz-config-plugin-expand"
                        : "")
                }
            >
                <div id={id} ref={ref} className="webviz-plugin-content">
                    {children}

                    <WebvizContentOverlay
                        id={"overlay".concat(id)}
                        contactPerson={contact_person}
                        showOverlay={showOverlay}
                    />
                </div>
                <div
                    className="webviz-config-plugin-buttonbar"
                >
                    {buttons && buttons.includes("screenshot") && (
                        <WebvizToolbarButton
                            icon={faCameraRetro}
                            tooltip="Take screenshot"
                            onClick={() => {
                                ref.current &&
                                    html2canvas(
                                        ref.current,
                                        {
                                            scrollX: -window.scrollX,
                                            scrollY: -window.scrollY,
                                        }
                                    ).then(canvas =>
                                        canvas.toBlob(blob =>
                                            downloadFile({
                                                filename: screenshot_filename,
                                                data: blob,
                                                mimeType: "image/png"
                                            })
                                        )
                                    )
                            }
                            }
                        />
                    )}
                    {buttons && buttons.includes("expand") && (
                        <WebvizToolbarButton
                            icon={faExpand}
                            tooltip="Expand"
                            selected={expanded}
                            onClick={() => {
                                setExpanded(!expanded)
                                // Trigger resize events of content in plugin,
                                // relevant as long as this issue is open:
                                // https://github.com/plotly/plotly.js/issues/3984
                                window.dispatchEvent(new Event("resize"));
                            }}
                        />
                    )}
                    {buttons && buttons.includes("download") && (
                        <WebvizToolbarButton
                            icon={faDownload}
                            tooltip="Download data"
                            onClick={() =>
                                setProps({
                                    data_requested:
                                        dataRequested + 1,
                                })
                            }
                        />
                    )}
                    {showTour && (
                        <WebvizToolbarButton
                            icon={faQuestionCircle}
                            tooltip="Guided tour"
                            onClick={() =>
                                setTourIsOpen(true)
                            }
                        />
                    )}
                    {buttons && buttons.includes("contact_person") &&
                        (contact_person && Object.keys(contact_person).length > 0)
                        && (
                            <WebvizToolbarButton
                                icon={faAddressCard}
                                tooltip="Contact person"
                                selected={showOverlay}
                                onClick={() =>
                                    setShowOverlay(!showOverlay)
                                }
                            />
                        )}
                    {show_deprecation_warning && (
                        <WebvizToolbarButton
                            icon={faExclamationTriangle}
                            tooltip="This plugin is deprecated"
                            important={true}
                            onClick={() =>
                                setDeprecationWarningOpen(true)
                            }
                        />
                    )}
                </div>
            </div>
            {showTour && (
                <Tour
                    steps={tour_steps}
                    isOpen={tourIsOpen}
                    onRequestClose={() =>
                        setTourIsOpen(false)
                    }
                    showNumber={false}
                    rounded={5}
                    accentColor="red"
                />
            )}
            <Snackbar 
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }} 
                open={deprecationWarningOpen} 
                autoHideDuration={10000} 
                onClose={(_event: any, reason: string) => {
                    if (reason !== "clickaway") {
                        setDeprecationWarningOpen(false);
                    }
                }}
            >
                <Alert elevation={6} variant="filled" severity="warning">
                    {deprecation_message}
                    {deprecation_url != "" && (
                        <Link 
                            className="webviz-config-plugin-deprecation-link" 
                            href={deprecation_url}
                            color="inherit"
                            target="_blank"
                            underline="always"
                        >
                            More info
                        </Link>
                    )}
                </Alert>
            </Snackbar>
        </>
    );
};

export default WebvizPluginPlaceholder;

WebvizPluginPlaceholder.defaultProps = {
    id: "some-id",
    buttons: [
        "screenshot",
        "expand",
        "download",
        "guided_tour",
        "contact_person",
    ],
    contact_person: undefined,
    tour_steps: [],
    data_requested: 0,
    download: undefined,
    screenshot_filename: "webviz-screenshot.png",
    show_deprecation_warning: false,
    deprecation_message: "This plugin is deprecated. Please consider to switch.",
    deprecation_url: "",
    setProps: () => { return undefined },
};

WebvizPluginPlaceholder.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string.isRequired,

    /**
     * The children of this component
     */
    children: PropTypes.node,

    /**
     * Array of strings, representing which buttons to render. Full set is
     * ['download', 'contact_person', 'guided_tour', 'screenshot', 'expand']
     */
    buttons: PropTypes.array.isRequired,

    /**
     * A dictionary of information regarding contact person for the data content.
     * Valid keys are 'name', 'email' and 'phone'.
     */
    contact_person: PropTypes.shape({
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        phone: PropTypes.string.isRequired
    }),

    /**
     * A dictionary with information regarding the resource file the plugin requested.
     * Dictionary keys are 'filename', 'content' and 'mime_type'.
     * The 'content' value should be a base64 encoded ASCII string.
     */
    download: PropTypes.shape({
        filename: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        mime_type: PropTypes.string.isRequired
    }),

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
     * Stating if a deprecation warning for the related plugin should be shown.
     */
    show_deprecation_warning: PropTypes.bool,

    /**
     * Message to display when plugin is deprecated (max 255 chars).
     */
    deprecation_message: PropTypes.string,

    /**
     * URL referring to a source with more information about the deprecation of this plugin.
     */
    deprecation_url: PropTypes.string,

    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change
     */
    setProps: PropTypes.func.isRequired,
};
