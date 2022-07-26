import React from "react";

import "./thumb.css";

import "animate.css";

export type ThumbProps = {
    minValue: number;
    maxValue: number;
    fromValue: number;
    toValue: number;
    left: number;
    width: number;
    onValuesChange: (fromValue: number, toValue: number) => void;
    onMouseOver: () => void;
    onMouseLeave: () => void;
};

export const Thumb: React.FC<ThumbProps> = (props) => {
    const [isSingleValue, setIsSingleValue] = React.useState<boolean>(true);
    const [wasRange, setWasRange] = React.useState<boolean>(false);
    const [mouseTarget, setMouseTarget] =
        React.useState<HTMLDivElement | null>(null);
    const [fromValue, setFromValue] = React.useState<number>(props.fromValue);
    const [toValue, setToValue] = React.useState<number>(props.toValue);
    const [animation, setAnimation] = React.useState<string>("");

    const thumbRef = React.useRef<HTMLDivElement | null>(null);
    const handleRef = React.useRef<HTMLDivElement | null>(null);
    const leftHandleRef = React.useRef<HTMLDivElement | null>(null);
    const rightHandleRef = React.useRef<HTMLDivElement | null>(null);
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
        const deltaPixel = px - props.left;
        return (deltaPixel / props.width) * (props.maxValue - props.minValue);
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
                ].includes(e.target as HTMLDivElement)
            ) {
                setMouseTarget(e.target as HTMLDivElement);
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
                setFromValue(
                    Math.max(
                        Math.min(pixelToValue(e.clientX), props.maxValue),
                        props.minValue
                    )
                );
                setToValue(
                    Math.max(
                        Math.min(pixelToValue(e.clientX), props.maxValue),
                        props.minValue
                    )
                );
            } else if (mouseTarget === leftHandleRef.current) {
                const newValue = Math.max(
                    Math.min(pixelToValue(e.clientX), props.maxValue),
                    props.minValue
                );
                setFromValue(newValue);
                setIsSingleValue(newValue === toValue);
            } else if (mouseTarget === rightHandleRef.current) {
                const newValue = Math.max(
                    Math.min(pixelToValue(e.clientX), props.maxValue),
                    props.minValue
                );
                setToValue(newValue);
                setIsSingleValue(newValue === fromValue);
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
        leftHandleRef.current,
        rightHandleRef.current,
        mouseTarget,
        setMouseTarget,
        setFromValue,
        setToValue,
        props.minValue,
        props.maxValue,
    ]);

    return (
        <div
            className={`WebvizRangeFilter__Thumb${animation}`}
            ref={thumbRef}
            style={{
                left: valueToPixel(fromValue),
                width: valueToPixel(toValue) - valueToPixel(fromValue) + 16,
            }}
            onMouseOver={() => props.onMouseOver()}
            onMouseLeave={() => props.onMouseLeave()}
        >
            <div
                className={`WebvizRangeFilter__Thumb__Tooltip${
                    mouseTarget === rightHandleRef.current
                        ? " WebvizRangeFilter__Thumb__Tooltip--right"
                        : " WebvizRangeFilter__Thumb__Tooltip--left"
                }`}
                style={{ display: mouseTarget ? "block" : "none" }}
            >
                {mouseTarget === rightHandleRef.current ? toValue : fromValue}
            </div>
            {isSingleValue && (
                <div
                    className={`WebvizRangeFilter__Thumb__Handle`}
                    ref={handleRef}
                    onDoubleClick={() => {
                        setIsSingleValue(false);
                        if (toValue < props.maxValue) {
                            setToValue(
                                Math.min(
                                    toValue +
                                        (props.maxValue - props.minValue) / 50,
                                    props.maxValue
                                )
                            );
                        } else {
                            setFromValue(
                                Math.max(
                                    fromValue -
                                        (props.maxValue - props.minValue) / 50,
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
                        className="WebvizRangeFilter__Thumb__LeftHandle"
                        ref={leftHandleRef}
                    ></div>
                    <div
                        className="WebvizRangeFilter__Thumb__Bar"
                        style={{
                            width:
                                valueToPixel(toValue) - valueToPixel(fromValue),
                        }}
                    ></div>
                    <div
                        className="WebvizRangeFilter__Thumb__RightHandle"
                        ref={rightHandleRef}
                    ></div>
                </>
            )}
        </div>
    );
};
