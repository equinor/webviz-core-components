import React from "react";
import * as ReactDOM from "react-dom";

type WebvizDialogPortalProps = {
    target: Element | DocumentFragment | null;
    children?: React.ReactNode;
    open?: boolean;
};

// This component is used to render the dialog component using React.createPortal
// and ensure a defined component s.t. dash-generate-components command can detect
// and generate the WebvizDialog component for Dash correctly.
export const WebvizDialogPortal = React.forwardRef<
    HTMLDivElement,
    WebvizDialogPortalProps
>((props, ref) => {
    return props.target ? (
        ReactDOM.createPortal(
            <div
                aria-label="WebvizDialogPortal"
                ref={ref}
                style={{ display: props.open ? "block" : "none" }}
            >
                {props.children}
            </div>,
            props.target
        )
    ) : (
        <div></div>
    );
});

WebvizDialogPortal.displayName = "WebvizDialogPortal";
