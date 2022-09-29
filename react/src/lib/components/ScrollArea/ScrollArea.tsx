import React from "react";
import PropTypes from "prop-types";

import "./ScrollArea.css";

export type ScrollAreaProps = {
    children: React.ReactNode;
    height?: number | string;
    width?: number | string;
    noScrollbarPadding?: boolean;
};

type ScrollBarPositionAndSize = {
    position: number;
    size: number;
};

enum ScrollDirection {
    HORIZONTAL,
    VERTICAL,
}

const isElementScrollable = (scrollArea: HTMLElement, content: HTMLElement, direction: ScrollDirection): boolean => {
    if (direction === ScrollDirection.HORIZONTAL) {
        return content.scrollWidth > scrollArea.clientWidth;
    }
    return content.scrollHeight > scrollArea.clientHeight;
};

const calcScrollBarPositionAndSize = (
    scrollArea: HTMLDivElement,
    content: HTMLDivElement,
    direction: ScrollDirection
): ScrollBarPositionAndSize => {
    if (direction === ScrollDirection.VERTICAL) {
        const scrollAreaHeight = scrollArea.clientHeight;
        const contentHeight = content.scrollHeight;
        const scrollBarHeight = (scrollAreaHeight * scrollAreaHeight) / contentHeight;
        const scrollBarTop = contentHeight > 0 ? (scrollArea.scrollTop / contentHeight) * scrollAreaHeight : 0;
        return { position: scrollBarTop, size: scrollBarHeight };
    }

    const scrollAreaWidth = scrollArea.clientWidth;
    const contentWidth = content.scrollWidth;
    const scrollBarWidth = (scrollAreaWidth * scrollAreaWidth) / contentWidth;
    const scrollBarLeft = contentWidth > 0 ? (scrollArea.scrollLeft / contentWidth) * scrollAreaWidth : 0;

    return { position: scrollBarLeft, size: scrollBarWidth };
};

