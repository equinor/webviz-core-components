import { Icon } from "@equinor/eds-core-react";
import { IconButton } from "@material-ui/core";
import { settings, download, camera, fullscreen } from "@equinor/eds-icons";
import React from "react";
import { useStore } from "../../../ContentManager";

import "./view-element.css";

Icon.add({ settings, download, camera, fullscreen });

export type ViewElementProps = {
    id: string;
    children: React.ReactChild;
    settings?: React.ReactChild;
};

export const ViewElement: React.FC<ViewElementProps> = (
    props: ViewElementProps
) => {
    return (
        <div className="WebvizViewElement">
            <div className="WebvizViewElement__Content">{props.children}</div>
            <div className="WebvizViewElement__Actions">
                {props.settings && (
                    <div>
                        <IconButton>
                            <Icon name="settings" />
                        </IconButton>
                    </div>
                )}
                <div className="WebvizViewElement__Actions__Spacer" />
                <div>
                    <IconButton>
                        <Icon name="download" />
                    </IconButton>
                </div>
                <div>
                    <IconButton>
                        <Icon name="camera" />
                    </IconButton>
                </div>
                <div>
                    <IconButton>
                        <Icon name="fullscreen" />
                    </IconButton>
                </div>
            </div>
        </div>
    );
};
