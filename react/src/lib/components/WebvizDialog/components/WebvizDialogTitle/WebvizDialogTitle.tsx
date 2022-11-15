import React from "react";

import { IconButton } from "@material-ui/core";

import { Icon } from "@equinor/eds-core-react";
import { close } from "@equinor/eds-icons";

import "./webviz-dialog-title.css";

Icon.add({ close });

export type WebvizDialogTitleProps = {
    title: string;
    height: number;
    draggable?: boolean;
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

        if (buttonWrapperRef.current && props.draggable) {
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
            if (buttonWrapperRef.current && props.draggable) {
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
    }, [props.draggable]);

    return (
        <div
            className="WebvizDialogTitle"
            ref={ref}
            style={{
                height: props.height,
                cursor: props.draggable ? "move" : "",
            }}
        >
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
