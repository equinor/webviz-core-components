import React from "react";
import { Icon } from "@equinor/eds-core-react";
import { check } from "@equinor/eds-icons";
Icon.add({ check });

import { View } from "../../../../shared-types/webviz-content/webviz";

import { Point } from "../../../../shared-types/point";

import "./view-list.css";
import { Tooltip } from "@material-ui/core";

export type ViewListProps = {
    open: boolean;
    location: "below" | "aside";
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
    const [viewGroups, setViewGroups] = React.useState<
        {
            group: string;
            views: View[];
        }[]
    >([]);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        if (props.anchorElement) {
            const rect = props.anchorElement.getBoundingClientRect();
            if (props.location === "below") {
                setMainPosition({
                    x:
                        rect.left +
                        rect.width / 2 -
                        (ref.current?.getBoundingClientRect().width || 0) / 2,
                    y: rect.bottom + 20,
                });
            } else {
                setMainPosition({
                    x: rect.right + 40,
                    y: Math.max(8, rect.top + rect.height / 2),
                });
            }
        }
    }, [props.anchorElement, props.location, ref.current]);

    React.useEffect(() => {
        const viewList: {
            group: string;
            views: View[];
        }[] = [];

        const traversed_groups: string[] = [];

        props.views.forEach((view) => {
            if (view.group === "") {
                viewList.push({
                    group: "",
                    views: [view],
                });
            } else if (!traversed_groups.includes(view.group)) {
                viewList.push({
                    group: view.group,
                    views: props.views.filter((el) => el.group === view.group),
                });
                traversed_groups.push(view.group);
            }
        });
        setViewGroups(viewList);
    }, [props.views]);

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
            ref={ref}
        >
            <div
                className={`WebvizViewList__Arrow WebvizViewList__Arrow${
                    props.location.charAt(0).toUpperCase() +
                    (props.location as string).slice(1)
                }`}
            />
            <div className="WebvizViewList__Content">
                {viewGroups.map((el) => {
                    if (el.group === "") {
                        return (
                            <Tooltip
                                key={el.views[0].id}
                                title={el.views[0].name}
                                enterDelay={1000}
                                enterNextDelay={1000}
                            >
                                <div
                                    className="WebvizViewList__Item"
                                    onClick={() =>
                                        props.onActiveViewChange(el.views[0].id)
                                    }
                                >
                                    <div>
                                        {el.views[0].id ===
                                            props.activeViewId && (
                                            <Icon name="check" />
                                        )}
                                    </div>
                                    <div className="WebvizViewList__Item__Text">
                                        {el.views[0].name}
                                    </div>
                                </div>
                            </Tooltip>
                        );
                    } else {
                        return (
                            <div
                                className="WebvizViewList__Group"
                                key={el.group}
                            >
                                <div className="WebvizViewList__GroupTitle">
                                    {el.group}
                                </div>
                                {el.views.map((view) => (
                                    <Tooltip
                                        key={view.id}
                                        title={view.name}
                                        enterDelay={1000}
                                        enterNextDelay={1000}
                                    >
                                        <div
                                            className="WebvizViewList__Item"
                                            onClick={() =>
                                                props.onActiveViewChange(
                                                    view.id
                                                )
                                            }
                                        >
                                            <div>
                                                {view.id ===
                                                    props.activeViewId && (
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
                        );
                    }
                })}
            </div>
        </div>
    );
};
