import React from "react";
import PropTypes from "prop-types";

import {
    MenuBarPosition,
    MenuDrawerPosition,
} from "../../../Menu/types/menu-position";

import { DrawerPosition } from "../../shared-types/drawer-position";
import { Margins } from "../../../../shared-types/margins";

type ActionMap<
    M extends {
        [index: string]: {
            [key: string]: string | Margins | number | null | boolean;
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
}

export type StoreState = {
    activePluginId: string;
    activeViewId: string;
    bodyMargins: Margins;
    position: DrawerPosition;
    pluginsData: string[];
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
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];
const initialState: StoreState = {
    activePluginId: "",
    activeViewId: "",
    bodyMargins: { left: 0, right: 0, top: 0, bottom: 0 },
    position: DrawerPosition.Left,
    pluginsData: [],
};

export const StoreReducer = (
    state: StoreState,
    action: Actions
): StoreState => {
    if (action.type === StoreActions.SetActiveView) {
        return { ...state, activeViewId: action.payload.viewId };
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
    }
    return state;
};

type StoreContext = {
    state: StoreState;
    dispatch: React.Dispatch<Actions>;
};

const storeContext = React.createContext<StoreContext | undefined>(undefined);

type ContentManagerProps = {
    children: React.ReactNode;
};

export const ContentManager: React.FC<ContentManagerProps> = (props) => {
    const [state, dispatch] = React.useReducer(StoreReducer, initialState);

    return (
        <storeContext.Provider value={{ state, dispatch }}>
            {props.children}
        </storeContext.Provider>
    );
};

ContentManager.propTypes = {
    children: PropTypes.node,
};

export const useStore = (): StoreContext =>
    React.useContext<StoreContext>(storeContext as React.Context<StoreContext>);
