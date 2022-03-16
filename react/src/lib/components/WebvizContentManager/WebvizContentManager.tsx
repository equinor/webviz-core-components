import React from "react";
import {
    MenuBarPosition,
    MenuDrawerPosition,
} from "../Menu/types/menu-position";

import { DrawerPosition } from "../../shared-types/webviz-content/drawer-position";
import { Margins } from "../../shared-types/margins";
import {
    Plugin,
    PluginPropTypes,
} from "../../shared-types/webviz-content/webviz";
import PropTypes from "prop-types";

type ActionMap<
    M extends {
        [index: string]: {
            [key: string]:
                | string
                | Margins
                | number
                | null
                | boolean
                | Plugin[]
                | React.RefObject<HTMLDivElement>;
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
    SetActiveView = "set_active_view",
    SetActivePlugin = "set_active_plugin",
    SetMenuPosition = "set_menu_position",
    SetPlugins = "set_plugins",
    SetActivePluginWrapperRef = "set_active_plugin_wrapper_ref",
}

export type StoreState = {
    activePluginId: string;
    bodyMargins: Margins;
    position: DrawerPosition;
    pluginsData: Plugin[];
    activePluginWrapperRef: React.RefObject<HTMLDivElement> | null;
};

type Payload = {
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
    [StoreActions.SetPlugins]: {
        plugins: Plugin[];
    };
    [StoreActions.SetActivePluginWrapperRef]: {
        ref: React.RefObject<HTMLDivElement>;
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];

const setInitialState = (plugins: Plugin[]): StoreState => {
    const activePluginId = plugins.length > 0 ? plugins[0]["id"] : "";
    return {
        activePluginId: activePluginId,
        pluginsData: plugins,
        bodyMargins: { left: 0, right: 0, top: 0, bottom: 0 },
        position: DrawerPosition.Left,
        activePluginWrapperRef: null,
    };
};

export const StoreReducer = (
    state: StoreState,
    action: Actions
): StoreState => {
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
    } else if (action.type === StoreActions.SetActivePlugin) {
        return { ...state, activePluginId: action.payload.pluginId };
    } else if (action.type === StoreActions.SetMenuPosition) {
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
    } else if (action.type === StoreActions.SetPlugins) {
        const activePluginId =
            action.payload.plugins.length > 0
                ? action.payload.plugins[0]["id"]
                : "";
        return {
            ...state,
            activePluginId: activePluginId,
            pluginsData: action.payload.plugins,
        };
    } else if (action.type === StoreActions.SetActivePluginWrapperRef) {
        return {
            ...state,
            activePluginWrapperRef: action.payload.ref,
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
};

type WebvizContentManagerProps = {
    id: string;
    pluginsMetadata: Plugin[];
    children?: React.ReactNode;
    setProps?: (props: WebvizContentManagerParentProps) => void;
    activeViewId?: string;
};

export const WebvizContentManager: React.FC<WebvizContentManagerProps> = (
    props
) => {
    const [state, dispatch] = React.useReducer(
        StoreReducer,
        props.pluginsMetadata,
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

    React.useEffect(() => {
        dispatch({
            type: StoreActions.SetPlugins,
            payload: { plugins: props.pluginsMetadata },
        });
    }, [props.pluginsMetadata]);

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
    pluginsMetadata: PropTypes.arrayOf(
        PropTypes.shape(PluginPropTypes).isRequired
    ).isRequired,
    children: PropTypes.node,
    setProps: PropTypes.func,
    activeViewId: PropTypes.string,
};
