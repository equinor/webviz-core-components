import { Button, MobileStepper } from "@material-ui/core";
import useSize from "@react-hook/size";
import React from "react";
import * as ReactDOM from "react-dom";
import { StoreActions, useStore } from "../WebvizContentManager";
import { Icon } from "@equinor/eds-core-react";
import { arrow_back, arrow_forward } from "@equinor/eds-icons";
Icon.add({ arrow_back, arrow_forward });

import "./webviz-plugin-tour.css";
import { Point } from "lib/shared-types/point";

export type WebvizPluginTourProps = {
    open: boolean;
    onClose: () => void;
};

export const WebvizPluginTour: React.FC<WebvizPluginTourProps> = (
    props: WebvizPluginTourProps
) => {
    const [elementBoundingClientRect, setElementBoundingClientRect] =
        React.useState<DOMRect | null>();
    const [currentTourStep, setCurrentTourStep] = React.useState<number>(0);
    const [clippingPathPoints, setClippingPathPoints] = React.useState<Point[]>(
        []
    );
    const [contentPosition, setContentPosition] = React.useState<{
        left: "auto" | number;
        top: "auto" | number;
        right: "auto" | number;
        bottom: "auto" | number;
    }>({
        left: "auto",
        top: "auto",
        right: "auto",
        bottom: "auto",
    });

    const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

    const store = useStore();
    const webvizPluginTourRef = React.useRef<HTMLDivElement>(null);

    const windowSize = useSize(webvizPluginTourRef.current);

    const pluginData = store.state.pluginsData.find(
        (el) => el.id === store.state.activePluginId
    );
    const tourSteps = pluginData?.tourSteps;

    React.useEffect(() => {
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
        }
        if (tourSteps) {
            resizeObserverRef.current = new ResizeObserver(() => {
                setElementBoundingClientRect(
                    document
                        .getElementById(tourSteps[currentTourStep].elementId)
                        ?.getBoundingClientRect()
                );
            });
            setElementBoundingClientRect(
                document
                    .getElementById(tourSteps[currentTourStep].elementId)
                    ?.getBoundingClientRect()
            );
        }
    }, [tourSteps, currentTourStep, store.state.viewUpdates]);

    React.useEffect(() => {
        if (props.open && tourSteps) {
            handleChangeTourStep(0);
        }
    }, [props.open, tourSteps]);

    React.useEffect(() => {
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
        }
        if (tourSteps) {
            const element = document.getElementById(
                tourSteps[currentTourStep].elementId
            );
            if (resizeObserverRef.current && element) {
                resizeObserverRef.current.observe(element);
            }
        }
    }, [tourSteps, currentTourStep, resizeObserverRef.current]);

    React.useEffect(() => {
        if (elementBoundingClientRect) {
            setClippingPathPoints([
                { x: 0, y: 0 },
                { x: 0, y: windowSize[1] },
                { x: elementBoundingClientRect.left, y: windowSize[1] },
                {
                    x: elementBoundingClientRect.left,
                    y: elementBoundingClientRect.top,
                },
                {
                    x: elementBoundingClientRect.right,
                    y: elementBoundingClientRect.top,
                },
                {
                    x: elementBoundingClientRect.right,
                    y: elementBoundingClientRect.bottom,
                },
                {
                    x: elementBoundingClientRect.left,
                    y: elementBoundingClientRect.bottom,
                },
                { x: elementBoundingClientRect.left, y: windowSize[1] },
                { x: windowSize[0], y: windowSize[1] },
                { x: windowSize[0], y: 0 },
            ]);

            const spacing = {
                left: elementBoundingClientRect.left,
                top: elementBoundingClientRect.top,
                right: windowSize[0] - elementBoundingClientRect.right,
                bottom: windowSize[1] - elementBoundingClientRect.bottom,
            };
            const maxSpacing = Math.max(...Object.values(spacing));
            const margin = 16;
            if (spacing.left === maxSpacing) {
                setContentPosition({
                    left: "auto",
                    bottom: "auto",
                    right:
                        windowSize[0] - elementBoundingClientRect.left + margin,
                    top: elementBoundingClientRect.top,
                });
            } else if (spacing.top === maxSpacing) {
                setContentPosition({
                    left: elementBoundingClientRect.left,
                    top: "auto",
                    right: "auto",
                    bottom:
                        windowSize[1] - elementBoundingClientRect.top + margin,
                });
            } else if (spacing.right === maxSpacing) {
                setContentPosition({
                    left: elementBoundingClientRect.right + margin,
                    top: elementBoundingClientRect.top,
                    right: "auto",
                    bottom: "auto",
                });
            } else if (spacing.bottom === maxSpacing) {
                setContentPosition({
                    left: elementBoundingClientRect.left,
                    top: elementBoundingClientRect.bottom + margin,
                    right: "auto",
                    bottom: "auto",
                });
            }
        }
    }, [windowSize, elementBoundingClientRect]);

    const handleChangeTourStep = React.useCallback(
        (newTourStep: number) => {
            if (!tourSteps) {
                return;
            }
            if (
                tourSteps[newTourStep].viewId !== pluginData?.activeViewId &&
                tourSteps[newTourStep].viewId !== ""
            ) {
                store.dispatch({
                    type: StoreActions.SetActiveView,
                    payload: { viewId: tourSteps[newTourStep].viewId },
                });
            }
            if (tourSteps[newTourStep].settingsGroupId) {
                store.dispatch({
                    type: StoreActions.SetSettingsDrawerOpen,
                    payload: {
                        settingsDrawerOpen: true,
                        externalTrigger: true,
                    },
                });
                store.dispatch({
                    type: StoreActions.SetOpenSettingsGroupId,
                    payload: {
                        settingsGroupId:
                            tourSteps[newTourStep].settingsGroupId || "",
                    },
                });
            }
            setCurrentTourStep(newTourStep);
        },
        [tourSteps, pluginData?.activeViewId]
    );

    return ReactDOM.createPortal(
        <div className="WebvizPluginTour" ref={webvizPluginTourRef}>
            {elementBoundingClientRect && props.open && (
                <>
                    <div
                        className="WebvizPluginTour__Content"
                        style={{
                            left: contentPosition.left,
                            top: contentPosition.top,
                            right: contentPosition.right,
                            bottom: contentPosition.bottom,
                        }}
                    >
                        {pluginData && (
                            <div className="WebvizPluginTour__View">
                                <Icon name="view_carousel" />
                                <span>
                                    {pluginData.views.find(
                                        (view) =>
                                            tourSteps &&
                                            view.id ===
                                                tourSteps[currentTourStep]
                                                    .viewId
                                    )?.name || "Shared settings"}
                                </span>
                            </div>
                        )}
                        {tourSteps && tourSteps[currentTourStep].content}
                        {tourSteps && tourSteps.length > 1 && (
                            <MobileStepper
                                variant={
                                    tourSteps.length > 30 ? "progress" : "dots"
                                }
                                steps={tourSteps.length}
                                position="bottom"
                                activeStep={currentTourStep}
                                nextButton={
                                    <Button
                                        size="small"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handleChangeTourStep(
                                                currentTourStep + 1
                                            );
                                        }}
                                        disabled={
                                            currentTourStep ===
                                            tourSteps.length - 1
                                        }
                                    >
                                        Next
                                        <Icon name="arrow_forward" />
                                    </Button>
                                }
                                backButton={
                                    <Button
                                        size="small"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handleChangeTourStep(
                                                currentTourStep - 1
                                            );
                                        }}
                                        disabled={currentTourStep === 0}
                                    >
                                        <Icon name="arrow_back" />
                                        Back
                                    </Button>
                                }
                            />
                        )}
                    </div>
                    <svg
                        width={windowSize[0]}
                        height={windowSize[1]}
                        xmlns="http://www.w3.org/2000/svg"
                        onClick={() => props.onClose()}
                        className="WebvizPluginTour__SVG"
                    >
                        <defs>
                            <mask id="WebvizPluginTour__Mask">
                                <rect
                                    x="0"
                                    y="0"
                                    width={windowSize[0]}
                                    height={windowSize[1]}
                                    fill="white"
                                />
                                <rect
                                    x={elementBoundingClientRect.x}
                                    y={elementBoundingClientRect.y}
                                    width={elementBoundingClientRect.width}
                                    height={elementBoundingClientRect.height}
                                    fill="black"
                                    rx="0"
                                />
                            </mask>
                            <clipPath id="WebvizPluginTour__ClipPath">
                                <polygon
                                    points={clippingPathPoints
                                        .map((point) => `${point.x} ${point.y}`)
                                        .join(",")}
                                />
                            </clipPath>
                        </defs>
                        <rect
                            className="WebvizPluginTour__Mask"
                            mask="url(#WebvizPluginTour__Mask)"
                            width={windowSize[0]}
                            height={windowSize[1]}
                        />
                        <rect
                            className="WebvizPluginTour__ClipPath"
                            width={windowSize[0]}
                            height={windowSize[1]}
                        />
                    </svg>
                </>
            )}
        </div>,
        document.body
    );
};
