import React from "react";

import PropTypes from "prop-types";

import {
    MenuBarPosition,
    MenuDrawerPosition,
} from "../Menu/types/menu-position";

import { DrawerPosition } from "../../shared-types/webviz-content/drawer-position";
import { Margins } from "../../shared-types/margins";
import { PluginData, View } from "../../shared-types/webviz-content/webviz";
import { ContactPerson } from "../../shared-types/webviz-content/contact-person";
import { DeprecationWarning } from "../../shared-types/webviz-content/deprecation-warning";
import { FullScreenAction } from "../../shared-types/webviz-content/full-screen-menu";
import { TourStep } from "../../shared-types/webviz-content/tour-step";

type ActionMap<
    M extends {
        [index: string]: {
            [key: string]:
                | ContactPerson
                | DeprecationWarning[]
                | string
                | Margins
                | number
                | null
                | boolean
                | React.RefObject<HTMLDivElement>
                | View[]
                | ((action: string) => void)
                | FullScreenAction[]
                | TourStep[];
        } | null;
    }
> = {
    [Key in keyof M]: M[Key] extends undefined
        ? {
              type: Key;
          }
        : {
              type: Key;
              payload: M[Key];
          };
};

export enum StoreActions {
    RegisterPlugin = "register_plugin",
    UnregisterPlugin = "unregister_plugin",
    SetActiveView = "set_active_view",
    SetActivePlugin = "set_active_plugin",
    SetActivePluginAndView = "set_active_plugin_and_view",
    SetMenuPosition = "set_menu_position",
    SetActivePluginWrapperRef = "set_active_plugin_wrapper_ref",
    SetBackdropOpacity = "set_backdrop_opacity",
    SetFullScreenActions = "set_full_screen_actions",
    SetFullScreenActionsCallback = "set_full_screen_actions_callback",
    SetActiveViewDownloadCallback = "set_download_callback",
    SetOpenSettingsGroupId = "set_open_settings_group_id",
    SetSettingsDrawerOpen = "set_settings_drawer_open",
    IncrementViewUpdates = "increment_view_updated",
}

export type StoreState = {
    activePluginId: string;
    bodyMargins: Margins;
    position: DrawerPosition;
    pluginsData: PluginData[];
    activePluginWrapperRef: React.RefObject<HTMLDivElement> | null;
    openSettingsGroupId: string;
    settingsDrawerOpen: boolean;
    externalTrigger: boolean;
    backdropOpacity: number;
    fullScreenActionsCallback: (action: string) => void;
    activeViewDownloadCallback: () => void;
    fullScreenActions: FullScreenAction[];
    viewUpdates: number;
};

type Payload = {
    [StoreActions.RegisterPlugin]: {
        id: string;
        name: string;
        views: View[];
        initiallyActiveViewId: string;
        deprecationWarnings?: DeprecationWarning[];
        contactPerson?: ContactPerson;
        screenshotFilename?: string;
        feedbackUrl?: string;
        tourSteps?: TourStep[];
    };
    [StoreActions.UnregisterPlugin]: {
        id: string;
    };
    [StoreActions.SetActiveView]: {
        viewId: string;
    };
    [StoreActions.SetActivePlugin]: {
        pluginId: string;
    };
    [StoreActions.SetActivePluginAndView]: {
        pluginId: string;
        viewId: string;
    };
    [StoreActions.SetMenuPosition]: {
        pinned: boolean;
        menuBarPosition: MenuBarPosition;
        menuDrawerPosition: MenuDrawerPosition;
        bodyMargins: Margins;
    };
    [StoreActions.SetActivePluginWrapperRef]: {
        ref: React.RefObject<HTMLDivElement>;
    };
    [StoreActions.SetBackdropOpacity]: {
        opacity: number;
    };
    [StoreActions.SetFullScreenActions]: {
        actions: FullScreenAction[];
    };
    [StoreActions.SetFullScreenActionsCallback]: {
        callback: (action: string) => void;
    };
    [StoreActions.SetActiveViewDownloadCallback]: {
        callback: () => void;
    };
    [StoreActions.SetOpenSettingsGroupId]: {
        settingsGroupId: string;
    };
    [StoreActions.SetSettingsDrawerOpen]: {
        settingsDrawerOpen: boolean;
        externalTrigger: boolean;
    };
    [StoreActions.IncrementViewUpdates]: null;
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];

