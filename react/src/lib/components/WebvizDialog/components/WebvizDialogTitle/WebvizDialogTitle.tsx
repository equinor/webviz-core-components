import React from "react";
import PropTypes from "prop-types";

import { IconButton } from "@material-ui/core";

import "./webviz-dialog-title.css";

import { Icon } from "@equinor/eds-core-react";
import { close } from "@equinor/eds-icons";

Icon.add({ close });

export type WebvizDialogTitleProps = {
    title: string;
    onClose?: () => void;
};

export const WebvizDialogTitle = React.forwardRef<
    HTMLDivElement,
    WebvizDialogTitleProps
>((props, ref) => {
    const buttonWrapperRef = React.useRef<HTMLDivElement>(null);

    const handleCloseClick = React.useCallback(() => {
        if (props.onClose) {
            props.onClose();
        }
    }, [props.onClose]);

    React.useEffect(() => {
        const handleMouseDownAndTouchStart = (e: MouseEvent | TouchEvent) => {
            e.stopPropagation();
        };

        if (buttonWrapperRef.current) {
            buttonWrapperRef.current.addEventListener(
                "mousedown",
                handleMouseDownAndTouchStart
            );
            buttonWrapperRef.current.addEventListener(
                "touchstart",
                handleMouseDownAndTouchStart
            );
        }

        return () => {
            if (buttonWrapperRef.current) {
                buttonWrapperRef.current.removeEventListener(
                    "mousedown",
                    handleMouseDownAndTouchStart
                );
                buttonWrapperRef.current.removeEventListener(
                    "touchstart",
                    handleMouseDownAndTouchStart
                );
            }
        };
    }, [buttonWrapperRef]);

    return (
        <div className="WebvizDialogTitle" ref={ref}>
            <div>{props.title}</div>
            {props.onClose && (
                <div ref={buttonWrapperRef}>
                    <IconButton
                        aria-label="close"
                        onClick={() => handleCloseClick()}
                    >
                        <Icon name="close" />
                    </IconButton>
                </div>
            )}
        </div>
    );
});

WebvizDialogTitle.displayName = "WebvizDialogTitle";

WebvizDialogTitle.propTypes = {
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func,
};
