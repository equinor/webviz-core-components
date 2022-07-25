import React from "react";

import { Point } from "../../../../../../shared-types/point";
import {
    MANHATTAN_LENGTH,
    ORIGIN,
    pointDistance,
    isPartlyContained,
    centerPointFromBoundingRect,
    dimensionsFromBoundingRect,
    boundingRectRelativeToParent,
} from "../../../../../../utils/geometry";

import "./mouse-selection.css";
import { Size } from "../../../../../../shared-types/size";

export type MouseSelectionProps = {
    selectorRef: React.RefObject<HTMLDivElement>;
    contentRef: React.RefObject<HTMLUListElement>;
};

export const MouseSelection: React.FC<MouseSelectionProps> = (props) => {
    const [mouseDown, setMouseDown] = React.useState<boolean>(false);
    const [mouseDownPosition, setMouseDownPosition] =
        React.useState<Point>(ORIGIN);
    const [dragging, setDragging] = React.useState<boolean>(false);

    const [dimensions, setDimensions] = React.useState<Size>({
        width: 0,
        height: 0,
    });
    const [centerPoint, setCenterPoint] = React.useState<Point>(ORIGIN);

    React.useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            const eventTarget = e.target as Element;
            const domNode = (
                props.selectorRef as React.RefObject<HTMLDivElement>
            ).current as HTMLDivElement;

            if (domNode.contains(eventTarget)) {
                setMouseDown(true);
                setMouseDownPosition({ x: e.clientX, y: e.clientY });
                setDragging(false);
            }
        };
        const handleMouseMove = (e: MouseEvent) => {
            if (!mouseDown) {
                return;
            }
            if (!dragging) {
                if (
                    pointDistance(
                        { x: e.clientX, y: e.clientY },
                        mouseDownPosition
                    ) >= MANHATTAN_LENGTH
                ) {
                    setDragging(true);
                }
            } else {
                const mouseDragPosition = { x: e.clientX, y: e.clientY };
                const left =
                    Math.max(
                        Math.min(mouseDownPosition.x, mouseDragPosition.x),
                        props.contentRef.current?.getBoundingClientRect()
                            .left || 0
                    ) -
                    (props.selectorRef.current?.getBoundingClientRect().left ||
                        0);

                const top =
                    Math.max(
                        Math.min(mouseDownPosition.y, mouseDragPosition.y),
                        props.contentRef.current?.getBoundingClientRect().top ||
                            0
                    ) -
                    (props.selectorRef.current?.getBoundingClientRect().top ||
                        0);

                const width = Math.abs(
                    mouseDownPosition.x -
                        Math.min(
                            Math.max(
                                mouseDragPosition.x,
                                props.contentRef.current?.getBoundingClientRect()
                                    .left || 0
                            ),
                            (props.contentRef.current?.getBoundingClientRect()
                                .left || 0) +
                                (props.contentRef.current?.getBoundingClientRect()
                                    .width || 0)
                        )
                );

                const height = Math.abs(
                    mouseDownPosition.y -
                        Math.min(
                            Math.max(
                                mouseDragPosition.y,
                                props.contentRef.current?.getBoundingClientRect()
                                    .top || 0
                            ),
                            (props.contentRef.current?.getBoundingClientRect()
                                .top || 0) +
                                (props.contentRef.current?.getBoundingClientRect()
                                    .height || 0)
                        )
                );

                const selectionCenterPoint = {
                    x: left + width / 2,
                    y: top + height / 2,
                };
                const selectionDimensions = { width: width, height: height };

                if (props.contentRef.current) {
                    Array.from(
                        props.contentRef.current.getElementsByClassName(
                            "WebvizAttributeSelector_ValueTag"
                        )
                    ).forEach((child) => {
                        if (
                            child.nodeType === Node.ELEMENT_NODE &&
                            props.selectorRef.current
                        ) {
                            const boundingRect = boundingRectRelativeToParent(
                                (
                                    props.selectorRef.current as HTMLDivElement
                                ).getBoundingClientRect(),
                                child.getBoundingClientRect()
                            );
                            const centerPoint =
                                centerPointFromBoundingRect(boundingRect);
                            const dimensions =
                                dimensionsFromBoundingRect(boundingRect);
                            if (
                                isPartlyContained(
                                    selectionCenterPoint,
                                    selectionDimensions,
                                    centerPoint,
                                    dimensions
                                )
                            ) {
                                child.classList.add(
                                    "WebvizAttributeSelector_ValueTag--selected"
                                );
                            } else {
                                child.classList.remove(
                                    "WebvizAttributeSelector_ValueTag--selected"
                                );
                            }
                        }
                    });
                }
                setCenterPoint(selectionCenterPoint);
                setDimensions(selectionDimensions);
            }
        };

        const handleMouseUp = () => {
            setMouseDown(false);
            setDragging(false);
        };
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [
        props.contentRef.current,
        props.selectorRef.current,
        setMouseDown,
        setDragging,
        dragging,
        mouseDown,
        setDimensions,
        setCenterPoint,
    ]);

    if (dragging) {
        return (
            <div
                className="WebvizAttributeSelector__MouseSelection"
                style={{
                    left: centerPoint.x - dimensions.width / 2,
                    top: centerPoint.y - dimensions.height / 2,
                    width: dimensions.width,
                    height: dimensions.height,
                }}
            ></div>
        );
    }
    return null;
};
