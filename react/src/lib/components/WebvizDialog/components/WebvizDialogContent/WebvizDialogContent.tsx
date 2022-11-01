import React from "react";

import { ScrollArea } from "../../../ScrollArea";

import "./webviz-dialog-content.css";

export type WebvizDialogContentProps = {
    height?: number | string;
    children: React.ReactNode;
    useScrollArea: boolean;
};

export const WebvizDialogContent = React.forwardRef<
    HTMLDivElement,
    WebvizDialogContentProps
>((props, ref) => {
    return (
        <div
            className="WebvizDialogContent"
            ref={ref}
            style={{ height: props.height }}
        >
            {props.useScrollArea ? (
                <ScrollArea noScrollbarPadding={true}>
                    {props.children}
                </ScrollArea>
            ) : (
                <>{props.children}</>
            )}
        </div>
    );
});

WebvizDialogContent.displayName = "WebvizDialogContent";
