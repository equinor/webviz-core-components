import React from "react";
import PropTypes from "prop-types";
import useSize from "@react-hook/size";

import { usePan } from "../../hooks/usePan";
import { usePrevious } from "../../hooks/usePrevious";
import { ORIGIN, pointDifference } from "../../utils/geometry";

import { Point } from "../../types/point";

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
    const [contentWidth, contentHeight] = useSize(contentRef, {
        initialHeight: 0,
        initialWidth: 0,
    });
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const [scrollAreaWidth, scrollAreaHeight] = useSize(scrollAreaRef, {
        initialHeight: 0,
        initialWidth: 0,
    });
    const scrollbarRef = React.useRef<HTMLDivElement>(null);
    const offset = usePan(scrollbarRef);
    const previousOffset = usePrevious<Point>(offset) || ORIGIN;

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
                const interval = setInterval(() => {
                    if (opacity >= 0.75) {
                        setScrollbarOpacity(0.75);
                        clearInterval(interval);
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
            const interval = setInterval(() => {
                if (opacity <= 0) {
                    setScrollbarOpacity(0);
                    clearInterval(interval);
                    return;
                }
                opacity -= 0.05;
                setScrollbarOpacity(opacity);
            }, 10);
        },
        [setScrollbarOpacity]
    );

    const scroll = (e: React.WheelEvent) => {
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
            setScrollPosition({ x: 0, y: 0 });
        }
    }, [scrollAreaHeight, contentHeight, scrollAreaHovered, scrollbarSelected]);

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
            onWheel={(e: React.WheelEvent) => scroll(e)}
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
                className="Content"
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
