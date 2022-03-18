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

import "./webviz-view-element.css";
import PropTypes from "prop-types";
import html2canvas from "html2canvas";
import downloadFile from "../../utils/downloadFile";

Icon.add({ settings, download, camera, fullscreen, fullscreen_exit });

export type WebvizViewElementProps = {
    id: string;
    flexGrow?: number;
    screenshotFilename?: string;
    children?: React.ReactNode;
};

type FullScreenAnimationParameters = {
    left: number;
    top: number;
    height: number;
    width: number;
    backdropOpacity: number;
};

type FlashAnimationParameters = {
    opacity: number;
};

export const WebvizViewElement: React.FC<WebvizViewElementProps> = (props) => {
    const [isHovered, setIsHovered] = React.useState<boolean>(false);
    const [fullScreenContainerStyle, setFullScreenContainerStyle] =
        React.useState<React.CSSProperties>({});
    const [contentStyle, setContentStyle] = React.useState<React.CSSProperties>(
        {}
    );
    const [backdropStyle, setBackdropStyle] =
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

    const handleFullScreenClick = () => {
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
                zIndex: 1300,
                padding: parseInt(
                    getComputedStyle(contentRef.current)?.padding || "0"
                ),
                backgroundColor: "white",
                boxShadow: "1px 2px 6px -1px rgba(0, 0, 0, 0.33)",
            };

            setFullScreenContainerStyle(style);
            setBackdropStyle({ display: "block" });
            setContentStyle({
                width: contentWidthWithoutPadding,
                height: contentHeightWithoutPadding,
                zIndex: "auto",
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
                            },
                        },
                    ],
                    Animation.Bezier,
                    (values, t) => {
                        if (t === 1) {
                            const newStyle: React.CSSProperties = {
                                ...style,
                                left: 0,
                                top: 0,
                                width: "100vw",
                                height: "100vh",
                            };
                            setFullScreenContainerStyle(newStyle);
                            setIsHovered(false);
                            return;
                        }
                        const newStyle: React.CSSProperties = {
                            ...style,
                            left: values.left,
                            top: values.top,
                            width: values.width,
                            height: values.height,
                        };
                        setFullScreenContainerStyle(newStyle);
                        setBackdropStyle({
                            opacity: values.backdropOpacity,
                            display: "block",
                        });
                    }
                );
            fullScreenAnimation.current.start();
        }
    };

    const handleLeaveFullScreenClick = () => {
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

            const style = fullScreenContainerStyle;

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
                            },
                        },
                    ],
                    Animation.Bezier,
                    (values, t) => {
                        if (t === 1) {
                            setFullScreenContainerStyle({});
                            setBackdropStyle({});
                            setContentStyle({});
                            return;
                        }
                        const newStyle: React.CSSProperties = {
                            ...style,
                            left: values.left,
                            top: values.top,
                            width: values.width,
                            height: values.height,
                        };
                        setFullScreenContainerStyle(newStyle);
                        setBackdropStyle({
                            opacity: values.backdropOpacity,
                            display: "block",
                        });
                    }
                );
            fullScreenAnimation.current.start();
        }
    };

    const handleScreenShotClick = () => {
        if (fullScreenContainerRef.current) {
            if (flashAnimation.current) {
                flashAnimation.current.reset();
            }

            const flash = document.body.appendChild(
                document.createElement("div")
            );
            flash.className = "WebvizCameraFlash";

            flashAnimation.current = new Animation<FlashAnimationParameters>(
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
                            const actions =
                                fullScreenContainerRef.current.getElementsByClassName(
                                    "WebvizViewElement__FullScreenActions"
                                );
                            for (const action of actions) {
                                (action as HTMLDivElement).style.display =
                                    "none";
                            }
                            flash.style.opacity = "0";
                            html2canvas(fullScreenContainerRef.current, {
                                scrollX: -window.scrollX,
                                scrollY: -window.scrollY,
                            }).then((canvas) =>
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
                            for (const action of actions) {
                                (action as HTMLDivElement).style.display =
                                    "block";
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

    return (
        <div
            className="WebvizViewElement"
            style={{ flexGrow: props.flexGrow || 1 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="WebvizViewElement__Backdrop"
                style={backdropStyle}
            />
            <div
                className="WebvizViewElement__Content"
                ref={contentRef}
                style={contentStyle}
            >
                <div
                    ref={fullScreenContainerRef}
                    style={fullScreenContainerStyle}
                    className="WebvizViewElement__FullScreenContainer"
                >
                    {props.children}
                    <div
                        className="WebvizViewElement__FullScreenActions"
                        style={backdropStyle}
                    >
                        <IconButton onClick={handleLeaveFullScreenClick}>
                            <Icon name="fullscreen_exit" />
                        </IconButton>
                        <IconButton onClick={handleScreenShotClick}>
                            <Icon name="camera" />
                        </IconButton>
                    </div>
                </div>
            </div>
            <div
                className={
                    isHovered
                        ? "WebvizViewElement__Actions__hover"
                        : "WebvizViewElement__Actions"
                }
            >
                {false && (
                    <div>
                        <IconButton>
                            <Icon name="settings" size={16} />
                        </IconButton>
                    </div>
                )}
                <div className="WebvizViewElement__Actions__Spacer" />
                <div>
                    <IconButton>
                        <Icon name="download" size={16} />
                    </IconButton>
                </div>
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
        </div>
    );
};

WebvizViewElement.propTypes = {
    id: PropTypes.string.isRequired,
    flexGrow: PropTypes.number,
    screenshotFilename: PropTypes.string,
    children: PropTypes.node,
};
