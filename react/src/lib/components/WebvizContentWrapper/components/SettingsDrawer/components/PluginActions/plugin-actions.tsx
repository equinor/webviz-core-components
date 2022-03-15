import React from "react";

import { fullscreen, camera, comment_solid, help } from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";
Icon.add({ fullscreen, camera, comment_solid, help });

import { Animation } from "../../../../../../utils/Animation";

import "./plugin-actions.css";

type PluginActionsProps = {
    open: boolean;
};

type AnimationParameters = {
    marginBottom: number;
};

export const PluginActions: React.FC<PluginActionsProps> = (
    props: PluginActionsProps
) => {
    const [marginBottom, setMarginBottom] = React.useState<number>(0);
    const [open, setOpen] = React.useState<boolean>(props.open);
    const animation = React.useRef<Animation<AnimationParameters> | null>(null);

    const closedHeight = 4 * (12 * 2 + 24);

    React.useEffect(() => {
        return () => {
            if (animation.current) {
                animation.current.reset();
            }
        };
    }, []);

    React.useLayoutEffect(() => {
        if (props.open === open) {
            return;
        }
        if (animation.current) {
            animation.current.reset();
        }

        animation.current = new Animation<AnimationParameters>(
            900,
            20,
            [
                {
                    t: 0,
                    state: { marginBottom: 0 },
                },
                {
                    t: 2 / 3,
                    state: { marginBottom: -closedHeight },
                },
                {
                    t: 1,
                    state: { marginBottom: 0 },
                },
            ],
            Animation.Bezier,
            (values, t) => {
                if (t === 2 / 3) {
                    setOpen(!open);
                }
                setMarginBottom(values.marginBottom);
            }
        );

        animation.current.start();
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
