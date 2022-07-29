import { Point } from "../../shared-types/point";
import { ORIGIN } from "../../utils/geometry";
import React from "react";
import { Thumb } from "./components";

import "./range-filter.css";
import { uniqueId } from "lodash";

export type RangeFilterProps = {
    minValue: number;
    maxValue: number;
    step: number;
    showTicks?: boolean;
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

type Tick = {
    value: number;
    left: number;
};

export const RangeFilter: React.FC<RangeFilterProps> = (props) => {
    const [thumbs, setThumbs] = React.useState<ThumbInstance[]>([]);
    const [trackBoundingClientRect, setTrackBoundingClientRect] =
        React.useState<DOMRect>(new DOMRect(0, 0, 0, 0));
    const [trackWidth, setTrackWidth] = React.useState<number>(0);
    const trackRef = React.useRef<HTMLDivElement | null>(null);
    const resizeObserver = React.useRef<ResizeObserver | null>(null);
    const [cursorPosition, setCursorPosition] = React.useState<Point>(ORIGIN);
    const [hovered, setHovered] = React.useState<boolean>(false);
    const [tickPositions, setTickPositions] = React.useState<Tick[]>([]);

    const closestValidValue = (value: number) => {
        return Math.round(value / props.step) * props.step;
    };

    React.useEffect(() => {
        if (props.showTicks && trackWidth > 0) {
            const range = props.maxValue - props.minValue;
            let step = props.step;
            const maxNumberTicks = Math.floor(trackWidth / 2);
            while (range / step > maxNumberTicks) {
                step += props.step;
            }
            const dStep = trackWidth / (range / step);

            const ticks = [];
            for (let i = 0; i < range / step; i++) {
                ticks.push({ value: i * step, left: i * dStep });
            }

            setTickPositions(ticks);
        }
    }, [
        trackWidth,
        props.step,
        props.showTicks,
        props.minValue,
        props.maxValue,
        setTickPositions,
    ]);

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
            }
        };
    }, [setHovered, setCursorPosition, trackRef.current, trackWidth]);

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

    const valueToPixel = (value: number) => {
        return (
            (trackWidth * (value - props.minValue)) /
            (props.maxValue - props.minValue)
        );
    };

    const handleMouseClick = (e: React.MouseEvent) => {
        setThumbs([
            ...thumbs,
            new ThumbInstance(
                closestValidValue(pixelToValue(e.clientX)),
                closestValidValue(pixelToValue(e.clientX))
            ),
        ]);
    };

    return (
        <div className="WebvizRangeFilter">
            <div className="WebvizRangeFilter__Track" ref={trackRef}>
                {thumbs.map((thumb, index) => (
                    <Thumb
                        key={`thumb-${thumb.id}`}
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
                        fromValue={thumb.fromValue}
                        toValue={thumb.toValue}
                        step={props.step}
                        trackBoundingClientRect={trackBoundingClientRect}
                        width={trackWidth}
                        onValuesChange={(fromValue, toValue) =>
                            thumbs.at(index)?.setRange(fromValue, toValue)
                        }
                        onMouseLeave={() => setHovered(true)}
                        onMouseOver={() => setHovered(false)}
                        onRemove={() =>
                            setThumbs(thumbs.filter((_, i) => i !== index))
                        }
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
                {tickPositions.map((tick) => (
                    <div
                        key={`tick-${tick.value}`}
                        className="WebvizRangeFilter__Tick"
                        style={{
                            left: valueToPixel(closestValidValue(tick.value)),
                        }}
                    ></div>
                ))}
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