const setInitialState = (): StoreState => {
    return {
        activePluginId: "",
        pluginsData: [],
        bodyMargins: { left: 0, right: 0, top: 0, bottom: 0 },
        position: DrawerPosition.Left,
        activePluginWrapperRef: null,
        openSettingsGroupId: "",
        settingsDrawerOpen: false,
        backdropOpacity: 0,
        fullScreenActions: [],
        fullScreenActionsCallback: () => {
            return;
        },
        activeViewDownloadCallback: () => {
            return;
        },
        viewUpdates: 0,
        externalTrigger: false,
    };
};

export const StoreReducer = (
    state: StoreState,
    action: Actions
): StoreState => {
    if (action.type === StoreActions.RegisterPlugin) {
        return {
            ...state,
            activePluginId: !state.pluginsData.find(
                (plugin) => plugin.id === state.activePluginId
            )
                ? action.payload.id
                : state.activePluginId,
            pluginsData: [
                ...state.pluginsData,
                {
                    id: action.payload.id,
                    name: action.payload.name,
                    views: action.payload.views,
                    activeViewId: action.payload.initiallyActiveViewId,
                    contactPerson: action.payload.contactPerson,
                    deprecationWarnings: action.payload.deprecationWarnings,
                    screenshotFilename: action.payload.screenshotFilename,
                    feedbackUrl: action.payload.feedbackUrl,
                    tourSteps: action.payload.tourSteps,
                },
            ],
        };
    }
    if (action.type === StoreActions.UnregisterPlugin) {
        return {
            ...state,
            activePluginId:
                state.activePluginId === action.payload.id
                    ? state.pluginsData.find((_, index) => index === 0)?.id ||
                      ""
                    : state.activePluginId,
            pluginsData: state.pluginsData.filter(
                (plugin) => plugin.id !== action.payload.id
            ),
        };
    }
    if (action.type === StoreActions.SetActiveView) {
        return {
            ...state,
            pluginsData: [
                ...state.pluginsData.map((plugin) =>
                    plugin.id === state.activePluginId
                        ? { ...plugin, activeViewId: action.payload.viewId }
                        : plugin
                ),
            ],
        };
    }
    if (action.type === StoreActions.SetActivePluginAndView) {
        return {
            ...state,
            activePluginId: action.payload.pluginId,
            pluginsData: [
                ...state.pluginsData.map((plugin) =>
                    plugin.id === action.payload.pluginId
                        ? { ...plugin, activeViewId: action.payload.viewId }
                        : plugin
                ),
            ],
        };
    }
    if (action.type === StoreActions.SetActivePlugin) {
        return { ...state, activePluginId: action.payload.pluginId };
    }
    if (action.type === StoreActions.SetMenuPosition) {
        let position = DrawerPosition.Left;
        if (action.payload.pinned) {
            position = action.payload
                .menuDrawerPosition as string as DrawerPosition;
        } else {
            if (
                action.payload.menuBarPosition === MenuBarPosition.Top ||
                action.payload.menuBarPosition === MenuBarPosition.Bottom
            ) {
                position = action.payload
                    .menuDrawerPosition as string as DrawerPosition;
            } else {
                position = action.payload
                    .menuBarPosition as string as DrawerPosition;
            }
        }
        return {
            ...state,
            position: position,
            bodyMargins: action.payload.bodyMargins,
        };
    }
    if (action.type === StoreActions.SetActivePluginWrapperRef) {
        return {
            ...state,
            activePluginWrapperRef: action.payload.ref,
        };
    }
    if (action.type === StoreActions.SetBackdropOpacity) {
        return { ...state, backdropOpacity: action.payload.opacity };
    }
    if (action.type === StoreActions.SetFullScreenActions) {
        return { ...state, fullScreenActions: action.payload.actions };
    }
    if (action.type === StoreActions.SetFullScreenActionsCallback) {
        return { ...state, fullScreenActionsCallback: action.payload.callback };
    }
    if (action.type === StoreActions.SetActiveViewDownloadCallback) {
        return {
            ...state,
            activeViewDownloadCallback: action.payload.callback,
        };
    }
    if (action.type === StoreActions.SetOpenSettingsGroupId) {
        return {
            ...state,
            openSettingsGroupId: action.payload.settingsGroupId,
        };
    }
    if (action.type === StoreActions.SetSettingsDrawerOpen) {
        return {
            ...state,
            settingsDrawerOpen: action.payload.settingsDrawerOpen,
            externalTrigger: action.payload.externalTrigger,
        };
    }
    if (action.type === StoreActions.IncrementViewUpdates) {
        return {
            ...state,
            viewUpdates: state.viewUpdates + 1,
        };
    }
    return state;
};

