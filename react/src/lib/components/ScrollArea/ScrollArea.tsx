import React from "react";
import PropTypes from "prop-types";
import useSize from "@react-hook/size";

import { usePan } from "../../hooks/usePan";
import { usePrevious } from "../../hooks/usePrevious";
import { ORIGIN, pointDifference } from "../../utils/geometry";

import { Point } from "../../shared-types/point";

import "./ScrollArea.css";

type ScrollAreaProps = {
    children?: React.ReactNode;
};

export const ScrollArea: React.FC<ScrollAreaProps> = (props) => {
    const [scrollbarOpacity, setScrollbarOpacity] = React.useState<number>(0);
    const [scrollPosition, setScrollPosition] = React.useState<Point>({
        x: 0,
        y: 0,
    });
    const [scrollbarSelected, setScrollbarSelected] = React.useState<boolean>(
        false
    );
    const [scrollAreaHovered, setScrollAreaHovered] = React.useState<boolean>(
        false
    );
    const contentRef = React.useRef<HTMLDivElement>(null);
    const contentHeight = useSize(contentRef, {
        initialHeight: 0,
        initialWidth: 0,
    })[1];
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const scrollAreaHeight = useSize(scrollAreaRef, {
        initialHeight: 0,
        initialWidth: 0,
    })[1];
    const scrollbarRef = React.useRef<HTMLDivElement>(null);
    const offset = usePan(scrollbarRef);
    const previousOffset = usePrevious<Point>(offset) || ORIGIN;
    const interval = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
        return () => {
            if (interval.current) {
                clearInterval(interval.current);
            }
        };
    }, []);

    React.useEffect(() => {
        if (scrollAreaHeight > 0) {
            const newScrollPosition = {
                y: Math.max(
                    Math.min(
                        scrollPosition.y -
                            (pointDifference(previousOffset, offset).y /
                                scrollAreaHeight) *
                                contentHeight,
                        0
                    ),
                    contentHeight > scrollAreaHeight
                        ? -(contentHeight - scrollAreaHeight)
                        : 0
                ),
                x: scrollPosition.x,
            };
            setScrollPosition(newScrollPosition);
        }
    }, [offset]);

    const fadeScrollbarIn = React.useCallback(
        (opacity: number) => {
            if (contentHeight > scrollAreaHeight) {
                if (interval.current) {
                    clearInterval(interval.current);
                }
                interval.current = setInterval(() => {
                    if (opacity >= 0.75) {
                        setScrollbarOpacity(0.75);
                        if (interval.current) {
                            clearInterval(interval.current);
                        }
                        return;
                    }
                    opacity += 0.05;
                    setScrollbarOpacity(opacity);
                }, 10);
            }
        },
        [setScrollbarOpacity, contentHeight, scrollAreaHeight]
    );

    const fadeScrollbarOut = React.useCallback(
        (opacity: number) => {
            if (interval.current) {
                clearInterval(interval.current);
            }
            interval.current = setInterval(() => {
                if (opacity <= 0) {
                    setScrollbarOpacity(0);
                    if (interval.current) {
                        clearInterval(interval.current);
                    }
                    return;
                }
                opacity -= 0.05;
                setScrollbarOpacity(opacity);
            }, 10);
        },
        [setScrollbarOpacity]
    );

    React.useEffect(() => {
        const unselectScrollbar = () => {
            if (scrollbarSelected) {
                setScrollbarSelected(false);
                if (!scrollAreaHovered) {
                    fadeScrollbarOut(0.75);
                }
            }
        };
        document.addEventListener("mouseup", unselectScrollbar, true);
        return () =>
            document.removeEventListener("mouseup", unselectScrollbar, true);
    }, [scrollAreaHovered, scrollbarSelected, setScrollbarSelected]);

    React.useEffect(() => {
        if (
            contentHeight > scrollAreaHeight &&
            (scrollAreaHovered || scrollbarSelected)
        ) {
            fadeScrollbarIn(scrollbarOpacity);
        } else {
            fadeScrollbarOut(scrollbarOpacity);
            if (contentHeight <= scrollAreaHeight) {
                setScrollPosition({ x: 0, y: 0 });
            }
        }
    }, [scrollAreaHeight, contentHeight, scrollAreaHovered, scrollbarSelected]);

    React.useEffect(() => {
        const scroll = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setScrollPosition({
                y: Math.max(
                    Math.min(scrollPosition.y - e.deltaY, 0),
                    contentHeight > scrollAreaHeight
                        ? -(contentHeight - scrollAreaHeight)
                        : 0
                ),
                x: scrollPosition.x + e.deltaX,
            });
        };

        if (scrollAreaRef.current) {
            scrollAreaRef.current.addEventListener("wheel", scroll, true);
        }

        return () => {
            if (scrollAreaRef.current) {
                scrollAreaRef.current.removeEventListener(
                    "wheel",
                    scroll,
                    true
                );
            }
        };
    }, [scrollAreaRef.current, setScrollPosition, scrollPosition]);

    return (
        <div
            className="ScrollArea"
            ref={scrollAreaRef}
            onMouseEnter={() => {
                if (!scrollbarSelected) {
                    fadeScrollbarIn(scrollbarOpacity);
                }
                setScrollAreaHovered(true);
            }}
            onMouseLeave={() => {
                if (!scrollbarSelected) {
                    fadeScrollbarOut(scrollbarOpacity);
                }
                setScrollAreaHovered(false);
            }}
        >
            <div
                ref={scrollbarRef}
                className="VerticalScrollBar"
                style={{
                    display: scrollbarOpacity > 0 ? "block" : "none",
                    opacity: scrollbarOpacity,
                    height: `${
                        scrollAreaHeight *
                        scrollAreaHeight *
                        (1 / contentHeight)
                    }px`,
                    top: `${
                        Math.abs(contentHeight) > 0
                            ? (-scrollPosition.y / contentHeight) *
                              scrollAreaHeight
                            : 0
                    }px`,
                }}
                onMouseDown={() => setScrollbarSelected(true)}
            ></div>
            <div
                className="ScrollArea__Content"
                ref={contentRef}
                style={{ top: scrollPosition.y }}
            >
                {props.children}
            </div>
        </div>
    );
};

ScrollArea.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]),
};
