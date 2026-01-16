import React from "react";

export type VirtualizedListProps<TItem> = {
    items: TItem[];
    itemHeight: number;
    maxHeight: number;
    renderItem: (item: TItem, isSelected: boolean) => React.ReactNode;
    onItemClick?: (item: TItem, index: number) => void;
    overscanCount?: number;
    selectedIndex?: number | null;
};

const DEFAULT_PROPS: Partial<VirtualizedListProps<unknown>> = {
    overscanCount: 3,
};

export function VirtualizedList<TItem>(
    props: VirtualizedListProps<TItem>
): React.ReactElement {
    const defaultedProps = {
        ...DEFAULT_PROPS,
        ...props,
    };

    const [scrollTop, setScrollTop] = React.useState<number>(0);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const prevSelectedIndexRef = React.useRef<number | null>(null);

    const totalHeight = defaultedProps.items.length * defaultedProps.itemHeight;
    const containerHeight = Math.min(totalHeight, defaultedProps.maxHeight);

    // Auto-scroll to keep selected item visible
    React.useEffect(() => {
        if (
            defaultedProps.selectedIndex === null ||
            defaultedProps.selectedIndex === undefined ||
            !scrollContainerRef.current
        ) {
            return;
        }

        const selectedIndex = defaultedProps.selectedIndex;
        const prevSelectedIndex = prevSelectedIndexRef.current;
        prevSelectedIndexRef.current = selectedIndex;

        const itemTop = selectedIndex * defaultedProps.itemHeight;
        const itemBottom = itemTop + defaultedProps.itemHeight;
        const currentScrollTop = scrollContainerRef.current.scrollTop;
        const visibleTop = currentScrollTop;
        const visibleBottom = currentScrollTop + containerHeight;

        // Determine scroll direction
        const isScrollingDown =
            prevSelectedIndex === null || selectedIndex > prevSelectedIndex;

        if (isScrollingDown) {
            // Scrolling down - keep item at bottom of visible area
            if (itemBottom > visibleBottom) {
                scrollContainerRef.current.scrollTop =
                    itemBottom - containerHeight;
            }
        } else {
            // Scrolling up - keep item at top of visible area
            if (itemTop < visibleTop) {
                scrollContainerRef.current.scrollTop = itemTop;
            }
        }
    }, [
        defaultedProps.selectedIndex,
        defaultedProps.itemHeight,
        containerHeight,
    ]);

    // Calculate visible range
    const startIndex = Math.max(
        0,
        Math.floor(scrollTop / defaultedProps.itemHeight) -
            (defaultedProps.overscanCount || 2)
    );
    const endIndex = Math.min(
        defaultedProps.items.length,
        Math.ceil((scrollTop + containerHeight) / defaultedProps.itemHeight) +
            (defaultedProps.overscanCount || 2)
    );

    const handleScroll = React.useCallback(function handleScroll(
        e: React.UIEvent<HTMLDivElement>
    ) {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    const visibleItems = defaultedProps.items.slice(startIndex, endIndex);

    return (
        <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{
                overflowY: "auto",
                height: containerHeight,
                position: "relative",
            }}
        >
            <div style={{ height: totalHeight, position: "relative" }}>
                {visibleItems.map((item, index) => {
                    const itemIndex = startIndex + index;
                    return (
                        <div
                            key={itemIndex}
                            tabIndex={0}
                            style={{
                                position: "absolute",
                                top: itemIndex * defaultedProps.itemHeight,
                                height: defaultedProps.itemHeight,
                                maxHeight: defaultedProps.itemHeight,
                                overflowY: "hidden",
                                width: "100%",
                                boxSizing: "border-box",
                            }}
                            onClick={() =>
                                defaultedProps.onItemClick?.(item, itemIndex)
                            }
                        >
                            <React.Fragment key={itemIndex}>
                                {defaultedProps.renderItem(
                                    item,
                                    itemIndex === defaultedProps.selectedIndex
                                )}
                            </React.Fragment>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
