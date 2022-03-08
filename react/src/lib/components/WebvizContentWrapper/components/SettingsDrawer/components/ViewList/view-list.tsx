import React from "react";
import { Icon } from "@equinor/eds-core-react";
import { check } from "@equinor/eds-icons";
Icon.add({ check });

import { View } from "../../../ContentManager";

import { Point } from "../../../../../../shared-types/point";

import "./view-list.css";
import { Tooltip } from "@material-ui/core";

export type ViewListProps = {
    open: boolean;
    location: "bottom" | "right";
    views: View[];
    activeViewId: string;
    anchorElement: HTMLElement | null;
    onActiveViewChange: (viewId: string) => void;
};

export const ViewList: React.FC<ViewListProps> = (props: ViewListProps) => {
    const [mainPosition, setMainPosition] = React.useState<Point>({
        x: 0,
        y: 0,
    });

    React.useLayoutEffect(() => {
        if (props.anchorElement) {
            const rect = props.anchorElement.getBoundingClientRect();
            if (props.location === "bottom") {
                setMainPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 20,
                });
            } else {
                setMainPosition({
                    x: rect.right + 40,
                    y: Math.max(8, rect.top + rect.height / 2),
                });
            }
        }
    }, [props.anchorElement]);

    return (
        <div
            className={`WebvizViewList WebvizViewList__${
                props.location.charAt(0).toUpperCase() +
                (props.location as string).slice(1)
            }`}
            style={{
                left: mainPosition.x,
                top: mainPosition.y,
                display: props.open ? "block" : "none",
            }}
        >
            <div
                className={`WebvizViewList__Arrow WebvizViewList__Arrow${
                    props.location.charAt(0).toUpperCase() +
                    (props.location as string).slice(1)
                }`}
            />
            <div className="WebvizViewList__Content">
                {props.views.map((view) => (
                    <Tooltip
                        key={view.id}
                        title={view.name}
                        enterDelay={1000}
                        enterNextDelay={1000}
                    >
                        <div
                            className="WebvizViewList__Item"
                            onClick={() => props.onActiveViewChange(view.id)}
                        >
                            <div>
                                {view.id === props.activeViewId && (
                                    <Icon name="check" />
                                )}
                            </div>
                            <div className="WebvizViewList__Item__Text">
                                {view.name}
                            </div>
                        </div>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
};
