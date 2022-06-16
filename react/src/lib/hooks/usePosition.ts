import { useEffect, useState, useRef } from "react";

import { Point } from "../shared-types/point";

export const usePosition = (ref: React.RefObject<HTMLElement>): Point => {
    const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        if (ref.current) {
            intervalRef.current = setInterval(() => {
                if (!ref.current) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }
                    return;
                }
                const boundingClientRect = ref.current.getBoundingClientRect();
                setPosition({
                    x: boundingClientRect.left,
                    y: boundingClientRect.top,
                });
            });
        }
    }, [ref]);

    return position;
};
