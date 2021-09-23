import React from "react";
import PropTypes from "prop-types";
import useSize from "@react-hook/size";

import { usePan } from "../../hooks/usePan";
import { usePrevious } from "../../hooks/usePrevious";
import {
    ORIGIN,
    pointDifference,
    pointIsContained,
} from "../../utils/geometry";

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
    const previousTouchPosition = React.useRef<Point>({ x: 0, y: 0 });

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
        const checkIfHovered = (e: MouseEvent) => {
            if (scrollAreaRef.current) {
                const boundingRect = scrollAreaRef.current.getBoundingClientRect();
                const mousePosition = { x: e.pageX, y: e.pageY };
                if (
                    pointIsContained(
                        mousePosition,
                        {
                            width: boundingRect.width,
                            height: boundingRect.height,
                        },
                        {
                            x: boundingRect.x + boundingRect.width / 2,
                            y: boundingRect.y + boundingRect.height / 2,
                        }
                    )
                ) {
                    if (!scrollAreaHovered) {
                        if (!scrollbarSelected) {
                            fadeScrollbarIn(scrollbarOpacity);
                        }
                        setScrollAreaHovered(true);
                    }
                } else if (scrollAreaHovered) {
                    if (!scrollbarSelected) {
                        fadeScrollbarOut(scrollbarOpacity);
                    }
                    setScrollAreaHovered(false);
                }
            }
        };

        if (scrollAreaRef.current) {
            document.addEventListener("mousemove", checkIfHovered);
        }

        return () => {
            document.removeEventListener("mousemove", checkIfHovered);
        };
    }, [
        scrollAreaRef.current,
        scrollAreaHovered,
        scrollbarSelected,
        fadeScrollbarIn,
        fadeScrollbarOut,
        setScrollAreaHovered,
    ]);

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

        const touchStart = (e: TouchEvent) => {
            const touches = e.changedTouches;
            if (touches.length === 1) {
                if (previousTouchPosition.current) {
                    previousTouchPosition.current = {
                        x: touches[0].pageX,
                        y: touches[0].pageY,
                    };
                }
            }
        };

        const touchEnd = (e: TouchEvent) => {
            const touches = e.changedTouches;
            if (touches.length === 1) {
                if (previousTouchPosition.current) {
                    previousTouchPosition.current = {
                        x: touches[0].pageX,
                        y: touches[0].pageY,
                    };
                }
                fadeScrollbarOut(scrollbarOpacity);
            }
        };

        const touchScroll = (e: TouchEvent) => {
            const touches = e.changedTouches;
            if (touches.length === 1 && previousTouchPosition.current) {
                fadeScrollbarIn(scrollbarOpacity);
                e.preventDefault();
                e.stopPropagation();
                const deltaX =
                    touches[0].pageX - previousTouchPosition.current.x;
                const deltaY =
                    touches[0].pageY - previousTouchPosition.current.y;
                previousTouchPosition.current = {
                    x: touches[0].pageX,
                    y: touches[0].pageY,
                };
                setScrollPosition({
                    y: Math.max(
                        Math.min(scrollPosition.y + deltaY, 0),
                        contentHeight > scrollAreaHeight
                            ? -(contentHeight - scrollAreaHeight)
                            : 0
                    ),
                    x: scrollPosition.x + deltaX,
                });
            }
        };

        if (scrollAreaRef.current) {
            scrollAreaRef.current.addEventListener("wheel", scroll, true);
            scrollAreaRef.current.addEventListener(
                "touchstart",
                touchStart,
                true
            );
            scrollAreaRef.current.addEventListener(
                "touchmove",
                touchScroll,
                true
            );
            scrollAreaRef.current.addEventListener("touchend", touchEnd, true);
        }

        return () => {
            if (scrollAreaRef.current) {
                scrollAreaRef.current.removeEventListener(
                    "wheel",
                    scroll,
                    true
                );
                scrollAreaRef.current.removeEventListener(
                    "touchstart",
                    touchStart,
                    true
                );
                scrollAreaRef.current.removeEventListener(
                    "touchmove",
                    touchScroll,
                    true
                );
                scrollAreaRef.current.removeEventListener(
                    "touchend",
                    touchEnd,
                    true
                );
            }
        };
    }, [
        scrollAreaRef.current,
        setScrollPosition,
        scrollPosition,
        previousTouchPosition,
        scrollbarOpacity,
        fadeScrollbarIn,
        fadeScrollbarOut,
    ]);

    return (
        <div className="ScrollArea" ref={scrollAreaRef}>
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
