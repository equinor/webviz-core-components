import React from "react";

import "./thumb.css";

import "animate.css";

export type ThumbProps = {
    minValue: number;
    maxValue: number;
    minRangeValue: number;
    maxRangeValue: number;
    fromValue: number;
    toValue: number;
    trackBoundingClientRect: DOMRect;
    width: number;
    step: number;
    onValuesChange: (fromValue: number, toValue: number) => void;
    onMouseOver: () => void;
    onMouseLeave: () => void;
    onRemove: () => void;
};

export const Thumb: React.FC<ThumbProps> = (props) => {
    const [isSingleValue, setIsSingleValue] = React.useState<boolean>(true);
    const [wasRange, setWasRange] = React.useState<boolean>(false);
    const [mouseTarget, setMouseTarget] =
        React.useState<HTMLDivElement | null>(null);
    const [fromValue, setFromValue] = React.useState<number>(props.fromValue);
    const [toValue, setToValue] = React.useState<number>(props.toValue);
    const [animation, setAnimation] = React.useState<string>("");
    const [mouseDownLeft, setMouseDownLeft] = React.useState<number>(0);

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

    React.useEffect(() => {
        setFromValue(props.fromValue);
        setToValue(props.toValue);
    }, [props.fromValue, props.toValue]);

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
                setMouseDownLeft(e.clientX);
            }
            e.preventDefault();
            e.stopPropagation();
        };
        const handleMouseUp = (e: MouseEvent) => {
            setMouseTarget(null);
            if (
                [
                    handleRef.current,
                    leftHandleRef.current,
                    rightHandleRef.current,
                    barRef.current,
                ].includes(e.target as HTMLDivElement)
            ) {
                //props.onValuesChange(fromValue, toValue);
            }
        };
        const handleMouseMove = (e: MouseEvent) => {
            if (mouseTarget === null) {
                return;
            }
            if (isSingleValue && mouseTarget === handleRef.current) {
                setFromValue(
                    Math.max(
                        Math.min(
                            closestValidValue(pixelToValue(e.clientX)),
                            props.maxRangeValue
                        ),
                        props.minRangeValue
                    )
                );
                setToValue(
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
                setFromValue(newValue);
                setIsSingleValue(newValue === toValue);
            } else if (mouseTarget === rightHandleRef.current) {
                const newValue = Math.max(
                    Math.min(
                        closestValidValue(pixelToValue(e.clientX)),
                        props.maxRangeValue
                    ),
                    props.minRangeValue
                );
                setToValue(newValue);
                setIsSingleValue(newValue === fromValue);
            } else if (mouseTarget === barRef.current) {
                const range = toValue - fromValue;
                const newFromValue = Math.max(
                    Math.min(
                        props.maxRangeValue - range,
                        fromValue +
                            closestValidValue(
                                pixelToValue(e.clientX) -
                                    pixelToValue(mouseDownLeft)
                            )
                    ),
                    props.minRangeValue
                );
                const newToValue = Math.min(
                    Math.max(
                        props.minRangeValue + range,
                        toValue +
                            closestValidValue(
                                pixelToValue(e.clientX) -
                                    pixelToValue(mouseDownLeft)
                            )
                    ),
                    props.maxRangeValue
                );
                setFromValue(newFromValue);
                setToValue(newToValue);
            }
            if (mouseTarget) {
                if (
                    Math.abs(
                        e.clientY -
                            (props.trackBoundingClientRect.y +
                                props.trackBoundingClientRect.height / 2)
                    ) > props.trackBoundingClientRect.height
                ) {
                    props.onRemove();
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
        setFromValue,
        setToValue,
        props.minValue,
        props.maxValue,
        props.minRangeValue,
        props.maxRangeValue,
        mouseDownLeft,
        setMouseDownLeft,
    ]);

    return (
        <div
            className={`WebvizRangeFilter__Thumb${animation}`}
            ref={thumbRef}
            style={{
                left: valueToPixel(fromValue),
                width: Math.max(
                    valueToPixel(toValue) - valueToPixel(fromValue),
                    1
                ),
            }}
            onMouseOver={() => props.onMouseOver()}
            onMouseLeave={() => props.onMouseLeave()}
        >
            {mouseTarget &&
                (mouseTarget === barRef.current ||
                    mouseTarget === leftHandleRef.current ||
                    mouseTarget === handleRef.current) && (
                    <div className="WebvizRangeFilter__Thumb__Tooltip WebvizRangeFilter__Thumb__Tooltip--left">
                        {fromValue}
                    </div>
                )}
            {mouseTarget &&
                (mouseTarget === barRef.current ||
                    mouseTarget === rightHandleRef.current) && (
                    <div className="WebvizRangeFilter__Thumb__Tooltip WebvizRangeFilter__Thumb__Tooltip--right">
                        {toValue}
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
                        if (toValue < props.maxValue - props.step * 10) {
                            setToValue(
                                Math.min(
                                    toValue + props.step * 10,
                                    props.maxValue
                                )
                            );
                        } else {
                            setFromValue(
                                Math.max(
                                    fromValue - props.step * 10,
                                    props.minValue
                                )
                            );
                        }
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
                                valueToPixel(toValue) - valueToPixel(fromValue),
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
