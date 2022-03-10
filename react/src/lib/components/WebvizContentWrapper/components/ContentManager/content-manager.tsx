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

export type ViewElement = {
    id: string;
    layout: React.ReactChild;
    settings?: React.ReactChild;
};

export type SettingsGroup = {
    id: string;
    title: string;
    content: React.ReactChild;
};

export type Plugin = {
    id: string;
    name: string;
    views: View[];
    sharedSettings?: SettingsGroup[];
    activeViewId: string;
};

export type View = {
    id: string;
    name: string;
    settings?: SettingsGroup[];
    elements: ViewElement[];
};

export enum StoreActions {
    SetActiveView = "set_active_view",
    SetActivePlugin = "set_active_plugin",
    SetMenuPosition = "set_menu_position",
}

export type StoreState = {
    activePluginId: string;
    bodyMargins: Margins;
    position: DrawerPosition;
    pluginsData: Plugin[];
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
    activePluginId: "1",
    pluginsData: [
        {
            id: "1",
            name: "Example plugin",
            activeViewId: "view1_id",
            views: [
                {
                    name: "View1",
                    id: "view1_id",
                    settings: [
                        {
                            id: "2",
                            title: "Preferences",
                            content: (
                                <select>
                                    <option>First option</option>
                                </select>
                            ),
                        },
                    ],
                    elements: [
                        {
                            id: "plot",
                            layout: (
                                <svg width="400px" height="400px">
                                    <rect
                                        width="100px"
                                        height="100px"
                                        style={{ fill: "green" }}
                                        id="green-rect"
                                    />
                                    <rect
                                        width="100px"
                                        height="100px"
                                        x="200px"
                                        style={{ fill: "blue" }}
                                        id="blue-rect"
                                    />
                                </svg>
                            ),
                        },
                    ],
                },
                {
                    name: "View2",
                    id: "view2_id",
                    elements: [
                        {
                            id: "plot",
                            layout: (
                                <svg width="400px" height="400px">
                                    <rect
                                        width="100px"
                                        height="100px"
                                        style={{ fill: "red" }}
                                        id="red-rect"
                                    />
                                    <rect
                                        width="100px"
                                        height="100px"
                                        x="200px"
                                        style={{ fill: "yellow" }}
                                        id="yellow-rect"
                                    />
                                </svg>
                            ),
                        },
                    ],
                },
            ],
            sharedSettings: [
                {
                    id: "1",
                    title: "Filter",
                    content: <input name="test" />,
                },
            ],
        },
        {
            id: "2",
            name: "Example plugin 2",
            activeViewId: "view1_id",
            views: [
                {
                    name: "View3",
                    id: "view1_id",
                    settings: [
                        {
                            id: "2",
                            title: "Preferences 2",
                            content: (
                                <select>
                                    <option>First option</option>
                                </select>
                            ),
                        },
                    ],
                    elements: [
                        {
                            id: "plot",
                            layout: (
                                <svg width="400px" height="400px">
                                    <rect
                                        width="100px"
                                        height="100px"
                                        style={{ fill: "green" }}
                                        id="green-rect"
                                    />
                                    <rect
                                        width="100px"
                                        height="100px"
                                        x="200px"
                                        style={{ fill: "blue" }}
                                        id="blue-rect"
                                    />
                                </svg>
                            ),
                        },
                        {
                            id: "plot2",
                            layout: (
                                <svg width="400px" height="400px">
                                    <rect
                                        width="100px"
                                        height="100px"
                                        style={{ fill: "green" }}
                                        id="green-rect"
                                    />
                                    <rect
                                        width="100px"
                                        height="100px"
                                        x="200px"
                                        style={{ fill: "blue" }}
                                        id="blue-rect"
                                    />
                                </svg>
                            ),
                        },
                    ],
                },
                {
                    name: "View4",
                    id: "view2_id",
                    elements: [
                        {
                            id: "plot",
                            layout: (
                                <svg width="400px" height="400px">
                                    <rect
                                        width="100px"
                                        height="100px"
                                        style={{ fill: "red" }}
                                        id="red-rect"
                                    />
                                    <rect
                                        width="100px"
                                        height="100px"
                                        x="200px"
                                        style={{ fill: "yellow" }}
                                        id="yellow-rect"
                                    />
                                </svg>
                            ),
                        },
                    ],
                },
            ],
            sharedSettings: [
                {
                    id: "1",
                    title: "Filter 2",
                    content: <input name="test" />,
                },
            ],
        },
        {
            id: "3",
            name: "Example plugin 3",
            activeViewId: "view5_id",
            views: [
                {
                    name: "View5",
                    id: "view5_id",
                    settings: [
                        {
                            id: "3",
                            title: "Preferences 3",
                            content: (
                                <select>
                                    <option>First option</option>
                                </select>
                            ),
                        },
                    ],
                    elements: [
                        {
                            id: "plot",
                            layout: (
                                <svg width="400px" height="400px">
                                    <rect
                                        width="100px"
                                        height="100px"
                                        style={{ fill: "green" }}
                                        id="green-rect"
                                    />
                                    <rect
                                        width="100px"
                                        height="100px"
                                        x="200px"
                                        style={{ fill: "orange" }}
                                        id="orange-rect"
                                    />
                                </svg>
                            ),
                        },
                    ],
                },
            ],
            sharedSettings: [
                {
                    id: "1",
                    title: "Filter 3",
                    content: <input name="test" />,
                },
            ],
        },
    ],
    bodyMargins: { left: 0, right: 0, top: 0, bottom: 0 },
    position: DrawerPosition.Left,
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
