import React from "react";

import { Badge, Tooltip } from "@material-ui/core";

import {
    camera,
    comment_solid,
    download,
    fullscreen,
    fullscreen_exit,
    help,
    person,
    warning_outlined,
    view_carousel,
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
    view_carousel,
});

import { Animation } from "../../../../utils/Animation";
import { StoreActions, useStore } from "../../../WebvizContentManager";
import { AuthorDialog } from "../AuthorDialog/author-dialog";

import { useSnackbar } from "notistack";
import html2canvas from "html2canvas";
import downloadFile from "../../../../utils/downloadFile";

import "./plugin-actions.css";
import { WebvizPluginTour } from "../../../../components/WebvizPluginTour/WebvizPluginTour";

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
    const [openAuthorDialog, setOpenAuthorDialog] =
        React.useState<boolean>(false);
    const [tourIsOpen, setTourIsOpen] = React.useState<boolean>(false);

    const { enqueueSnackbar } = useSnackbar();

    const openCloseAnimation =
        React.useRef<Animation<OpenCloseAnimationParameters> | null>(null);
    const fullScreenAnimation =
        React.useRef<Animation<FullScreenAnimationParameters> | null>(null);
    const flashAnimation =
        React.useRef<Animation<FlashAnimationParameters> | null>(null);

    const store = useStore();

    const pluginData = store.state.pluginsData.find(
        (el) => el.id === store.state.activePluginId
    );
    const deprecationWarnings = pluginData?.deprecationWarnings;
    const numDeprecationWarnings = deprecationWarnings?.length || 0;
    const feedbackUrl = pluginData?.feedbackUrl;
    const tourSteps = pluginData?.tourSteps;
    const showDownload = pluginData?.views.find(
        (view) => view.id === pluginData?.activeViewId
    )?.showDownload;

    const closedHeight = 7 * (12 * 2 + 24);

    React.useLayoutEffect(() => {
        if (props.open === open) {
            return;
        }
        if (openCloseAnimation.current) {
            openCloseAnimation.current.reset();
        }

        if (!store.state.externalTrigger) {
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
        } else {
            setOpen(!open);
            setMarginBottom(0);
        }
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

            const fullScreenContainer =
                store.state.activePluginWrapperRef?.current.getElementsByClassName(
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
                            const actions =
                                fullScreenContainer.getElementsByClassName(
                                    "WebvizFullScreenMenu"
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

    const handleFullScreenClick = React.useCallback(() => {
        if (fullScreenAnimation.current) {
            fullScreenAnimation.current.reset();
        }
        if (store.state.activePluginWrapperRef?.current) {
            const rect =
                store.state.activePluginWrapperRef.current.getBoundingClientRect();

            const contentWidthWithPadding = parseInt(
                getComputedStyle(store.state.activePluginWrapperRef.current)
                    ?.width || "0"
            );
            const contentHeightWithPadding = parseInt(
                getComputedStyle(store.state.activePluginWrapperRef.current)
                    ?.height || "0"
            );

            Object.assign(store.state.activePluginWrapperRef.current.style, {
                width: `${contentWidthWithPadding}px`,
                height: `${contentHeightWithPadding}px`,
            });

            const fullScreenContainer = Array.from(
                store.state.activePluginWrapperRef.current.getElementsByClassName(
                    "WebvizPluginWrapper__FullScreenContainer"
                )
            ).find((_, index) => index === 0) as HTMLDivElement | undefined;

            if (fullScreenContainer) {
                Object.assign(fullScreenContainer.style, {
                    position: "fixed",
                    left: `${rect.left}px`,
                    top: `${rect.top}px`,
                    width: `${contentWidthWithPadding - 32}px`,
                    height: `${contentHeightWithPadding - 32}px`,
                    "z-index": "1199",
                    "background-color": "#fff",
                });
            }

            const initialFullScreenContainerPadding =
                (fullScreenContainer &&
                    getComputedStyle(fullScreenContainer)?.paddingTop) ||
                "0";

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
                                height: contentHeightWithPadding - 32,
                                width: contentWidthWithPadding - 32,
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
                                height:
                                    window.innerHeight -
                                    (parseInt(
                                        initialFullScreenContainerPadding
                                    ) +
                                        56),
                                width: window.innerWidth,
                                backdropOpacity: 1,
                                paddingTop:
                                    parseInt(
                                        initialFullScreenContainerPadding
                                    ) + 56,
                            },
                        },
                    ],
                    Animation.Bezier,
                    (values, t) => {
                        store.dispatch({
                            type: StoreActions.SetBackdropOpacity,
                            payload: { opacity: values.backdropOpacity },
                        });
                        if (fullScreenContainer) {
                            if (t === 1) {
                                Object.assign(fullScreenContainer.style, {
                                    left: "0px",
                                    top: "0px",
                                    width: "100vw",
                                    height: `calc(100vh - ${
                                        parseInt(
                                            initialFullScreenContainerPadding
                                        ) + 56
                                    }px)`,
                                    "padding-top": `${
                                        parseInt(
                                            initialFullScreenContainerPadding
                                        ) + 56
                                    }px`,
                                });
                                return;
                            }
                            Object.assign(fullScreenContainer.style, {
                                left: `${values.left}px`,
                                top: `${values.top}px`,
                                width: `${values.width}px`,
                                height: `${values.height}px`,
                                "padding-top": `${values.paddingTop}px`,
                            });
                        }
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
            const rect =
                store.state.activePluginWrapperRef.current.getBoundingClientRect();

            const contentWidthWithoutPadding = parseInt(
                getComputedStyle(store.state.activePluginWrapperRef.current)
                    ?.width || "0"
            );

            const contentHeightWithoutPadding =
                parseInt(
                    getComputedStyle(store.state.activePluginWrapperRef.current)
                        ?.height || "0"
                ) - 32;

            const fullScreenContainer = Array.from(
                store.state.activePluginWrapperRef.current.getElementsByClassName(
                    "WebvizPluginWrapper__FullScreenContainer"
                )
            ).find((_, index) => index === 0) as HTMLDivElement | undefined;

            const initialFullScreenContainerPadding =
                (fullScreenContainer &&
                    getComputedStyle(fullScreenContainer)?.paddingTop) ||
                "0";

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
                                height:
                                    window.innerHeight -
                                    (parseInt(
                                        initialFullScreenContainerPadding
                                    ) +
                                        56),
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
                                    parseInt(
                                        initialFullScreenContainerPadding
                                    ) - 56,
                            },
                        },
                    ],
                    Animation.Bezier,
                    (values, t) => {
                        store.dispatch({
                            type: StoreActions.SetBackdropOpacity,
                            payload: { opacity: values.backdropOpacity },
                        });
                        if (fullScreenContainer) {
                            if (t === 1) {
                                Object.assign(fullScreenContainer.style, {
                                    left: "",
                                    top: "",
                                    width: "",
                                    height: "",
                                    position: "",
                                    "padding-top": "",
                                    "z-index": "",
                                    "background-color": "",
                                });
                                if (
                                    store.state.activePluginWrapperRef?.current
                                ) {
                                    Object.assign(
                                        store.state.activePluginWrapperRef
                                            .current.style,
                                        {
                                            width: "",
                                            height: "",
                                        }
                                    );
                                }
                                return;
                            }
                            Object.assign(fullScreenContainer.style, {
                                left: `${values.left}px`,
                                top: `${values.top}px`,
                                width: `${values.width}px`,
                                height: `${values.height}px`,
                                "padding-top": `${values.paddingTop}px`,
                            });
                        }
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
        store.state.activeViewDownloadCallback();
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
                onClick={() => handleFullScreenClick()}
            >
                <Tooltip title="Open active plugin in fullscreen mode">
                    <Icon name="fullscreen" />
                </Tooltip>
            </div>
            <div
                className="WebvizPluginActions__Button"
                onClick={() => handleScreenShotClick()}
            >
                <Tooltip title="Take a screenshot from active plugin">
                    <Icon name="camera" />
                </Tooltip>
            </div>
            {showDownload && (
                <div
                    className="WebvizPluginActions__Button"
                    onClick={handleDownloadClick}
                >
                    <Tooltip title="Download data from active plugin">
                        <Icon name="download" />
                    </Tooltip>
                </div>
            )}
            <div className="WebvizPluginActions__Spacer"></div>
            {numDeprecationWarnings > 0 && (
                <div
                    className="WebvizPluginActions__Button"
                    onClick={handleDeprecationWarningsClick}
                >
                    <Tooltip title="Show deprecation warnings for active plugin">
                        <Badge
                            className="WebvizPluginActions__Button_Badge"
                            badgeContent={numDeprecationWarnings}
                            color="primary"
                        >
                            <Icon name="warning_outlined" />
                        </Badge>
                    </Tooltip>
                </div>
            )}
            {pluginData?.contactPerson && (
                <div
                    className="WebvizPluginActions__Button"
                    onClick={() => setOpenAuthorDialog(true)}
                >
                    <Tooltip title="View active plugin's author">
                        <Icon name="person" />
                    </Tooltip>
                </div>
            )}
            {tourSteps && (
                <div
                    className="WebvizPluginActions__Button"
                    onClick={() => setTourIsOpen(true)}
                >
                    <Tooltip title="Start a tour through the active plugin">
                        <Icon name="help" />
                    </Tooltip>
                </div>
            )}
            {feedbackUrl && (
                <div
                    className="WebvizPluginActions__Button"
                    onClick={() => openInNewTab(feedbackUrl)}
                >
                    <Tooltip title="Report issue/give feedback on the active plugin">
                        <Icon name="comment_solid" />
                    </Tooltip>
                </div>
            )}
            {pluginData?.contactPerson && (
                <AuthorDialog
                    open={openAuthorDialog}
                    onClose={() => setOpenAuthorDialog(false)}
                    author={pluginData.contactPerson}
                />
            )}
            {tourSteps && (
                <WebvizPluginTour
                    open={tourIsOpen}
                    onClose={() => setTourIsOpen(false)}
                />
            )}
        </div>
    );
};