export const ScrollArea: React.FC<ScrollAreaProps> = (props) => {
    const [verticalScrollBarVisible, setVerticalScrollBarVisible] = React.useState<boolean>(false);
    const [horizontalScrollBarVisible, setHorizontalScrollBarVisible] = React.useState<boolean>(false);

    const [verticalScrollBarPositionAndSize, setVerticalScrollBarPositionAndSize] =
        React.useState<ScrollBarPositionAndSize>({
            position: 0,
            size: 0,
        });
    const [horizontalScrollBarPositionAndSize, setHorizontalScrollBarPositionAndSize] =
        React.useState<ScrollBarPositionAndSize>({
            position: 0,
            size: 0,
        });

    const [verticalScrollBarActive, setVerticalScrollBarActive] = React.useState<boolean>(false);
    const [horizontalScrollBarActive, setHorizontalScrollBarActive] = React.useState<boolean>(false);

    const contentRef = React.useRef<HTMLDivElement>(null);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const horizontalScrollBarRef = React.useRef<HTMLDivElement>(null);
    const verticalScrollBarRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        let mouseDown: ScrollDirection | null = null;
        let mouseDownPosition = 0;
        let scrollPosition = 0;

        const handleMouseDown = (e: MouseEvent) => {
            handleStartDrag(e.target, e.clientX, e.clientY);
        };

        const handleTouchStart = (e: TouchEvent) => {
            handleStartDrag(e.target, e.touches[0].clientX, e.touches[0].clientY);
        };

        const handleStartDrag = (target: EventTarget | null, clientX: number, clientY: number) => {
            if (scrollAreaRef.current) {
                if (target === horizontalScrollBarRef.current) {
                    mouseDown = ScrollDirection.HORIZONTAL;
                    mouseDownPosition = clientX;
                    scrollPosition = scrollAreaRef.current.scrollLeft;
                    setHorizontalScrollBarActive(true);
                }
                if (target === verticalScrollBarRef.current) {
                    mouseDown = ScrollDirection.VERTICAL;
                    mouseDownPosition = clientY;
                    scrollPosition = scrollAreaRef.current.scrollTop;
                    setVerticalScrollBarActive(true);
                }
            }
        };

        const handleMouseUpTouchEnd = () => {
            mouseDown = null;
            mouseDownPosition = 0;
            setHorizontalScrollBarActive(false);
            setVerticalScrollBarActive(false);
        };

        const handleMouseMove = (e: MouseEvent) => {
            handleDragMove(e.clientX, e.clientY);
        };

        const handleTouchMove = (e: TouchEvent) => {
            handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
        };

        const handleDragMove = (clientX: number, clientY: number) => {
            if (scrollAreaRef.current) {
                if (mouseDown == ScrollDirection.VERTICAL) {
                    scrollAreaRef.current.scrollTop = Math.max(
                        0,
                        Math.min(
                            scrollAreaRef.current.scrollHeight - scrollAreaRef.current.clientHeight,
                            scrollPosition +
                                ((clientY - mouseDownPosition) * scrollAreaRef.current.scrollHeight) /
                                    scrollAreaRef.current.clientHeight
                        )
                    );
                }
                if (mouseDown == ScrollDirection.HORIZONTAL) {
                    scrollAreaRef.current.scrollLeft = Math.max(
                        0,
                        Math.min(
                            scrollAreaRef.current.scrollWidth - scrollAreaRef.current.clientWidth,
                            scrollPosition +
                                ((clientX - mouseDownPosition) * scrollAreaRef.current.scrollWidth) /
                                    scrollAreaRef.current.clientWidth
                        )
                    );
                }
            }
        };

        if (horizontalScrollBarRef.current) {
            horizontalScrollBarRef.current.addEventListener("mousedown", handleMouseDown);
            horizontalScrollBarRef.current.addEventListener("touchstart", handleTouchStart);
        }

        if (verticalScrollBarRef.current) {
            verticalScrollBarRef.current.addEventListener("mousedown", handleMouseDown);

            verticalScrollBarRef.current.addEventListener("touchstart", handleTouchStart);
        }

        document.addEventListener("mouseup", handleMouseUpTouchEnd);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("touchend", handleMouseUpTouchEnd);
        document.addEventListener("touchmove", handleTouchMove);

        return () => {
            if (horizontalScrollBarRef.current) {
                horizontalScrollBarRef.current.removeEventListener("mousedown", handleMouseDown);
                horizontalScrollBarRef.current.removeEventListener("touchstart", handleTouchStart);
            }

            if (verticalScrollBarRef.current) {
                verticalScrollBarRef.current.removeEventListener("mousedown", handleMouseDown);
                verticalScrollBarRef.current.removeEventListener("touchstart", handleTouchStart);
            }

            document.removeEventListener("mouseup", handleMouseUpTouchEnd);
            document.removeEventListener("touchend", handleMouseUpTouchEnd);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("touchmove", handleTouchMove);
        };
    }, [scrollAreaRef.current, horizontalScrollBarRef.current, verticalScrollBarRef.current]);

    React.useEffect(() => {
        const handleResize = () => {
            if (scrollAreaRef.current && contentRef.current) {
                setHorizontalScrollBarVisible(
                    isElementScrollable(scrollAreaRef.current, contentRef.current, ScrollDirection.HORIZONTAL)
                );
                setVerticalScrollBarVisible(
                    isElementScrollable(scrollAreaRef.current, contentRef.current, ScrollDirection.VERTICAL)
                );
                setHorizontalScrollBarPositionAndSize(
                    calcScrollBarPositionAndSize(scrollAreaRef.current, contentRef.current, ScrollDirection.HORIZONTAL)
                );
                setVerticalScrollBarPositionAndSize(
                    calcScrollBarPositionAndSize(scrollAreaRef.current, contentRef.current, ScrollDirection.VERTICAL)
                );
            }
        };

        const handleScrollOrTouchMoveEvent = () => {
            if (scrollAreaRef.current && contentRef.current) {
                setHorizontalScrollBarPositionAndSize(
                    calcScrollBarPositionAndSize(scrollAreaRef.current, contentRef.current, ScrollDirection.HORIZONTAL)
                );
                setVerticalScrollBarPositionAndSize(
                    calcScrollBarPositionAndSize(scrollAreaRef.current, contentRef.current, ScrollDirection.VERTICAL)
                );
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        const mutationObserver = new MutationObserver(handleResize);

        if (scrollAreaRef.current) {
            resizeObserver.observe(scrollAreaRef.current);
            scrollAreaRef.current.addEventListener("touchmove", handleScrollOrTouchMoveEvent);
            scrollAreaRef.current.addEventListener("scroll", handleScrollOrTouchMoveEvent);
        }
        if (contentRef.current) {
            resizeObserver.observe(contentRef.current);
            mutationObserver.observe(contentRef.current, { subtree: true, childList: true });
        }

        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();

            if (scrollAreaRef.current) {
                scrollAreaRef.current.removeEventListener("touchmove", handleScrollOrTouchMoveEvent);
                scrollAreaRef.current.removeEventListener("scroll", handleScrollOrTouchMoveEvent);
            }
        };
    }, [
        contentRef.current,
        scrollAreaRef.current,
        setHorizontalScrollBarPositionAndSize,
        setVerticalScrollBarPositionAndSize,
    ]);

    return (
        <div
            className="ScrollArea"
            style={{
                height: props.height || "",
                width: props.width || "",
            }}
        >
            <div
                className={`ScrollBar VerticalScrollBar${
                    verticalScrollBarActive ? " ScrollBar--active" : " ScrollBar--inactive"
                }`}
                ref={verticalScrollBarRef}
                style={{
                    display: verticalScrollBarVisible ? "block" : "none",
                    top: verticalScrollBarPositionAndSize.position,
                    height: verticalScrollBarPositionAndSize.size,
                }}
            ></div>
            <div
                className={`ScrollBar HorizontalScrollBar${
                    horizontalScrollBarActive ? " ScrollBar--active" : " ScrollBar--inactive"
                }`}
                ref={horizontalScrollBarRef}
                style={{
                    display: horizontalScrollBarVisible ? "block" : "none",
                    left: horizontalScrollBarPositionAndSize.position,
                    width: horizontalScrollBarPositionAndSize.size,
                }}
            ></div>
            <div
                className="ScrollAreaInner"
                ref={scrollAreaRef}
                style={{
                    paddingRight: verticalScrollBarVisible && !props.noScrollbarPadding ? 16 : 0,
                    paddingBottom: horizontalScrollBarVisible && !props.noScrollbarPadding ? 16 : 0,
                }}
            >
                <div ref={contentRef} className="ScrollArea__Content">
                    {props.children}
                </div>
            </div>
        </div>
    );
};

ScrollArea.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    width: PropTypes.number,
    height: PropTypes.number,
    noScrollbarPadding: PropTypes.bool,
};
