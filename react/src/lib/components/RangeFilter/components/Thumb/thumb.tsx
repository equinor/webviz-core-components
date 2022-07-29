import React from "react";

import "./thumb.css";

import "animate.css";
import { ThumbInstance } from "../../range-filter";

export type ThumbProps = {
    minValue: number;
    maxValue: number;
    minRangeValue: number;
    maxRangeValue: number;
    trackBoundingClientRect: DOMRect;
    width: number;
    step: number;
    thumb: ThumbInstance;
    onMouseOver: () => void;
    onMouseLeave: () => void;
    onRemove: () => void;
    updateProps: () => void;
};

export const Thumb: React.FC<ThumbProps> = (props) => {
    const [isSingleValue, setIsSingleValue] = React.useState<boolean>(true);
    const [wasRange, setWasRange] = React.useState<boolean>(false);
    const [mouseTarget, setMouseTarget] =
        React.useState<HTMLDivElement | null>(null);
    const [animation, setAnimation] = React.useState<string>("");
    const [mouseDownValueDelta, setMouseDownValueDelta] =
        React.useState<number>(0);

    const thumbRef = React.useRef<HTMLDivElement | null>(null);
    const handleRef = React.useRef<HTMLDivElement | null>(null);
    const leftHandleRef = React.useRef<HTMLDivElement | null>(null);
    const rightHandleRef = React.useRef<HTMLDivElement | null>(null);
    const barRef = React.useRef<HTMLDivElement | null>(null);
    const animationRef =
        React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, []);

    const pixelToValue = (px: number) => {
        const deltaPixel = px - props.trackBoundingClientRect.x;
        return (deltaPixel / props.width) * (props.maxValue - props.minValue);
    };

    const closestValidValue = (value: number) => {
        return Math.round(value / props.step) * props.step;
    };

    const valueToPixel = (value: number) => {
        return (
            (props.width * (value - props.minValue)) /
            (props.maxValue - props.minValue)
        );
    };

    React.useEffect(() => {
        if (isSingleValue && wasRange) {
            setAnimation(" animate__animated animate__rubberBand");
            setTimeout(() => setAnimation(""), 1000);
            setWasRange(false);
        } else if (isSingleValue) {
            setAnimation(" animate__animated animate__bounceIn");
            setTimeout(() => setAnimation(""), 1000);
        }

        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, [
        isSingleValue,
        wasRange,
        animationRef,
        setAnimation,
        setTimeout,
        setWasRange,
    ]);

    React.useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (
                [
                    handleRef.current,
                    leftHandleRef.current,
                    rightHandleRef.current,
                    barRef.current,
                ].includes(e.target as HTMLDivElement)
            ) {
                setMouseTarget(e.target as HTMLDivElement);
                setMouseDownValueDelta(
                    closestValidValue(pixelToValue(e.clientX)) -
                        props.thumb.fromValue
                );
                props.onMouseOver();
            }
            e.preventDefault();
            e.stopPropagation();
        };
        const handleMouseUp = () => {
            setMouseTarget(null);
        };
        const handleMouseMove = (e: MouseEvent) => {
            if (mouseTarget === null) {
                return;
            }
            if (isSingleValue && mouseTarget === handleRef.current) {
                props.thumb.setFromValue(
                    Math.max(
                        Math.min(
                            closestValidValue(pixelToValue(e.clientX)),
                            props.maxRangeValue
                        ),
                        props.minRangeValue
                    )
                );
                props.thumb.setToValue(
                    Math.max(
                        Math.min(
                            closestValidValue(pixelToValue(e.clientX)),
                            props.maxRangeValue
                        ),
                        props.minRangeValue
                    )
                );
            } else if (mouseTarget === leftHandleRef.current) {
                const newValue = Math.max(
                    Math.min(
                        closestValidValue(pixelToValue(e.clientX)),
                        props.maxRangeValue
                    ),
                    props.minRangeValue
                );
                props.thumb.setFromValue(newValue);
                setIsSingleValue(newValue === props.thumb.toValue);
            } else if (mouseTarget === rightHandleRef.current) {
                const newValue = Math.max(
                    Math.min(
                        closestValidValue(pixelToValue(e.clientX)),
                        props.maxRangeValue
                    ),
                    props.minRangeValue
                );
                props.thumb.setToValue(newValue);
                setIsSingleValue(newValue === props.thumb.fromValue);
            } else if (mouseTarget === barRef.current) {
                const range = props.thumb.toValue - props.thumb.fromValue;
                const newFromValue = Math.max(
                    Math.min(
                        props.maxRangeValue - range,
                        closestValidValue(pixelToValue(e.clientX)) -
                            mouseDownValueDelta
                    ),
                    props.minRangeValue
                );
                const newToValue = Math.min(
                    Math.max(
                        props.minRangeValue + range,
                        closestValidValue(pixelToValue(e.clientX)) +
                            (range - mouseDownValueDelta)
                    ),
                    props.maxRangeValue
                );
                props.thumb.setFromValue(newFromValue);
                props.thumb.setToValue(newToValue);
            }
            if (
                [
                    handleRef.current,
                    leftHandleRef.current,
                    rightHandleRef.current,
                    barRef.current,
                ].includes(mouseTarget)
            ) {
                if (
                    Math.abs(
                        e.clientY -
                            (props.trackBoundingClientRect.y +
                                props.trackBoundingClientRect.height / 2)
                    ) > props.trackBoundingClientRect.height
                ) {
                    props.onRemove();
                    setMouseTarget(null);
                }
            }
        };
        if (thumbRef.current) {
            thumbRef.current.addEventListener("mousedown", handleMouseDown);
            document.addEventListener("mouseup", handleMouseUp);
            document.addEventListener("mousemove", handleMouseMove);
        }
        return () => {
            if (thumbRef.current) {
                thumbRef.current.removeEventListener(
                    "mousedown",
                    handleMouseDown
                );
                document.removeEventListener("mouseup", handleMouseUp);
                document.removeEventListener("mousemove", handleMouseMove);
            }
        };
    }, [
        thumbRef.current,
        handleRef.current,
        barRef.current,
        leftHandleRef.current,
        rightHandleRef.current,
        mouseTarget,
        setMouseTarget,
        props.thumb.fromValue,
        props.thumb.toValue,
        props.thumb,
        props.minValue,
        props.maxValue,
        props.minRangeValue,
        props.maxRangeValue,
        mouseDownValueDelta,
        setMouseDownValueDelta,
        props.onMouseOver,
        props.onMouseLeave,
    ]);

    const width = Math.max(
        valueToPixel(props.thumb.toValue) - valueToPixel(props.thumb.fromValue),
        1
    );

    return (
        <div
            className={`WebvizRangeFilter__Thumb${animation}`}
            ref={thumbRef}
            style={{
                left: valueToPixel(props.thumb.fromValue),
                width: width,
            }}
            onMouseOver={() => props.onMouseOver()}
            onMouseLeave={() => {
                if (mouseTarget === null) props.onMouseLeave();
            }}
        >
            {mouseTarget &&
                (mouseTarget === barRef.current ||
                    mouseTarget === leftHandleRef.current ||
                    mouseTarget === handleRef.current) && (
                    <div
                        className="WebvizRangeFilter__Thumb__Tooltip WebvizRangeFilter__Thumb__Tooltip--left"
                        style={{
                            marginLeft: isSingleValue
                                ? -24
                                : Math.min(-24, width / 2 - 40),
                        }}
                    >
                        {props.thumb.fromValue}
                    </div>
                )}
            {mouseTarget &&
                (mouseTarget === barRef.current ||
                    mouseTarget === rightHandleRef.current) && (
                    <div
                        className="WebvizRangeFilter__Thumb__Tooltip WebvizRangeFilter__Thumb__Tooltip--right"
                        style={{ marginRight: Math.min(-24, width / 2 - 40) }}
                    >
                        {props.thumb.toValue}
                    </div>
                )}
            {isSingleValue && (
                <div
                    className={`WebvizRangeFilter__Thumb__Handle${
                        mouseTarget === handleRef.current
                            ? " WebvizRangeFilter__Thumb__Handle--active"
                            : ""
                    }`}
                    ref={handleRef}
                    onDoubleClick={() => {
                        setIsSingleValue(false);
                        if (
                            props.thumb.toValue <
                                props.maxValue - props.step * 10 &&
                            props.thumb.toValue <=
                                props.maxRangeValue - props.step * 3
                        ) {
                            props.thumb.setToValue(
                                Math.min(
                                    props.thumb.toValue + props.step * 10,
                                    props.maxValue,
                                    props.maxRangeValue
                                )
                            );
                        } else {
                            props.thumb.setFromValue(
                                Math.max(
                                    props.thumb.fromValue - props.step * 10,
                                    props.minValue,
                                    props.minRangeValue
                                )
                            );
                        }
                        props.updateProps();
                    }}
                ></div>
            )}
            {!isSingleValue && (
                <>
                    <div
                        className={`WebvizRangeFilter__Thumb__Handle${
                            mouseTarget === leftHandleRef.current
                                ? " WebvizRangeFilter__Thumb__Handle--active"
                                : ""
                        }`}
                        ref={leftHandleRef}
                    ></div>
                    <div
                        className="WebvizRangeFilter__Thumb__Bar"
                        ref={barRef}
                        style={{
                            width:
                                valueToPixel(props.thumb.toValue) -
                                valueToPixel(props.thumb.fromValue),
                        }}
                    ></div>
                    <div
                        className={`WebvizRangeFilter__Thumb__Handle${
                            mouseTarget === rightHandleRef.current
                                ? " WebvizRangeFilter__Thumb__Handle--active"
                                : ""
                        }`}
                        ref={rightHandleRef}
                    ></div>
                </>
            )}
        </div>
    );
};
