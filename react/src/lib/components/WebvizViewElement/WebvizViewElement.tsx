import { Icon } from "@equinor/eds-core-react";
import { IconButton } from "@material-ui/core";
import {
    settings,
    download,
    camera,
    fullscreen,
    fullscreen_exit,
} from "@equinor/eds-icons";
import React from "react";

import { Animation } from "../../utils/Animation";
import { Dialog } from "../Dialog";
import PropTypes from "prop-types";
import {
    DownloadData,
    DownloadDataPropTypes,
} from "../../shared-types/webviz-content/download-data";
import html2canvas from "html2canvas";
import downloadFile from "../../utils/downloadFile";

import "./webviz-view-element.css";
import { WebvizSettings } from "../WebvizSettings";
import {
    useStore,
    StoreActions,
} from "../WebvizContentManager/WebvizContentManager";

Icon.add({ settings, download, camera, fullscreen, fullscreen_exit });

export interface ParentProps {
    data_requested: number | null;
}

export type WebvizViewElementProps = {
    id: string;
    flexGrow?: number;
    showDownload?: boolean;
    screenshotFilename?: string;
    download?: DownloadData;
    setProps?: (props: ParentProps) => void;
    children?: React.ReactNode;
};

type FullScreenAnimationParameters = {
    left: number;
    top: number;
    height: number;
    width: number;
    backdropOpacity: number;
    paddingTop: number;
};

type FlashAnimationParameters = {
    opacity: number;
};

