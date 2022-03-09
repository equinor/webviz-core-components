import React from "react";

import { fullscreen, camera, comment_solid, help } from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";
Icon.add({ fullscreen, camera, comment_solid, help });

import "./plugin-actions.css";

type PluginActionsProps = {
    open: boolean;
};

const quadEaseIn = (t: number): number => {
    return t * t;
};

const quadEaseOut = (t: number): number => {
    return -(t - 1) * (t - 1) + 1;
};

export const PluginActions: React.FC<PluginActionsProps> = (
    props: PluginActionsProps
) => {
    const [marginBottom, setMarginBottom] = React.useState<number>(0);
    const [open, setOpen] = React.useState<boolean>(props.open);
    const transitionInterval =
        React.useRef<ReturnType<typeof setInterval> | null>(null);

    const closedHeight = 4 * (12 * 2 + 24);

    React.useEffect(() => {
        return () => {
            if (transitionInterval.current) {
                clearInterval(transitionInterval.current);
            }
        };
    }, []);

    React.useLayoutEffect(() => {
        if (props.open === open) {
            return;
        }
        if (transitionInterval.current) {
            clearInterval(transitionInterval.current);
        }
        let direction = "down";
        let currentMargin = marginBottom;
        let currentTransitionTime = 0;
        const transitionDeltaT = 20;
        transitionInterval.current = setInterval(() => {
            if (currentMargin === -closedHeight && direction === "down") {
                direction = "up";
                setOpen(!open);
                currentTransitionTime = 0;
            }
            const totalTransitionTime =
                direction === "down" && props.open ? 300 : 600;

            if (direction === "down") {
                currentMargin =
                    quadEaseIn(currentTransitionTime / totalTransitionTime) *
                    -closedHeight;
            } else {
                currentMargin =
                    (1 -
                        quadEaseOut(
                            currentTransitionTime / totalTransitionTime
                        )) *
                    -closedHeight;
            }

            setMarginBottom(currentMargin);
            if (direction === "up" && currentMargin === 0) {
                if (transitionInterval.current) {
                    clearInterval(transitionInterval.current);
                }
            }
            currentTransitionTime += transitionDeltaT;
        }, transitionDeltaT);
    }, [props.open]);

    return (
        <div
            className="WebvizPluginActions"
            style={{
                flexDirection: open ? "row" : "column",
                height: open ? "auto" : closedHeight,
                background: open ? "" : "none",
                marginBottom: marginBottom,
            }}
        >
            <div className="WebvizPluginActions__Button">
                <Icon name="fullscreen" />
            </div>
            <div className="WebvizPluginActions__Button">
                <Icon name="camera" />
            </div>
            <div className="WebvizPluginActions__Spacer"></div>
            <div className="WebvizPluginActions__Button">
                <Icon name="help" />
            </div>
            <div className="WebvizPluginActions__Button">
                <Icon name="comment_solid" />
            </div>
        </div>
    );
};
