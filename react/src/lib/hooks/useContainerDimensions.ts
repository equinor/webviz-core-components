import React from "react";

import { Size } from "../shared-types/size";

export const useContainerDimensions = (
    ref: React.RefObject<HTMLElement>
): Size => {
    const [dimensions, setDimensions] = React.useState<Size>({
        width: 0,
        height: 0,
    });

    React.useEffect(() => {
        const getDimensions = (): Size => ({
            width: ref.current ? ref.current.offsetWidth : 0,
            height: ref.current ? ref.current.offsetHeight : 0,
        });

        const handleResize = () => {
            setDimensions(getDimensions());
        };

        if (ref.current) {
            setDimensions(getDimensions());
        }

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [ref]);

    return dimensions;
};
