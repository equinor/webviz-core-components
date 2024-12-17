import React from "react";

function elementIsVisible(element: HTMLElement | SVGSVGElement): boolean {
    if (element instanceof HTMLElement) {
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }
    return (
        element.getClientRects() &&
        element.getBoundingClientRect().width > 0 &&
        element.getBoundingClientRect().height > 0
    );
}

export function useSize(ref: React.RefObject<HTMLElement>): [number, number] {
    const [size, setSize] = React.useState<[number, number]>([0, 0]);

    React.useEffect(function refChangeEffect() {
        let isHidden = false;
        let currentSize: [number, number] = [0, 0];
        function handleResize() {
            let newSize: [number, number] = [0, 0];
            if (ref.current) {
                // If element is not visible do not change size as it might be expensive to render
                if (!elementIsVisible(ref.current)) {
                    isHidden = true;
                    return;
                }

                newSize = [ref.current.offsetWidth, ref.current.offsetHeight];

                if (isHidden && currentSize[0] === newSize[0] && currentSize[1] === newSize[1]) {
                    isHidden = false;
                    return;
                }

                currentSize = newSize;
            }
            setSize(newSize);
        }

        const resizeObserver = new ResizeObserver(handleResize);

        if (ref.current) {
            handleResize();
            resizeObserver.observe(ref.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [ref]);

    return size;
}