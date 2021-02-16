import React, { useState, useEffect, useRef } from "react";
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

type WebvizPluginPlaceholderType = {
    id: string,
    children?: PropTypes.ReactNodeLike,
    buttons?: Array<string>,
    contactPerson?: {
        name: string,
        email: string,
        phone: string
    },
    download?: {
        filename: string,
        content: string,
        mime_type: string
    },
    screenshotFilename?: string,
    tourSteps?: Array<{ selector: string, content: string }>,
    dataRequested?: number,
    setProps: (props: object) => void
};

/**
 * WebvizPluginPlaceholder is a fundamental webviz dash component.
 * It takes a property, `label`, and displays it.
 * It renders an input with the property `value` which is editable by the user.
 */
const WebvizPluginPlaceholder: React.FC<WebvizPluginPlaceholderType> = ({ id, children, buttons, contactPerson, download, screenshotFilename, tourSteps, dataRequested, setProps }) => {

    const [expanded, setExpanded] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [tourIsOpen, setTourIsOpen] = useState(false);

    const prevExpandedRef = useRef<boolean>();

    useEffect(() => {
        if (download !== null && download !== undefined) {
            download_file({
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
    });

    const showTour =
        buttons && buttons.includes("guided_tour") &&
        tourSteps && tourSteps.length > 0;

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
                        contactPerson={contactPerson}
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
                                            download_file({
                                                filename: screenshotFilename,
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
                                dataRequested &&
                                setProps({
                                    dataRequested:
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
                        (contactPerson && Object.keys(contactPerson).length > 0)
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
                </div>
            </div>
            {showTour && (
                <Tour
                    steps={tourSteps}
                    isOpen={tourIsOpen}
                    onRequestClose={() =>
                        setTourIsOpen(false)
                    }
                    showNumber={false}
                    rounded={5}
                    accentColor="red"
                />
            )}
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
    contactPerson: undefined,
    tourSteps: [],
    dataRequested: 0,
    download: undefined,
    screenshotFilename: "webviz-screenshot.png",
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
    contactPerson: PropTypes.shape({
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
    screenshotFilename: PropTypes.string,

    /**
     * Tour steps. List of dictionaries, each with two keys ('selector' and 'content').
     */
    tourSteps: PropTypes.array,

    /**
     * An integer that represents the number of times
     * that the data download button has been clicked.
     */
    dataRequested: PropTypes.number,

    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change
     */
    setProps: PropTypes.func.isRequired,
};
