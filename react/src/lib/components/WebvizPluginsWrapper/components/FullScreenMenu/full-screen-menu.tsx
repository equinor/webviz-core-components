import { IconButton, Tooltip } from "@material-ui/core";
import * as edsIcons from "@equinor/eds-icons";
import { IconData } from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";
import React from "react";
import { useStore } from "../../../WebvizContentManager/WebvizContentManager";

import "./full-screen-menu.css";

export type FullScreenMenuProps = {
    opacity: number;
};

export const FullScreenMenu: React.FC<FullScreenMenuProps> = (
    props: FullScreenMenuProps
) => {
    const store = useStore();
    return (
        <div
            className="WebvizFullScreenMenu"
            style={{
                opacity: props.opacity,
                display: props.opacity === 0 ? "none" : "block",
            }}
        >
            {store.state.fullScreenActions.map((action) => {
                const icon: IconData | undefined = Object.values(edsIcons).find(
                    (el) => el.name === action.icon
                );
                return (
                    <IconButton
                        key={action.actionName}
                        onClick={() =>
                            store.state.fullScreenActionsCallback &&
                            store.state.fullScreenActionsCallback(
                                action.actionName
                            )
                        }
                    >
                        <Tooltip title={action.tooltip}>
                            <Icon data={icon} />
                        </Tooltip>
                    </IconButton>
                );
            })}
        </div>
    );
};
