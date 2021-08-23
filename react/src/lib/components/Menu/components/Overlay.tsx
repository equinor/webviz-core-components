import React from "react";

import "./Overlay.css";

type OverlayProps = {
    visible: boolean;
};

export const Overlay: React.FC<OverlayProps> = (props) => {
    const [opacity, setOpacity] = React.useState<number>(0);
    const handleClickEvent = () => {

    }

    React.useEffect(() => {
        if (!props.visible) {
            let currentOpacity = 0.5;
            const interval = setInterval(() => {
                if (currentOpacity === 0) {
                    clearInterval(interval);
                    return;
                }
                currentOpacity -= 0.05;
                setOpacity(currentOpacity);
            }, 100);
        }
        else {
            let currentOpacity = 0.0;
            const interval = setInterval(() => {
                if (currentOpacity === 0.5) {
                    clearInterval(interval);
                    return;
                }
                currentOpacity += 0.05;
                setOpacity(currentOpacity);
            }, 100);
        }
    }, [props.visible]);

    return <div className="Overlay" style={{display: opacity > 0 ? "block" : "none", opacity: opacity}}></div>
}
