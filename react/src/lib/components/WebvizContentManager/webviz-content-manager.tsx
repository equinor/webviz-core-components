import React from "react";

type ActionMap<
    M extends {
        [index: string]: {
            [key: string]: string | number | null | boolean;
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
}

export type StoreState = {
    activePluginId: string;
    activeViewId: string;
    pluginsData: string[];
};

type Payload = {
    [StoreActions.SetActiveView]: {
        viewId: string;
    };
    [StoreActions.SetActivePlugin]: {
        pluginId: string;
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];
const initialState: StoreState = {
    activePluginId: "",
    activeViewId: "",
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
    }
    return state;
};

type StoreContext = {
    state: StoreState;
    dispatch: React.Dispatch<Actions>;
};

const storeContext = React.createContext<StoreContext | undefined>(undefined);

export const WebvizContentManager: React.FC = ({ children }) => {
    const [state, dispatch] = React.useReducer(StoreReducer, initialState);

    return (
        <storeContext.Provider value={{ state, dispatch }}>
            {children}
        </storeContext.Provider>
    );
};

export const useStore = (): StoreContext =>
    React.useContext<StoreContext>(storeContext as React.Context<StoreContext>);
