import React from "react";

import { Badge } from "@material-ui/core";

import {
    camera,
    comment_solid,
    download,
    fullscreen,
    fullscreen_exit,
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
    fullscreen_exit,
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
    const fullScreenAnimation = React.useRef<Animation<FullScreenAnimationParameters> | null>(
        null
    );
    const flashAnimation = React.useRef<Animation<FlashAnimationParameters> | null>(
        null
    );

    const handleLeaveFullScreenClickRef = React.useRef<(() => void) | null>(
        null
    );
    const handleScreenShotClickRef = React.useRef<(() => void) | null>(null);

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
            if (fullScreenAnimation.current) {
                fullScreenAnimation.current.reset();
            }

            // Remove event listeners
            if (handleLeaveFullScreenClickRef.current) {
                if (store.state.activePluginWrapperRef?.current) {
                    const fullScreenExitAction = store.state.activePluginWrapperRef.current.getElementsByClassName(
                        "WebvizPluginWrapper__FullScreen_ExitButton"
                    )[0] as HTMLDivElement;
                    fullScreenExitAction.removeEventListener(
                        "click",
                        handleLeaveFullScreenClickRef.current
                    );
                }
                handleLeaveFullScreenClickRef.current = null;
            }
            if (handleScreenShotClickRef.current) {
                if (store.state.activePluginWrapperRef?.current) {
                    const fullScreenScreenShotAction = store.state.activePluginWrapperRef.current.getElementsByClassName(
                        "WebvizPluginWrapper__FullScreen_ScreenshotButton"
                    )[0] as HTMLDivElement;
                    fullScreenScreenShotAction.removeEventListener(
                        "click",
                        handleScreenShotClickRef.current
                    );
                }
                handleScreenShotClickRef.current = null;
            }
        };
    }, []);

    React.useEffect(() => {
        if (!store.state.activePluginWrapperRef?.current) {
            return;
        }

        const fullScreenExitAction = store.state.activePluginWrapperRef.current.getElementsByClassName(
            "WebvizPluginWrapper__FullScreen_ExitButton"
        )[0] as HTMLDivElement;
        const fullScreenScreenShotAction = store.state.activePluginWrapperRef.current.getElementsByClassName(
            "WebvizPluginWrapper__FullScreen_ScreenshotButton"
        )[0] as HTMLDivElement;

        // Remove existing event listeners
        if (handleLeaveFullScreenClickRef.current) {
            fullScreenExitAction.removeEventListener(
                "click",
                handleLeaveFullScreenClickRef.current
            );
        }
        if (handleScreenShotClickRef.current) {
            fullScreenScreenShotAction.removeEventListener(
                "click",
                handleScreenShotClickRef.current
            );
        }

        // Update function refs
        handleLeaveFullScreenClickRef.current = () =>
            handleLeaveFullScreenClick();
        handleScreenShotClickRef.current = () => handleScreenShotClick();

        // Add event new listeners
        fullScreenExitAction.addEventListener(
            "click",
            handleLeaveFullScreenClickRef.current
        );

        fullScreenScreenShotAction.addEventListener(
            "click",
            handleScreenShotClickRef.current
        );
    }, [store.state.activePluginWrapperRef]);

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

    const handleScreenShotClick = React.useCallback(() => {
        if (store.state.activePluginWrapperRef?.current) {
            if (flashAnimation.current) {
                flashAnimation.current.reset();
            }

            const flash = document.body.appendChild(
                document.createElement("div")
            );
            flash.className = "WebvizCameraFlash";

            const fullScreenContainer = store.state.activePluginWrapperRef?.current.getElementsByClassName(
                "WebvizPluginWrapper__FullScreenContainer"
            )[0] as HTMLDivElement;

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
                    if (
                        store.state.activePluginWrapperRef?.current &&
                        fullScreenContainer
                    ) {
                        if (t === 0.5) {
                            const viewElements = Array.from(
                                store.state.activePluginWrapperRef.current.getElementsByClassName(
                                    "WebvizViewElement__Content"
                                )
                            );
                            const viewElementActions = Array.from(
                                store.state.activePluginWrapperRef.current.getElementsByClassName(
                                    "WebvizViewElement__Actions"
                                )
                            );
                            viewElements.forEach((el) =>
                                el.classList.replace(
                                    "WebvizViewElement__Content",
                                    "WebvizViewElement__Content__flat"
                                )
                            );
                            viewElementActions.forEach((el) =>
                                el.classList.replace(
                                    "WebvizViewElement__Actions",
                                    "WebvizViewElement__Actions__hidden"
                                )
                            );
                            const actions = fullScreenContainer.getElementsByClassName(
                                "WebvizPluginWrapper__FullScreenActions"
                            );
                            for (const action of actions) {
                                (action as HTMLDivElement).style.display =
                                    "none";
                            }
                            flash.style.opacity = "0";
                            html2canvas(fullScreenContainer, {
                                scrollX: -window.scrollX,
                                scrollY: -window.scrollY,
                            }).then((canvas) =>
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
                            viewElementActions.forEach((el) =>
                                el.classList.replace(
                                    "WebvizViewElement__Actions__hidden",
                                    "WebvizViewElement__Actions"
                                )
                            );
                            for (const action of actions) {
                                (action as HTMLDivElement).style.display =
                                    "block";
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

    const handleFullscreenClick = React.useCallback(() => {
        if (fullScreenAnimation.current) {
            fullScreenAnimation.current.reset();
        }
        if (store.state.activePluginWrapperRef?.current) {
            const rect = store.state.activePluginWrapperRef.current.getBoundingClientRect();

            const contentWidthWithoutPadding = parseInt(
                getComputedStyle(store.state.activePluginWrapperRef.current)
                    ?.width || "0"
            );
            const contentHeightWithoutPadding = parseInt(
                getComputedStyle(store.state.activePluginWrapperRef.current)
                    ?.height || "0"
            );

            const fullScreenContainer = store.state.activePluginWrapperRef.current.getElementsByClassName(
                "WebvizPluginWrapper__FullScreenContainer"
            )[0] as HTMLDivElement;
            const backdropDiv = store.state.activePluginWrapperRef.current.getElementsByClassName(
                "WebvizPluginWrapper__Backdrop"
            )[0] as HTMLDivElement;
            const fullScreenActions = store.state.activePluginWrapperRef.current.getElementsByClassName(
                "WebvizPluginWrapper__FullScreenActions"
            )[0] as HTMLDivElement;

            store.state.activePluginWrapperRef.current.style.width = `${contentWidthWithoutPadding}px`;
            store.state.activePluginWrapperRef.current.style.height = `${contentHeightWithoutPadding}px`;

            fullScreenContainer.style.position = "fixed";
            fullScreenContainer.style.left = `${rect.left}px`;
            fullScreenContainer.style.top = `${rect.top}px`;
            fullScreenContainer.style.width = `${contentWidthWithoutPadding}px`;
            fullScreenContainer.style.height = `${contentHeightWithoutPadding}px`;
            fullScreenContainer.style.zIndex = "1500";
            fullScreenContainer.style.backgroundColor = "white";
            fullScreenContainer.style.boxShadow =
                "1px 2px 6px -1px rgba(0, 0, 0, 0.33)";

            fullScreenActions.style.display = "block";
            backdropDiv.style.display = "block";

            const initialFullScreenContainerPadding =
                getComputedStyle(fullScreenContainer)?.paddingTop || "0";

            fullScreenAnimation.current = new Animation<FullScreenAnimationParameters>(
                1000,
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
                                initialFullScreenContainerPadding
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
                            paddingTop:
                                parseInt(initialFullScreenContainerPadding) +
                                56,
                        },
                    },
                ],
                Animation.Bezier,
                (values, t) => {
                    if (t === 1) {
                        fullScreenContainer.style.left = "0px";
                        fullScreenContainer.style.top = "0px";
                        fullScreenContainer.style.width = "100vw";
                        fullScreenContainer.style.height = "100vh";
                        fullScreenContainer.style.paddingTop = `${
                            parseInt(initialFullScreenContainerPadding) + 56
                        }px`;

                        return;
                    }
                    fullScreenContainer.style.left = `${values.left}px`;
                    fullScreenContainer.style.top = `${values.top}px`;
                    fullScreenContainer.style.width = `${values.width}px`;
                    fullScreenContainer.style.height = `${values.height}px`;
                    fullScreenContainer.style.paddingTop = `${values.paddingTop}px`;

                    fullScreenActions.style.opacity = `${values.backdropOpacity}`;
                    backdropDiv.style.opacity = `${values.backdropOpacity}`;
                }
            );
            fullScreenAnimation.current.start();
        }
    }, [store.state.activePluginWrapperRef, fullScreenAnimation.current]);

    const handleLeaveFullScreenClick = React.useCallback(() => {
        if (fullScreenAnimation.current) {
            fullScreenAnimation.current.reset();
        }
        if (store.state.activePluginWrapperRef?.current) {
            const rect = store.state.activePluginWrapperRef.current.getBoundingClientRect();

            const contentWidthWithoutPadding = parseInt(
                getComputedStyle(store.state.activePluginWrapperRef.current)
                    ?.width || "0"
            );

            const contentHeightWithoutPadding = parseInt(
                getComputedStyle(store.state.activePluginWrapperRef.current)
                    ?.height || "0"
            );

            const fullScreenContainer = store.state.activePluginWrapperRef.current.getElementsByClassName(
                "WebvizPluginWrapper__FullScreenContainer"
            )[0] as HTMLDivElement;
            const backdropDiv = store.state.activePluginWrapperRef.current.getElementsByClassName(
                "WebvizPluginWrapper__Backdrop"
            )[0] as HTMLDivElement;
            const fullScreenActions = store.state.activePluginWrapperRef.current.getElementsByClassName(
                "WebvizPluginWrapper__FullScreenActions"
            )[0] as HTMLDivElement;

            store.state.activePluginWrapperRef.current.style.width = `${contentWidthWithoutPadding}px`;
            store.state.activePluginWrapperRef.current.style.height = `${contentHeightWithoutPadding}px`;

            const initialFullScreenContainerPadding =
                getComputedStyle(fullScreenContainer)?.paddingTop || "0";

            fullScreenActions.style.display = "block";
            backdropDiv.style.display = "block";
            fullScreenAnimation.current = new Animation<FullScreenAnimationParameters>(
                1000,
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
                            paddingTop: parseInt(
                                initialFullScreenContainerPadding
                            ),
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
                            paddingTop:
                                parseInt(initialFullScreenContainerPadding) -
                                56,
                        },
                    },
                ],
                Animation.Bezier,
                (values, t) => {
                    if (t === 1) {
                        fullScreenContainer.style.position = "";
                        fullScreenContainer.style.left = "";
                        fullScreenContainer.style.top = "";
                        fullScreenContainer.style.width = "";
                        fullScreenContainer.style.height = "";
                        fullScreenContainer.style.zIndex = "";
                        fullScreenContainer.style.padding = "";
                        fullScreenContainer.style.backgroundColor = "";
                        fullScreenContainer.style.boxShadow = "";
                        fullScreenContainer.style.paddingTop = "";

                        fullScreenActions.style.display = "None";
                        fullScreenActions.style.opacity = "0";
                        backdropDiv.style.display = "None";
                        backdropDiv.style.opacity = "0";

                        if (store.state.activePluginWrapperRef?.current) {
                            store.state.activePluginWrapperRef.current.style.width =
                                "";
                        }
                        if (store.state.activePluginWrapperRef?.current) {
                            store.state.activePluginWrapperRef.current.style.height =
                                "";
                        }

                        return;
                    }
                    fullScreenContainer.style.left = `${values.left}px`;
                    fullScreenContainer.style.top = `${values.top}px`;
                    fullScreenContainer.style.width = `${values.width}px`;
                    fullScreenContainer.style.height = `${values.height}px`;
                    fullScreenContainer.style.paddingTop = `${values.paddingTop}px`;

                    fullScreenActions.style.opacity = `${values.backdropOpacity}`;
                    backdropDiv.style.opacity = `${values.backdropOpacity}`;
                }
            );
            fullScreenAnimation.current.start();
        }
    }, [store.state.activePluginWrapperRef, fullScreenAnimation.current]);

    const handleDeprecationWarningsClick = React.useCallback(() => {
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

    const handleDownloadClick = () => {
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
                onClick={() => handleFullscreenClick()}
            >
                <Icon name="fullscreen" />
            </div>
            <div
                className="WebvizPluginActions__Button"
                onClick={() => handleScreenShotClick()}
            >
                <Icon name="camera" />
            </div>
            {pluginData?.showDownload && (
                <div
                    className="WebvizPluginActions__Button"
                    onClick={handleDownloadClick}
                >
                    <Icon name="download" />
                </div>
            )}
            <div className="WebvizPluginActions__Spacer"></div>
            {numDeprecationWarnings > 0 && (
                <div
                    className="WebvizPluginActions__Button"
                    onClick={handleDeprecationWarningsClick}
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
