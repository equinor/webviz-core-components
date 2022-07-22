import React from "react";
import { Thumb } from "./components";

import "./range-filter.css";

export type RangeFilterProps = {
    minValue: number;
    maxValue: number;
};

type Thumb = {
    fromValue: number;
    toValue: number;
};

export const RangeFilter: React.FC<RangeFilterProps> = (props) => {
    const [thumbs, setThumbs] = React.useState<Thumb[]>([]);
    const [trackLeft, setTrackLeft] = React.useState<number>(0);
    const [trackWidth, setTrackWidth] = React.useState<number>(0);
    const trackRef = React.useRef<HTMLDivElement | null>(null);
    const resizeObserver = React.useRef<ResizeObserver | null>(null);

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
                    setTrackLeft(
                        trackRef.current?.getBoundingClientRect().left || 0
                    );
                }
            });
        });
    }, [setTrackWidth, setTrackLeft, trackRef.current]);

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
        const deltaPixel = px - trackLeft;
        return (deltaPixel / trackWidth) * (props.maxValue - props.minValue);
    };

    const handleMouseClick = (e: React.MouseEvent) => {
        if (e.target === trackRef.current) {
            setThumbs([
                ...thumbs,
                {
                    fromValue: pixelToValue(e.clientX),
                    toValue: pixelToValue(e.clientX),
                },
            ]);
        }
    };

    return (
        <div className="WebvizRangeFilter">
            <div
                className="WebvizRangeFilter__Track"
                ref={trackRef}
                onClick={(e) => handleMouseClick(e)}
            >
                {thumbs.map((thumb, index) => (
                    <Thumb
                        key={`thumb-${thumb.fromValue}-${thumb.toValue}`}
                        minValue={props.minValue}
                        maxValue={props.maxValue}
                        fromValue={thumb.fromValue}
                        toValue={thumb.toValue}
                        left={trackLeft}
                        width={trackWidth}
                        onValuesChange={(fromValue, toValue) =>
                            setThumbs(
                                thumbs.map((el, idx) =>
                                    index === idx
                                        ? {
                                              fromValue: fromValue,
                                              toValue: toValue,
                                          }
                                        : el
                                )
                            )
                        }
                    />
                ))}
            </div>
        </div>
    );
};