export const WebvizViewElement: React.FC<WebvizViewElementProps> = React.memo(
    (props) => {
        const store = useStore();
        const [isHovered, setIsHovered] = React.useState<boolean>(false);
        const [settingsVisible, setSettingsVisible] =
            React.useState<boolean>(false);
        const [isFullScreen, setIsFullScreen] = React.useState<boolean>(false);
        const [downloadRequests, setDownloadRequested] =
            React.useState<number>(0);
        const [fullScreenContainerStyle, setFullScreenContainerStyle] =
            React.useState<React.CSSProperties>({});
        const [contentStyle, setContentStyle] =
            React.useState<React.CSSProperties>({});
        const [spacerStyle, setSpacerStyle] =
            React.useState<React.CSSProperties>({});
        const contentRef = React.useRef<HTMLDivElement>(null);
        const fullScreenContainerRef = React.useRef<HTMLDivElement>(null);
        const fullScreenAnimation =
            React.useRef<Animation<FullScreenAnimationParameters> | null>(null);
        const flashAnimation =
            React.useRef<Animation<FlashAnimationParameters> | null>(null);

        React.useEffect(() => {
            return () => {
                if (fullScreenAnimation.current) {
                    fullScreenAnimation.current.reset();
                }
            };
        }, []);

        React.useEffect(() => {
            if (props.download !== null && props.download !== undefined) {
                downloadFile({
                    filename: props.download.filename,
                    data: props.download.content,
                    mimeType: props.download.mime_type,
                });
                if (props.setProps) {
                    props.setProps({ data_requested: null });
                }
            }
        }, [props.download]);

        const handleFullScreenClick = React.useCallback(() => {
            if (fullScreenAnimation.current) {
                fullScreenAnimation.current.reset();
            }
            if (contentRef.current && fullScreenContainerRef.current) {
                const rect = contentRef.current.getBoundingClientRect();

                const contentWidthWithoutPadding = parseInt(
                    getComputedStyle(contentRef.current)?.width || "0"
                );

                const contentHeightWithoutPadding = parseInt(
                    getComputedStyle(contentRef.current)?.height || "0"
                );

                const style: React.CSSProperties = {
                    position: "fixed",
                    left: rect.left,
                    top: rect.top,
                    width: contentWidthWithoutPadding,
                    height: contentHeightWithoutPadding,
                    zIndex: 1199,
                    padding: parseInt(
                        getComputedStyle(contentRef.current)?.padding || "0"
                    ),
                    backgroundColor: "white",
                    boxShadow: "1px 2px 6px -1px rgba(0, 0, 0, 0.33)",
                };

                setIsFullScreen(true);
                setFullScreenContainerStyle(style);
                setContentStyle({
                    zIndex: "auto",
                    flexGrow: 0,
                });

                setSpacerStyle({
                    width: contentWidthWithoutPadding,
                    height: contentHeightWithoutPadding,
                });

                store.dispatch({
                    type: StoreActions.SetFullScreenActions,
                    payload: {
                        actions: [
                            {
                                actionName: "screenshot",
                                icon: "camera",
                                tooltip: "Save screenshot",
                            },
                            {
                                actionName: "leave_fullscreen",
                                icon: "fullscreen_exit",
                                tooltip: "Leave full screen",
                            },
                        ],
                    },
                });

                store.dispatch({
                    type: StoreActions.SetFullScreenActionsCallback,
                    payload: {
                        callback: (action: string) => {
                            if (action === "screenshot") {
                                handleScreenShotClick();
                            } else if (action === "leave_fullscreen") {
                                handleLeaveFullScreenClick();
                            }
                        },
                    },
                });

                fullScreenAnimation.current =
                    new Animation<FullScreenAnimationParameters>(
                        600,
                        10,
                        [
                            {
                                t: 0,
                                state: {
                                    left: rect.left,
                                    top: rect.top,
                                    height: contentHeightWithoutPadding,
                                    width: contentWidthWithoutPadding,
                                    backdropOpacity: 0,
                                    paddingTop: parseInt(
                                        getComputedStyle(contentRef.current)
                                            ?.padding || "0"
                                    ),
                                },
                            },
                            {
                                t: 1,
                                state: {
                                    left: 0,
                                    top: 0,
                                    height: window.innerHeight,
                                    width: window.innerWidth,
                                    backdropOpacity: 1,
                                    paddingTop: 70,
                                },
                            },
                        ],
                        Animation.Bezier,
                        (values, t) => {
                            store.dispatch({
                                type: StoreActions.SetBackdropOpacity,
                                payload: { opacity: values.backdropOpacity },
                            });
                            if (t === 1) {
                                setFullScreenContainerStyle({
                                    ...style,
                                    left: 0,
                                    top: 0,
                                    width: "100vw",
                                    height: "100vh",
                                    paddingTop: 70,
                                });
                                setIsHovered(false);
                                return;
                            }
                            setFullScreenContainerStyle({
                                ...style,
                                left: values.left,
                                top: values.top,
                                width: values.width,
                                height: values.height,
                                paddingTop: values.paddingTop,
                            });
                        }
                    );
                fullScreenAnimation.current.start();
            }
        }, [
            fullScreenContainerStyle,
            fullScreenAnimation.current,
            contentRef.current,
            store,
        ]);

        const handleLeaveFullScreenClick = React.useCallback(() => {
            if (fullScreenAnimation.current) {
                fullScreenAnimation.current.reset();
            }
            if (contentRef.current && fullScreenContainerRef.current) {
                const rect = contentRef.current.getBoundingClientRect();

                const contentWidthWithoutPadding = parseInt(
                    getComputedStyle(contentRef.current)?.width || "0"
                );

                const contentHeightWithoutPadding = parseInt(
                    getComputedStyle(contentRef.current)?.height || "0"
                );

                const style: React.CSSProperties = {
                    position: "fixed",
                    zIndex: 1199,
                    backgroundColor: "#fff",
                    boxShadow: "1px 2px 6px -1px rgba(0, 0, 0, 0.33)",
                    padding: parseInt(
                        getComputedStyle(contentRef.current)?.padding || "0"
                    ),
                };

                fullScreenAnimation.current =
                    new Animation<FullScreenAnimationParameters>(
                        600,
                        10,
                        [
                            {
                                t: 0,
                                state: {
                                    left: 0,
                                    top: 0,
                                    height: window.innerHeight,
                                    width: window.innerWidth,
                                    backdropOpacity: 1,
                                    paddingTop: 70,
                                },
                            },
                            {
                                t: 1,
                                state: {
                                    left: rect.left,
                                    top: rect.top,
                                    height: contentHeightWithoutPadding,
                                    width: contentWidthWithoutPadding,
                                    backdropOpacity: 0,
                                    paddingTop: parseInt(
                                        getComputedStyle(contentRef.current)
                                            ?.padding || "0"
                                    ),
                                },
                            },
                        ],
                        Animation.Bezier,
                        (values, t) => {
                            store.dispatch({
                                type: StoreActions.SetBackdropOpacity,
                                payload: { opacity: values.backdropOpacity },
                            });
                            if (t === 1) {
                                setFullScreenContainerStyle({});
                                setContentStyle({});
                                setSpacerStyle({});
                                setIsFullScreen(false);
                                return;
                            }
                            setFullScreenContainerStyle({
                                ...style,
                                left: values.left,
                                top: values.top,
                                width: values.width,
                                height: values.height,
                                paddingTop: values.paddingTop,
                            });
                        }
                    );
                fullScreenAnimation.current.start();
            }
        }, [
            fullScreenContainerStyle,
            fullScreenAnimation.current,
            contentRef.current,
            store,
        ]);

        const handleScreenShotClick = () => {
            if (fullScreenContainerRef.current) {
                if (flashAnimation.current) {
                    flashAnimation.current.reset();
                }

                const flash = document.body.appendChild(
                    document.createElement("div")
                );
                flash.className = "WebvizCameraFlash";

                flashAnimation.current =
                    new Animation<FlashAnimationParameters>(
                        200,
                        10,
                        [
                            {
                                t: 0,
                                state: { opacity: 0 },
                            },
                            {
                                t: 0.5,
                                state: { opacity: 1 },
                            },
                            { t: 1, state: { opacity: 0 } },
                        ],
                        Animation.Bezier,
                        (values, t) => {
                            if (fullScreenContainerRef.current) {
                                if (t === 0.5) {
                                    const actions: Element[] = [];
                                    if (isFullScreen) {
                                        actions.push(
                                            ...Array.from(
                                                fullScreenContainerRef.current.getElementsByClassName(
                                                    "WebvizFullScreenMenu"
                                                )
                                            )
                                        );
                                        actions.forEach(
                                            (action) =>
                                                ((
                                                    action as HTMLDivElement
                                                ).style.display = "none")
                                        );
                                    }
                                    flash.style.opacity = "0";
                                    html2canvas(
                                        fullScreenContainerRef.current,
                                        {
                                            scrollX: -window.scrollX,
                                            scrollY: -window.scrollY,
                                        }
                                    ).then((canvas) =>
                                        canvas.toBlob((blob) => {
                                            if (blob !== null) {
                                                downloadFile({
                                                    filename:
                                                        props.screenshotFilename ||
                                                        "webviz_screenshot.png",
                                                    data: blob,
                                                    mimeType: "image/png",
                                                });
                                            }
                                        })
                                    );
                                    if (isFullScreen) {
                                        actions.forEach(
                                            (action) =>
                                                ((
                                                    action as HTMLDivElement
                                                ).style.display = "block")
                                        );
                                    }
                                    flash.style.opacity = "1";
                                }
                                if (t === 1) {
                                    document.body.removeChild(flash);
                                    return;
                                }
                                flash.style.opacity = values.opacity.toString();
                            }
                        }
                    );
                flashAnimation.current.start();
            }
        };

        const settings: React.ReactElement[] = [];
        const content: React.ReactNode[] = [];

        React.Children.forEach(props.children, (child) => {
            if (
                React.isValidElement(child) &&
                typeof child.props === "object" &&
                Object.keys(child.props).includes("_dashprivate_layout") &&
                child.props._dashprivate_layout.type === "WebvizSettingsGroup"
            ) {
                settings.push(child);
                return;
            }
            content.push(child);
        });

        const handleDownloadClick = React.useCallback(() => {
            const requests = downloadRequests + 1;
            setDownloadRequested(requests);
            if (props.setProps) {
                props.setProps({ data_requested: requests });
            }
        }, [setDownloadRequested, props.setProps]);
        return (
            <div
                className="WebvizViewElement"
                style={{ flexGrow: isFullScreen ? 0 : props.flexGrow || 1 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div
                    className="WebvizViewElement__Content"
                    ref={contentRef}
                    style={contentStyle}
                >
                    <div
                        style={spacerStyle}
                        className="WebvizViewElement__Content__Spacer"
                    />
                    <div
                        ref={fullScreenContainerRef}
                        style={fullScreenContainerStyle}
                        className="WebvizViewElement__FullScreenContainer"
                    >
                        {content}
                    </div>
                </div>
                <div
                    className={
                        isHovered
                            ? "WebvizViewElement__Actions__hover"
                            : "WebvizViewElement__Actions"
                    }
                >
                    {settings.length > 0 && (
                        <div>
                            <IconButton
                                onClick={() => setSettingsVisible(true)}
                            >
                                <Icon name="settings" size={16} />
                            </IconButton>
                        </div>
                    )}
                    <div className="WebvizViewElement__Actions__Spacer" />
                    {props.showDownload && (
                        <div>
                            <IconButton onClick={() => handleDownloadClick()}>
                                <Icon name="download" size={16} />
                            </IconButton>
                        </div>
                    )}
                    <div>
                        <IconButton onClick={handleScreenShotClick}>
                            <Icon name="camera" size={16} />
                        </IconButton>
                    </div>
                    <div>
                        <IconButton onClick={handleFullScreenClick}>
                            <Icon name="fullscreen" size={16} />
                        </IconButton>
                    </div>
                </div>
                <Dialog
                    id={`${props.id}-settings`}
                    title="View Element Settings"
                    open={settingsVisible}
                    draggable={true}
                    setProps={(dialogProps: {
                        action: string;
                        open: boolean;
                        action_called: number;
                    }) => {
                        if (dialogProps.open === false) {
                            setSettingsVisible(false);
                        }
                    }}
                >
                    <div className="WebvizViewElement__SettingsContainer">
                        <WebvizSettings visible={true} width={600}>
                            {settings.map((setting) => {
                                return React.cloneElement(setting, {
                                    ...setting.props,
                                });
                            })}
                        </WebvizSettings>
                    </div>
                </Dialog>
            </div>
        );
    }
);

WebvizViewElement.propTypes = {
    id: PropTypes.string.isRequired,
    flexGrow: PropTypes.number,
    showDownload: PropTypes.bool,
    screenshotFilename: PropTypes.string,
    download: PropTypes.shape(DownloadDataPropTypes),
    setProps: PropTypes.func,
    children: PropTypes.node,
};