type StoreContext = {
    state: StoreState;
    dispatch: React.Dispatch<Actions>;
};

const storeContext = React.createContext<StoreContext | undefined>(undefined);

type WebvizContentManagerParentProps = {
    activeViewId: string;
    activePluginId: string;
};

type WebvizContentManagerProps = {
    id: string;
    activePluginId?: string;
    activeViewId?: string;
    initiallyActivePluginId?: string;
    initiallyActiveViewId?: string;
    children?: React.ReactNode;
    setProps?: (props: WebvizContentManagerParentProps) => void;
};

export const WebvizContentManager: React.FC<WebvizContentManagerProps> = (
    props
) => {
    const [state, dispatch] = React.useReducer(
        StoreReducer,
        null,
        setInitialState
    );
    const [lastHref, setLastHref] = React.useState<string>("");

    React.useEffect(() => {
        const href = window.location.href;
        const data = JSON.parse(sessionStorage.getItem(href) || "{}");
        if (href !== lastHref && Object.keys(data).length === 2) {
            dispatch({
                type: StoreActions.SetActivePluginAndView,
                payload: {
                    pluginId: data.activePluginId,
                    viewId: data.activeViewId,
                },
            });

            if (props.setProps) {
                props.setProps({
                    activeViewId: data.activeViewId,
                    activePluginId: data.activePluginId,
                });
            }
        } else {
            const activePluginId = state.activePluginId;
            const activeViewId = state.pluginsData.find(
                (plugin) => plugin.id === state.activePluginId
            )?.activeViewId;

            if (activePluginId && activeViewId) {
                sessionStorage.setItem(
                    href,
                    JSON.stringify({
                        activePluginId: activePluginId,
                        activeViewId: activeViewId,
                    })
                );
            }
        }
        setLastHref(href);
    }, [state.pluginsData]);

    React.useEffect(() => {
        if (props.setProps) {
            props.setProps({
                activeViewId:
                    state.pluginsData.find(
                        (plugin) => plugin.id === state.activePluginId
                    )?.activeViewId || "",
                activePluginId: state.activePluginId,
            });
        }
    }, [state.pluginsData, state.activePluginId]);

    return (
        <storeContext.Provider value={{ state, dispatch }}>
            {props.children}
        </storeContext.Provider>
    );
};

export const useStore = (): StoreContext =>
    React.useContext<StoreContext>(storeContext as React.Context<StoreContext>);

WebvizContentManager.propTypes = {
    id: PropTypes.string.isRequired,
    activePluginId: PropTypes.string,
    activeViewId: PropTypes.string,
    children: PropTypes.node,
    setProps: PropTypes.func,
};
