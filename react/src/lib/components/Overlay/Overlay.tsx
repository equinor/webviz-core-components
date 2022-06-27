import React from "react";
import PropTypes from "prop-types";
import "./Overlay.css";

export type OverlayProps = {
    visible: boolean;
    zIndex?: number;
    onClick: () => void;
};

/**
 * An overlay that can be used to remove focus from the background and set focus on a certain component
 * (e.g. dialog, notification).
 */
export const Overlay: React.FC<OverlayProps> = (props) => {
    const [opacity, setOpacity] = React.useState<number>(0);

    const hideOverlay = React.useCallback(() => {
        let currentOpacity = 0.5;
        const interval = setInterval(() => {
            if (currentOpacity <= 0) {
                setOpacity(0);
                clearInterval(interval);
                return;
            }
            currentOpacity -= 0.05;
            setOpacity(currentOpacity);
        }, 10);
    }, [setOpacity]);

    const showOverlay = React.useCallback(() => {
        let currentOpacity = 0.0;
        const interval = setInterval(() => {
            if (currentOpacity >= 0.5) {
                setOpacity(0.5);
                clearInterval(interval);
                return;
            }
            currentOpacity += 0.05;
            setOpacity(currentOpacity);
        }, 10);
    }, [setOpacity]);

    React.useEffect(() => {
        if (!props.visible) {
            hideOverlay();
        } else {
            showOverlay();
        }
    }, [props.visible]);

    return (
        <div
            className="WebvizOverlay"
            style={{
                display: opacity > 0 ? "block" : "none",
                opacity: opacity,
                zIndex: props.zIndex || 1001,
            }}
            onClick={props.onClick}
        ></div>
    );
};

Overlay.propTypes = {
    /**
     * Set if the overlay shall be shown or not.
     */
    visible: PropTypes.bool.isRequired,
    /**
     * Optionally defined a preferred z-index for the overlay.
     */
    zIndex: PropTypes.number,
    /**
     * Callback function called when the overlay is clicked on.
     */
    onClick: PropTypes.func.isRequired,
};
