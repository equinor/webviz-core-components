import React from "react";
import PropTypes from "prop-types";
import { uniqueId } from "lodash";
import { TextField } from "@material-ui/core";

import { Point } from "../../shared-types/point";
import { ORIGIN } from "../../utils/geometry";
import { Thumb } from "./components";

import "./range-filter.css";

type Selection = {
    fromValue: number;
    toValue: number;
};

export type ParentProps = {
    values: number[];
    selections: Selection[];
};

export type RangeFilterProps = {
    minValue: number;
    maxValue: number;
    step: number;
    selections?: Selection[];
    setProps?: (props: ParentProps) => void;
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

    setFromValue(toValue: number): void {
        this.fromValue = toValue;
    }

    setToValue(toValue: number): void {
        this.toValue = toValue;
    }

    setRange(from: number, to: number): void {
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
    const [changedByUser, setChangedByUser] = React.useState<boolean>(true);
    const [inputError, setInputError] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

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
        (givenThumbs?: ThumbInstance[], userChange = false) => {
            setChangedByUser(userChange);
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
            if (props.setProps) {
                props.setProps({
                    values: values,
                    selections: currentThumbs.map((el) => ({
                        fromValue: el.fromValue,
                        toValue: el.toValue,
                    })),
                });
            }
            if (!userChange && inputRef.current) {
                inputRef.current.value = currentThumbs
                    .map((el) =>
                        el.fromValue === el.toValue
                            ? el.fromValue.toString()
                            : `${el.fromValue}-${el.toValue}`
                    )
                    .join(";");
            }
        },
        [thumbs, props.setProps, inputRef.current, changedByUser]
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

    const handleInputChange = (e: React.ChangeEvent) => {
        if (!changedByUser) {
            setChangedByUser(true);
            return;
        }
        const regex =
            /^(([0-9]{1,}(-[0-9]{1,})?)([;,]{1}[0-9]{1,}(-[0-9]{1,})?){0,})?$/;
        const value = (e.target as HTMLInputElement | undefined)?.value || "";
        if (!regex.test(value)) {
            setInputError("Invalid input");
            return;
        }
        setInputError(null);
        let newThumbs: ThumbInstance[] = [];
        if (value.length > 0) {
            newThumbs = value.split(/,|;/).map((el) => {
                const split = el.split("-");
                if (split.length === 1) {
                    return new ThumbInstance(
                        parseInt(split[0]),
                        parseInt(split[0])
                    );
                } else {
                    return new ThumbInstance(
                        parseInt(split[0]),
                        parseInt(split[1])
                    );
                }
            });
        }
        setThumbs(newThumbs);
        updateParentProps(newThumbs, true);
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
            <div className="WebvizRangeFilter__Input">
                <TextField
                    onChange={(e: React.ChangeEvent) => handleInputChange(e)}
                    inputRef={inputRef}
                    error={inputError !== null}
                    helperText={inputError}
                    variant="outlined"
                    style={{ width: "100%" }}
                />
            </div>
        </div>
    );
};

RangeFilter.propTypes = {
    minValue: PropTypes.number.isRequired,
    maxValue: PropTypes.number.isRequired,
    step: PropTypes.number.isRequired,
    selections: PropTypes.arrayOf(
        PropTypes.shape({
            fromValue: PropTypes.number.isRequired,
            toValue: PropTypes.number.isRequired,
        }).isRequired
    ),
    setProps: PropTypes.func,
};
