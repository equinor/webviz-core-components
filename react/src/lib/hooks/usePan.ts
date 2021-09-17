import { ORIGIN, pointDifference, pointSum } from "../utils/geometry";
import React from "react";

import { Point } from "../shared-types/point";

export const usePan = (ref: React.RefObject<HTMLElement>): Point => {
    const [panPosition, setPanPosition] = React.useState<Point>(ORIGIN);
    const referencePositionRef = React.useRef<Point>(ORIGIN);
    const panningStarted = React.useRef<boolean>(false);

    const handleMouseMove = React.useCallback(
        (e: MouseEvent) => {
            const referencePosition = referencePositionRef.current;
            const currentPosition = { x: e.pageX, y: e.pageY };
            const delta = pointDifference(referencePosition, currentPosition);

            if (!panningStarted.current) {
                panningStarted.current = true;
            } else {
                referencePositionRef.current = currentPosition;
                setPanPosition((panPosition) => pointSum(panPosition, delta));
            }
        },
        [panningStarted, setPanPosition]
    );

    const handleMouseUp = React.useCallback(() => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp, true);
        document.body.classList.remove("Menu__effects__unselectable");
    }, [handleMouseMove, panningStarted]);

    const handleMouseDown = React.useCallback(
        (e: MouseEvent) => {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp, true);
            referencePositionRef.current = { x: e.pageX, y: e.pageY };
            document.body.classList.add("Menu__effects__unselectable");
        },
        [handleMouseMove, handleMouseUp]
    );

    const handleMouseClick = (e: MouseEvent) => {
        if (panningStarted.current === true) {
            e.stopPropagation();
        }
        panningStarted.current = false;
    };

    React.useEffect(() => {
        if (ref.current) {
            ref.current.addEventListener("mousedown", handleMouseDown);
            window.addEventListener("click", handleMouseClick, true);
        }
        return () => {
            if (ref.current) {
                ref.current.removeEventListener("mousedown", handleMouseDown);
                window.removeEventListener("click", handleMouseClick, true);
            }
        };
    }, []);

    return panPosition;
};
