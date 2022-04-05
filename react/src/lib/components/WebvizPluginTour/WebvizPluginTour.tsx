import useSize from "@react-hook/size";
import React from "react";
import * as ReactDOM from "react-dom";
import { useStore } from "../WebvizContentManager";

import "./webviz-plugin-tour.css";

export type WebvizPluginTourProps = {
    open: boolean;
};

export const WebvizPluginTour: React.FC<WebvizPluginTourProps> = (
    props: WebvizPluginTourProps
) => {
    const [elementBoundingClientRect, setElementBoundingClientRect] =
        React.useState<DOMRect | null>();
    const [currentTourStep, setCurrentTourStep] = React.useState<number>(0);
    const [elementId, setElementId] = React.useState<string>("");

    const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

    const store = useStore();
    const webvizPluginTourRef = React.useRef<HTMLDivElement>(null);

    const windowSize = useSize(webvizPluginTourRef.current);

    const pluginData = store.state.pluginsData.find(
        (el) => el.id === store.state.activePluginId
    );
    const tourSteps = pluginData?.tourSteps;

    React.useEffect(() => {
        resizeObserverRef.current = new ResizeObserver(() => {
            setElementBoundingClientRect(
                document.querySelector(elementId)?.getBoundingClientRect()
            );
        });
    }, [elementId]);

    React.useEffect(() => {
        if (props.open && tourSteps) {
            setCurrentTourStep(0);
            setElementId(tourSteps[0].elementId);
            const elementId = tourSteps[0].elementId;
            setElementBoundingClientRect(
                document.querySelector(elementId)?.getBoundingClientRect()
            );
        }
    }, [props.open, tourSteps]);

    React.useEffect(() => {
        const element = document.getElementById(elementId);
        if (resizeObserverRef.current && element) {
            resizeObserverRef.current.observe(element);
        }
    }, [elementId, resizeObserverRef.current]);

    if (!props.open || !elementBoundingClientRect) {
        return null;
    }

    const clippingPathPoints = [
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
    ];

    return ReactDOM.createPortal(
        <>
            {elementBoundingClientRect && (
                <div className="WebvizPluginTour" ref={webvizPluginTourRef}>
                    <div className="WebvizPluginTour__Content">
                        {currentTourStep}
                    </div>
                    <svg
                        width={windowSize[0]}
                        height={windowSize[1]}
                        xmlns="http://www.w3.org/2000/svg"
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
                </div>
            )}
        </>,
        document.body
    );
};
