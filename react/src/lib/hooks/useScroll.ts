import React from "react";

export const useScroll = ({
    ref,
    minScale = 0.5,
    maxScale = 3,
    delta = 0.1,
}: {
    ref: React.RefObject<HTMLElement>;
    minScale?: number;
    maxScale?: number;
    delta?: number;
}): {
    scale: number;
    resetScale: () => void;
    setNewScale: (newScale: number) => void;
} => {
    const [scale, setScale] = React.useState(1);

    React.useEffect(() => {
        const handleWheelEvent = (e: WheelEvent) => {
            e.preventDefault();
            setScale(
                Math.min(
                    maxScale,
                    Math.max(minScale, scale - Math.sign(e.deltaY) * delta)
                )
            );
        };

        if (ref.current) {
            ref.current.addEventListener("wheel", handleWheelEvent);
        }

        return () => {
            if (ref.current) {
                ref.current.removeEventListener("wheel", handleWheelEvent);
            }
        };
    }, [ref, scale]);

    const resetScale = React.useCallback(() => {
        setScale(1);
    }, []);

    const setNewScale = React.useCallback(
        (newScale: number) => {
            setScale(newScale);
        },
        [setScale]
    );

    return { scale: scale, resetScale: resetScale, setNewScale: setNewScale };
};
