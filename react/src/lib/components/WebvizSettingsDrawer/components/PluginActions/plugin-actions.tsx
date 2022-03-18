import React from "react";

import { Badge } from "@material-ui/core";

import {
    camera,
    comment_solid,
    download,
    fullscreen,
    help,
    person,
    warning_outlined,
} from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";
Icon.add({
    camera,
    comment_solid,
    download,
    fullscreen,
    help,
    person,
    warning_outlined,
});

import { Animation } from "../../../../utils/Animation";
import { StoreActions, useStore } from "../../../WebvizContentManager";
import { AuthorDialog } from "../AuthorDialog/author-dialog";

import { useSnackbar } from "notistack";
import html2canvas from "html2canvas";
import downloadFile from "../../../../utils/downloadFile";

import "./plugin-actions.css";

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
    const [openAuthorDialog, setOpenAuthorDialog] = React.useState<boolean>(
        false
    );
    const { enqueueSnackbar } = useSnackbar();
    const openCloseAnimation = React.useRef<Animation<OpenCloseAnimationParameters> | null>(
        null
    );
    const flashAnimation = React.useRef<Animation<FlashAnimationParameters> | null>(
        null
    );

    const store = useStore();

    const pluginData = store.state.pluginsData.find(
        (el) => el.id === store.state.activePluginId
    );
    const deprecationWarnings = pluginData?.deprecationWarnings;
    const numDeprecationWarnings = deprecationWarnings?.length || 0;
    const feedbackUrl = pluginData?.feedbackUrl;

    const closedHeight = 7 * (12 * 2 + 24);

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

    const enqueueDeprecationWarnings = React.useCallback(() => {
        if (!deprecationWarnings) {
            return;
        }
        for (const warning of deprecationWarnings) {
            enqueueSnackbar(warning.message, {
                variant: "warning",
                action: (
                    <a
                        className="webviz-config-plugin-deprecation-link"
                        href={warning.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        More info
                    </a>
                ),
                anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "right",
                },
            });
        }
    }, [deprecationWarnings]);

    React.useEffect(() => {
        enqueueDeprecationWarnings();
    }, [store.state.activePluginId]);

    React.useLayoutEffect(() => {
        if (props.open === open) {
            return;
        }
        if (openCloseAnimation.current) {
            openCloseAnimation.current.reset();
        }

        openCloseAnimation.current = new Animation<OpenCloseAnimationParameters>(
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
                            const viewElements = Array.from(
                                store.state.activePluginWrapperRef.current.getElementsByClassName(
                                    "WebvizViewElement__Content"
                                )
                            );
                            viewElements.forEach((el) =>
                                el.classList.replace(
                                    "WebvizViewElement__Content",
                                    "WebvizViewElement__Content__flat"
                                )
                            );
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
                            viewElements.forEach((el) =>
                                el.classList.replace(
                                    "WebvizViewElement__Content__flat",
                                    "WebvizViewElement__Content"
                                )
                            );
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

    const handleFullscreenClicked = React.useCallback(() => {
        if (store.state.activePluginWrapperRef?.current) {
            /// Perform fullscreen
        }
    }, [store.state.activePluginWrapperRef]);

    const handleDeprecationWarningsClicked = React.useCallback(() => {
        enqueueDeprecationWarnings();
    }, [enqueueDeprecationWarnings]);

    const handleDownloadClicked = () => {
        store.dispatch({
            type: StoreActions.SetPluginDownloadRequested,
            payload: { request: true },
        });
    };

    const openInNewTab = (url: string) => {
        const newWindow = window.open(url, "_blank", "noopener,noreferrer");
        if (newWindow) newWindow.opener = null;
    };

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
            <div
                className="WebvizPluginActions__Button"
                onClick={() => handleFullscreenClicked()}
            >
                <Icon name="fullscreen" />
            </div>
            <div
                className="WebvizPluginActions__Button"
                onClick={() => handleScreenShotClicked()}
            >
                <Icon name="camera" />
            </div>
            {pluginData?.showDownload && (
                <div
                    className="WebvizPluginActions__Button"
                    onClick={handleDownloadClicked}
                >
                    <Icon name="download" />
                </div>
            )}
            <div className="WebvizPluginActions__Spacer"></div>
            {numDeprecationWarnings > 0 && (
                <div
                    className="WebvizPluginActions__Button"
                    onClick={handleDeprecationWarningsClicked}
                >
                    <Badge
                        className="WebvizPluginActions__Button_Badge"
                        badgeContent={numDeprecationWarnings}
                        color="primary"
                    >
                        <Icon name="warning_outlined" />
                    </Badge>
                </div>
            )}
            {pluginData?.contactPerson && (
                <div
                    className="WebvizPluginActions__Button"
                    onClick={() => setOpenAuthorDialog(true)}
                >
                    <Icon name="person" />
                </div>
            )}
            <div className="WebvizPluginActions__Button">
                <Icon name="help" />
            </div>
            {feedbackUrl && (
                <div
                    className="WebvizPluginActions__Button"
                    onClick={() => openInNewTab(feedbackUrl)}
                >
                    <Icon name="comment_solid" />
                </div>
            )}
            {pluginData?.contactPerson && (
                <AuthorDialog
                    open={openAuthorDialog}
                    onClose={() => setOpenAuthorDialog(false)}
                    author={pluginData.contactPerson}
                />
            )}
        </div>
    );
};
