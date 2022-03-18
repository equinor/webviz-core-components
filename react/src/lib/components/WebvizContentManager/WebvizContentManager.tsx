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
                | View[];
        };
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
    SetMenuPosition = "set_menu_position",
    SetActivePluginWrapperRef = "set_active_plugin_wrapper_ref",
    SetPluginDownloadRequested = "set_plugin_download_requested",
}

export type StoreState = {
    activePluginId: string;
    bodyMargins: Margins;
    position: DrawerPosition;
    pluginsData: PluginData[];
    activePluginWrapperRef: React.RefObject<HTMLDivElement> | null;
    pluginDownloadRequested: boolean;
};

type Payload = {
    [StoreActions.RegisterPlugin]: {
        id: string;
        name: string;
        views: View[];
        showDownload: boolean;
        deprecationWarnings?: DeprecationWarning[];
        contactPerson?: ContactPerson;
        screenshotFilename?: string;
        feedbackUrl?: string;
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
    [StoreActions.SetMenuPosition]: {
        pinned: boolean;
        menuBarPosition: MenuBarPosition;
        menuDrawerPosition: MenuDrawerPosition;
        bodyMargins: Margins;
    };
    [StoreActions.SetActivePluginWrapperRef]: {
        ref: React.RefObject<HTMLDivElement>;
    };
    [StoreActions.SetPluginDownloadRequested]: {
        request: boolean;
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];

const setInitialState = (): StoreState => {
    return {
        activePluginId: "",
        pluginsData: [],
        bodyMargins: { left: 0, right: 0, top: 0, bottom: 0 },
        position: DrawerPosition.Left,
        activePluginWrapperRef: null,
        pluginDownloadRequested: false,
    };
};

export const StoreReducer = (
    state: StoreState,
    action: Actions
): StoreState => {
    if (action.type === StoreActions.RegisterPlugin) {
        return {
            ...state,
            activePluginId:
                state.activePluginId === ""
                    ? action.payload.id
                    : state.activePluginId,
            pluginsData: [
                ...state.pluginsData,
                {
                    id: action.payload.id,
                    name: action.payload.name,
                    views: action.payload.views,
                    showDownload: action.payload.showDownload,
                    activeViewId:
                        action.payload.views.find((_, index) => index === 0)
                            ?.id || "",
                    contactPerson: action.payload.contactPerson,
                    deprecationWarnings: action.payload.deprecationWarnings,
                    screenshotFilename: action.payload.screenshotFilename,
                    feedbackUrl: action.payload.feedbackUrl,
                },
            ],
        };
    } else if (action.type === StoreActions.UnregisterPlugin) {
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
    } else if (action.type === StoreActions.SetActiveView) {
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
    } else if (action.type === StoreActions.SetActivePlugin) {
        return { ...state, activePluginId: action.payload.pluginId };
    } else if (action.type === StoreActions.SetMenuPosition) {
        let position = DrawerPosition.Left;
        if (action.payload.pinned) {
            position = (action.payload
                .menuDrawerPosition as string) as DrawerPosition;
        } else {
            if (
                action.payload.menuBarPosition === MenuBarPosition.Top ||
                action.payload.menuBarPosition === MenuBarPosition.Bottom
            ) {
                position = (action.payload
                    .menuDrawerPosition as string) as DrawerPosition;
            } else {
                position = (action.payload
                    .menuBarPosition as string) as DrawerPosition;
            }
        }
        return {
            ...state,
            position: position,
            bodyMargins: action.payload.bodyMargins,
        };
    } else if (action.type === StoreActions.SetActivePluginWrapperRef) {
        return {
            ...state,
            activePluginWrapperRef: action.payload.ref,
        };
    } else if (action.type === StoreActions.SetPluginDownloadRequested) {
        return { ...state, pluginDownloadRequested: action.payload.request };
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
};

type WebvizContentManagerProps = {
    id: string;
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

    React.useEffect(() => {
        if (props.setProps) {
            props.setProps({
                activeViewId:
                    state.pluginsData.find(
                        (plugin) => plugin.id === state.activePluginId
                    )?.activeViewId || "",
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
    children: PropTypes.node,
    setProps: PropTypes.func,
};
