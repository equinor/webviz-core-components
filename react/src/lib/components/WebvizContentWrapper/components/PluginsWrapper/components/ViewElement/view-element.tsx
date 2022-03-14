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

import { Animation } from "../../../../../../utils/Animation";

import "./view-element.css";

Icon.add({ settings, download, camera, fullscreen, fullscreen_exit });

export type ViewElementProps = {
    id: string;
    children: React.ReactChild;
    settings?: React.ReactChild;
};

type AnimationParameters = {
    left: number;
    top: number;
    height: number;
    width: number;
    backdropOpacity: number;
};

export const ViewElement: React.FC<ViewElementProps> = (
    props: ViewElementProps
) => {
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
        React.useRef<Animation<AnimationParameters> | null>(null);

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

            fullScreenAnimation.current = new Animation<AnimationParameters>(
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
                (values: AnimationParameters, t: number) => {
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

            fullScreenAnimation.current = new Animation<AnimationParameters>(
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
                (values: AnimationParameters, t: number) => {
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

    return (
        <div
            className="WebvizViewElement"
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
                        className="WebvizViewElement__LeaveFullScreen"
                        onClick={handleLeaveFullScreenClick}
                        style={backdropStyle}
                    >
                        <Icon name="fullscreen_exit" />
                    </div>
                </div>
            </div>
            <div
                className="WebvizViewElement__Actions"
                style={{ width: isHovered ? 48 : 0 }}
            >
                <div className="WebvizViewElement__ActionsContent">
                    {props.settings && (
                        <div>
                            <IconButton>
                                <Icon name="settings" />
                            </IconButton>
                        </div>
                    )}
                    <div className="WebvizViewElement__Actions__Spacer" />
                    <div>
                        <IconButton>
                            <Icon name="download" />
                        </IconButton>
                    </div>
                    <div>
                        <IconButton>
                            <Icon name="camera" />
                        </IconButton>
                    </div>
                    <div>
                        <IconButton>
                            <Icon
                                name="fullscreen"
                                onClick={handleFullScreenClick}
                            />
                        </IconButton>
                    </div>
                </div>
            </div>
        </div>
    );
};
