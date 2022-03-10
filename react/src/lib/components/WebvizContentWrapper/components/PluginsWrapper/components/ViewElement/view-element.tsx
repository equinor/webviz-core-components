import { Icon } from "@equinor/eds-core-react";
import { IconButton } from "@material-ui/core";
import {
    settings,
    download,
    camera,
    fullscreen,
    block,
    fullscreen_exit,
} from "@equinor/eds-icons";
import React from "react";

import "./view-element.css";

Icon.add({ settings, download, camera, fullscreen, fullscreen_exit });

class Animation {
    private duration: number;
    private startValues: { [key: string]: number };
    private endValues: { [key: string]: number };
    private animationFunction: (t: number) => number;

    constructor(
        duration: number,
        startValues: { [key: string]: number },
        endValues: { [key: string]: number },
        animationFunction: (t: number) => number
    ) {
        this.duration = duration;
        this.startValues = startValues;
        this.endValues = endValues;
        this.animationFunction = animationFunction;

        if (
            JSON.stringify(Object.keys(this.startValues)) !==
            JSON.stringify(Object.keys(this.endValues))
        ) {
            throw "Start and end values lists must have the same keys!";
        }
    }

    getValues(time: number): { [key: string]: number } {
        const values: { [key: string]: number } = {};
        const t = time / this.duration;

        Object.keys(this.startValues).forEach((key) => {
            const delta = this.endValues[key] - this.startValues[key];
            values[key] =
                this.startValues[key] + this.animationFunction(t) * delta;
        });

        return values;
    }

    static quadEaseInOut(t: number): number {
        if (t <= 0.5) {
            return t * t;
        }
        return -(t - 1) * (t - 1) + 1;
    }

    static linear(t: number): number {
        return t;
    }

    static bezier(t: number): number {
        return t * t * (3 - 2 * t);
    }
}

export type ViewElementProps = {
    id: string;
    children: React.ReactChild;
    settings?: React.ReactChild;
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
    const fullScreenAnimationInterval =
        React.useRef<ReturnType<typeof setInterval> | null>(null);

    React.useEffect(() => {
        return () => {
            if (fullScreenAnimationInterval.current) {
                clearInterval(fullScreenAnimationInterval.current);
            }
        };
    }, []);

    const handleFullScreenClick = () => {
        if (fullScreenAnimationInterval.current) {
            clearInterval(fullScreenAnimationInterval.current);
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

            const animation = new Animation(
                1000,
                {
                    left: rect.left,
                    top: rect.top,
                    height: contentHeightWithoutPadding,
                    width: contentWidthWithoutPadding,
                    backdropOpacity: 0,
                },
                {
                    left: 0,
                    top: 0,
                    height: window.innerHeight,
                    width: window.innerWidth,
                    backdropOpacity: 1,
                },
                Animation.bezier
            );

            let currentTime = 0;

            fullScreenAnimationInterval.current = setInterval(() => {
                if (currentTime > 1000 && fullScreenAnimationInterval.current) {
                    const newStyle: React.CSSProperties = {
                        ...style,
                        left: 0,
                        top: 0,
                        width: "100vw",
                        height: "100vh",
                    };
                    setFullScreenContainerStyle(newStyle);
                    clearInterval(fullScreenAnimationInterval.current);
                    setIsHovered(false);
                    return;
                }
                const values = animation.getValues(currentTime);
                const newStyle: React.CSSProperties = {
                    ...style,
                    left: values["left"],
                    top: values["top"],
                    width: values["width"],
                    height: values["height"],
                };
                setFullScreenContainerStyle(newStyle);
                setBackdropStyle({
                    opacity: values["backdropOpacity"],
                    display: "block",
                });
                currentTime += 10;
            }, 10);
        }
    };

    const handleLeaveFullScreenClick = () => {
        if (fullScreenAnimationInterval.current) {
            clearInterval(fullScreenAnimationInterval.current);
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

            const animation = new Animation(
                1000,
                {
                    left: 0,
                    top: 0,
                    height: window.innerHeight,
                    width: window.innerWidth,
                    backdropOpacity: 1,
                },
                {
                    left: rect.left,
                    top: rect.top,
                    height: contentHeightWithoutPadding,
                    width: contentWidthWithoutPadding,
                    backdropOpacity: 0,
                },
                Animation.bezier
            );

            let currentTime = 0;

            fullScreenAnimationInterval.current = setInterval(() => {
                if (currentTime > 1000 && fullScreenAnimationInterval.current) {
                    setFullScreenContainerStyle({});
                    clearInterval(fullScreenAnimationInterval.current);
                    setBackdropStyle({});
                    setContentStyle({});
                    return;
                }
                const values = animation.getValues(currentTime);
                const newStyle: React.CSSProperties = {
                    ...style,
                    left: values["left"],
                    top: values["top"],
                    width: values["width"],
                    height: values["height"],
                };
                setFullScreenContainerStyle(newStyle);
                setBackdropStyle({
                    opacity: values["backdropOpacity"],
                    display: "block",
                });
                currentTime += 10;
            }, 10);
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
