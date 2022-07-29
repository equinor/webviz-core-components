import { Point } from "../../shared-types/point";
import { ORIGIN } from "../../utils/geometry";
import React from "react";
import { Thumb } from "./components";

import "./range-filter.css";
import { uniqueId } from "lodash";

export type ParentProps = {
    values: number[];
    selections: {
        fromValue: number;
        toValue: number;
    }[];
};

export type RangeFilterProps = {
    minValue: number;
    maxValue: number;
    step: number;
    showTicks?: boolean;
    setProps: (props: ParentProps) => void;
};

export class ThumbInstance {
    id: string;
    fromValue: number;
    toValue: number;
    constructor(from: number, to: number) {
        this.id = uniqueId();
        this.fromValue = from;
        this.toValue = to;
    }

    setFromValue(toValue: number) {
        this.fromValue = toValue;
    }

    setToValue(toValue: number) {
        this.toValue = toValue;
    }

    setRange(from: number, to: number) {
        this.fromValue = from;
        this.toValue = to;
    }
}

export const RangeFilter: React.FC<RangeFilterProps> = (props) => {
    const [thumbs, setThumbs] = React.useState<ThumbInstance[]>([]);
    const [trackBoundingClientRect, setTrackBoundingClientRect] =
        React.useState<DOMRect>(new DOMRect(0, 0, 0, 0));
    const [trackWidth, setTrackWidth] = React.useState<number>(0);
    const trackRef = React.useRef<HTMLDivElement | null>(null);
    const resizeObserver = React.useRef<ResizeObserver | null>(null);
    const [cursorPosition, setCursorPosition] = React.useState<Point>(ORIGIN);
    const [hovered, setHovered] = React.useState<boolean>(false);

    const closestValidValue = (value: number) => {
        return Math.round(value / props.step) * props.step;
    };

    React.useEffect(() => {
        resizeObserver.current = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.contentRect) {
                    const contentRect: DOMRect = Array.isArray(
                        entry.contentRect
                    )
                        ? entry.contentRect[0]
                        : entry.contentRect;
                    setTrackWidth(contentRect.width);
                    setTrackBoundingClientRect(
                        trackRef.current?.getBoundingClientRect() ||
                            trackBoundingClientRect
                    );
                }
            });
        });
    }, [setTrackWidth, setTrackBoundingClientRect, trackRef.current]);

    const updateParentProps = React.useCallback(
        (givenThumbs?: ThumbInstance[]) => {
            const values = [];
            const currentThumbs = givenThumbs || thumbs;
            for (let i = props.minValue; i <= props.maxValue; i += props.step) {
                if (
                    currentThumbs.some(
                        (el) => i >= el.fromValue && i <= el.toValue
                    )
                ) {
                    values.push(i);
                }
            }
            props.setProps({
                values: values,
                selections: currentThumbs.map((el) => ({
                    fromValue: el.fromValue,
                    toValue: el.toValue,
                })),
            });
        },
        [thumbs, props.setProps]
    );

    React.useEffect(() => {
        const handleMouseOver = () => {
            setHovered(true);
        };
        const handleMouseLeave = () => {
            setHovered(false);
        };
        const handleMouseMove = (e: MouseEvent) => {
            if (trackRef.current) {
                const boundingClientRect =
                    trackRef.current.getBoundingClientRect();
                setCursorPosition({
                    x: Math.min(
                        trackWidth,
                        Math.max(0, e.clientX - boundingClientRect.left)
                    ),
                    y: e.clientY - boundingClientRect.top,
                });
            }
        };

        const handleMouseUp = () => {
            updateParentProps();
        };

        if (trackRef.current) {
            trackRef.current.addEventListener(
                "mouseover",
                handleMouseOver,
                false
            );
            trackRef.current.addEventListener(
                "mouseleave",
                handleMouseLeave,
                false
            );
            trackRef.current.addEventListener(
                "mousemove",
                handleMouseMove,
                false
            );
            document.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            if (trackRef.current) {
                trackRef.current.removeEventListener(
                    "mouseover",
                    handleMouseOver,
                    false
                );
                trackRef.current.removeEventListener(
                    "mouseleave",
                    handleMouseLeave,
                    false
                );
                trackRef.current.removeEventListener(
                    "mousemove",
                    handleMouseMove,
                    false
                );
                document.removeEventListener("mouseup", handleMouseUp);
            }
        };
    }, [
        thumbs,
        setHovered,
        setCursorPosition,
        trackRef.current,
        trackWidth,
        props.setProps,
    ]);

    React.useEffect(() => {
        if (trackRef.current && resizeObserver.current) {
            resizeObserver.current.observe(trackRef.current);
        }
        return () => {
            if (trackRef.current && resizeObserver.current) {
                resizeObserver.current.unobserve(trackRef.current);
            }
        };
    }, [trackRef.current, resizeObserver.current]);

    const pixelToValue = (px: number) => {
        const deltaPixel = px - trackBoundingClientRect.x;
        return (deltaPixel / trackWidth) * (props.maxValue - props.minValue);
    };

    const handleMouseClick = (e: React.MouseEvent) => {
        const newThumbs = [
            ...thumbs,
            new ThumbInstance(
                closestValidValue(pixelToValue(e.clientX)),
                closestValidValue(pixelToValue(e.clientX))
            ),
        ];
        setThumbs(newThumbs);
        updateParentProps(newThumbs);
    };

    return (
        <div className="WebvizRangeFilter">
            <div className="WebvizRangeFilter__Track" ref={trackRef}>
                {thumbs.map((thumb, index) => (
                    <Thumb
                        key={`thumb-${thumb.id}`}
                        thumb={thumb}
                        minValue={props.minValue}
                        maxValue={props.maxValue}
                        minRangeValue={Math.max(
                            ...thumbs
                                .filter((el) => el.toValue < thumb.fromValue)
                                .map((el) => el.toValue + 1),
                            props.minValue
                        )}
                        maxRangeValue={Math.min(
                            ...thumbs
                                .filter((el) => el.fromValue > thumb.toValue)
                                .map((el) => el.fromValue - 1),
                            props.maxValue
                        )}
                        step={props.step}
                        trackBoundingClientRect={trackBoundingClientRect}
                        width={trackWidth}
                        onMouseLeave={() => setHovered(true)}
                        onMouseOver={() => setHovered(false)}
                        onRemove={() =>
                            setThumbs(thumbs.filter((_, i) => i !== index))
                        }
                        updateProps={() => updateParentProps()}
                    />
                ))}
                <div
                    className="WebvizRangeFilter__HoverIndicator"
                    style={{
                        display: hovered ? "block" : "none",
                        left: cursorPosition.x,
                    }}
                    onClick={(e) => handleMouseClick(e)}
                />
            </div>
            <div className="WebvizRangeFilter__Ticks">
                <div className="WebvizRangeFilter__Ticks__Value WebvizRangeFilter__Ticks__Value--left">
                    {props.minValue}
                </div>
                <div className="WebvizRangeFilter__Ticks__Value WebvizRangeFilter__Ticks__Value--right">
                    {props.maxValue}
                </div>
                <div
                    className="WebvizRangeFilter__ValueIndicator"
                    style={{
                        left: cursorPosition.x,
                        display: hovered ? "block" : "none",
                    }}
                >
                    {closestValidValue(
                        pixelToValue(
                            cursorPosition.x + trackBoundingClientRect.left
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
