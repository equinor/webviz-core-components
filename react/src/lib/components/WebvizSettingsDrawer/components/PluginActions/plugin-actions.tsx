import React from "react";

import { fullscreen, camera, comment_solid, help } from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";
Icon.add({ fullscreen, camera, comment_solid, help });

import { Animation } from "../../../../utils/Animation";

import "./plugin-actions.css";
import { useStore } from "../../../WebvizContentManager";
import html2canvas from "html2canvas";
import downloadFile from "../../../../utils/downloadFile";

type PluginActionsProps = {
    open: boolean;
};

type OpenCloseAnimationParameters = {
    marginBottom: number;
};

type FlashAnimationParameters = {
    opacity: number;
};

export const PluginActions: React.FC<PluginActionsProps> = (
    props: PluginActionsProps
) => {
    const [marginBottom, setMarginBottom] = React.useState<number>(0);
    const [open, setOpen] = React.useState<boolean>(props.open);
    const openCloseAnimation =
        React.useRef<Animation<OpenCloseAnimationParameters> | null>(null);
    const flashAnimation =
        React.useRef<Animation<FlashAnimationParameters> | null>(null);

    const store = useStore();

    const pluginData = store.state.pluginsData.find(
        (el) => el.id === store.state.activePluginId
    );

    const closedHeight = 4 * (12 * 2 + 24);

    React.useEffect(() => {
        return () => {
            if (openCloseAnimation.current) {
                openCloseAnimation.current.reset();
            }
            if (flashAnimation.current) {
                flashAnimation.current.reset();
            }
        };
    }, []);

    React.useLayoutEffect(() => {
        if (props.open === open) {
            return;
        }
        if (openCloseAnimation.current) {
            openCloseAnimation.current.reset();
        }

        openCloseAnimation.current =
            new Animation<OpenCloseAnimationParameters>(
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

        openCloseAnimation.current.start();
    }, [props.open]);

    const handleScreenShotClicked = React.useCallback(() => {
        if (store.state.activePluginWrapperRef?.current) {
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
                    if (store.state.activePluginWrapperRef?.current) {
                        if (t === 0.5) {
                            let viewElements =
                                store.state.activePluginWrapperRef.current.getElementsByClassName(
                                    "WebvizViewElement__Content"
                                );
                            for (const viewElement of viewElements) {
                                viewElement.className =
                                    "WebvizViewElement__Content__flat";
                            }
                            flash.style.opacity = "0";
                            html2canvas(
                                store.state.activePluginWrapperRef.current,
                                {
                                    scrollX: -window.scrollX,
                                    scrollY: -window.scrollY,
                                }
                            ).then((canvas) =>
                                canvas.toBlob((blob) => {
                                    if (blob !== null) {
                                        downloadFile({
                                            filename:
                                                pluginData?.screenshotFilename ||
                                                "webviz_screenshot.png",
                                            data: blob,
                                            mimeType: "image/png",
                                        });
                                    }
                                })
                            );
                            flash.style.opacity = "1";
                            viewElements =
                                store.state.activePluginWrapperRef.current.getElementsByClassName(
                                    "WebvizViewElement__Content__flat"
                                );
                            for (const viewElement of viewElements) {
                                viewElement.className =
                                    "WebvizViewElement__Content";
                            }
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
    }, [store.state.activePluginWrapperRef, pluginData]);

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
            <div
                className="WebvizPluginActions__Button"
                onClick={() => handleScreenShotClicked()}
            >
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
