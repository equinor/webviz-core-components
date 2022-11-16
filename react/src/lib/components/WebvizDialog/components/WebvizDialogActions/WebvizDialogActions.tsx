import React from "react";

import { Button } from "@material-ui/core";

import "./webviz-dialog-actions.css";

export type WebvizDialogActionsParentProps = {
    last_action_called?: string;
};

export type WebvizDialogActionsProps = {
    height?: number;
    actions?: string[];
    onActionClick: (parentProps: WebvizDialogActionsParentProps) => void;
};

export const WebvizDialogActions = React.forwardRef<
    HTMLDivElement,
    WebvizDialogActionsProps
>((props, ref) => {
    const handleActionClick = React.useCallback(
        (action: string) => {
            if (props.onActionClick) {
                props.onActionClick({ last_action_called: action });
            }
        },
        [props.onActionClick]
    );

    return (
        <div
            className="WebvizDialogActions"
            ref={ref}
            style={{
                height:
                    props.actions && props.actions.length > 0
                        ? props.height
                        : 0,
            }}
        >
            {props.actions?.map((action) => (
                <Button
                    key={action}
                    component="button"
                    onClick={() => handleActionClick(action as string)}
                >
                    {action}
                </Button>
            ))}
        </div>
    );
});

WebvizDialogActions.displayName = "WebvizDialogActions";
