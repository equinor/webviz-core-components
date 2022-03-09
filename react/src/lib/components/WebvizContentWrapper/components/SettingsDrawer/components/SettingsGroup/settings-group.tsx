import { Icon } from "@equinor/eds-core-react";
import { chevron_down, chevron_up } from "@equinor/eds-icons";
import { IconButton } from "@material-ui/core";
import useSize from "@react-hook/size";
import React from "react";

import "./settings-group.css";

Icon.add({ chevron_down, chevron_up });

export type SettingsGroupProps = {
    id: string;
    title: string;
    open: boolean;
    children: React.ReactChild;
    onToggle: (id: string) => void;
};

export const SettingsGroup: React.FC<SettingsGroupProps> = (
    props: SettingsGroupProps
) => {
    const contentRef = React.useRef<HTMLDivElement>(null);
    const contentSize = useSize(contentRef);

    return (
        <div className="WebvizSettingsGroup">
            <div
                className="WebvizSettingsGroup__Title"
                onClick={() => props.onToggle(props.id)}
            >
                <div className="WebvizSettingsGroup__TitleText">
                    {props.title}
                </div>
                <div>
                    <IconButton>
                        <Icon
                            name={props.open ? "chevron_up" : "chevron_down"}
                        />
                    </IconButton>
                </div>
            </div>
            <div
                className="WebvizSettingsGroup__Content"
                style={{ height: props.open ? contentSize[1] : 0 }}
            >
                <div ref={contentRef}>{props.children}</div>
            </div>
        </div>
    );
};
