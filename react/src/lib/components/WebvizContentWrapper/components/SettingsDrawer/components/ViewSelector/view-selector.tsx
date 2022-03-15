import React from "react";

import { view_carousel, chevron_down } from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";
Icon.add({ view_carousel, chevron_down });

import { StoreActions, useStore } from "../../../ContentManager";

import "./view-selector.css";
import { ViewList } from "../ViewList/view-list";
import { Overlay } from "../../../../../Overlay";
import ReactDOM from "react-dom";

type ViewSelectorProps = {
    open: boolean;
    width: number;
};

export const ViewSelector: React.FC<ViewSelectorProps> = (
    props: ViewSelectorProps
) => {
    const store = useStore();
    const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
    const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);
    const transitionTimer =
        React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const viewCarouselRef = React.useRef<HTMLDivElement>(null);
    const viewNameRef = React.useRef<HTMLDivElement>(null);
    const [popupContainer, setPopupContainer] =
        React.useState<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        setPopupContainer(container);

        return () => {
            document.body.removeChild(container);
        };
    }, []);

    React.useEffect(() => {
        if (popupContainer) {
            if (menuOpen) {
                const ViewListElements = () => (
                    <>
                        <Overlay
                            visible={menuOpen}
                            onClick={() => setMenuOpen(false)}
                        />
                        <ViewList
                            open={menuOpen}
                            views={
                                store.state.pluginsData.find(
                                    (plugin) =>
                                        plugin.id === store.state.activePluginId
                                )?.views || []
                            }
                            activeViewId={
                                store.state.pluginsData.find(
                                    (plugin) =>
                                        plugin.id === store.state.activePluginId
                                )?.activeViewId || ""
                            }
                            anchorElement={
                                props.open
                                    ? viewNameRef.current
                                    : viewCarouselRef.current
                            }
                            location={props.open ? "bottom" : "right"}
                            onActiveViewChange={handleSelectViewClick}
                        />
                    </>
                );
                ReactDOM.render(<ViewListElements />, popupContainer);
            } else {
                ReactDOM.render(<></>, popupContainer);
            }
        }
    }, [
        menuOpen,
        popupContainer,
        props.open,
        store.state.activePluginId,
        store.state.pluginsData,
    ]);

    React.useEffect(() => {
        return () => {
            if (transitionTimer.current) {
                clearTimeout(transitionTimer.current);
            }
        };
    }, []);

    React.useLayoutEffect(() => {
        if (transitionTimer.current) {
            clearTimeout(transitionTimer.current);
        }
        if (!props.open) {
            transitionTimer.current = setTimeout(
                () => setIsCollapsed(true),
                1000
            );
        } else {
            setIsCollapsed(false);
        }
    }, [props.open, props.width]);

    const handleSelectViewClick = React.useCallback(
        (view: string) => {
            if (store) {
                store.dispatch({
                    type: StoreActions.SetActiveView,
                    payload: { viewId: view },
                });
            }
        },
        [store]
    );

    const plugin = store.state.pluginsData.find(
        (plugin) => plugin.id === store.state.activePluginId
    );

    const activeViewName =
        plugin?.views.find((elm) => elm.id === plugin.activeViewId)?.name ||
        "No active view";

    return (
        <div
            className="WebvizViewSelector"
            style={{
                width: isCollapsed ? "auto" : props.width - 36,
                height: plugin?.views && plugin.views.length > 1 ? 56 : 0,
                opacity: plugin?.views && plugin.views.length > 1 ? 1 : 0,
            }}
            onClick={() => setMenuOpen(true)}
        >
            <div ref={viewCarouselRef}>
                <Icon name="view_carousel" />
            </div>
            <div
                ref={viewNameRef}
                className="WebvizViewSelector__ViewName"
                style={{
                    opacity: props.open ? 1 : 0,
                    width: isCollapsed ? 0 : "auto",
                }}
            >
                {plugin?.views && plugin.views.length > 1 && activeViewName}
            </div>
            <div
                style={{
                    opacity: props.open ? 1 : 0,
                    width: isCollapsed ? 0 : "auto",
                }}
            >
                <Icon name="chevron_down" />
            </div>
        </div>
    );
};