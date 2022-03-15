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
                | Plugin[];
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
    [StoreActions.SetPlugins]: {
        plugins: Plugin[];
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];
/*
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
*/

const setInitialState = (plugins: Plugin[]): StoreState => {
    const activePluginId = plugins.length > 0 ? plugins[0]["id"] : "";
    return {
        activePluginId: activePluginId,
        pluginsData: plugins,
        bodyMargins: { left: 0, right: 0, top: 0, bottom: 0 },
        position: DrawerPosition.Left,
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
        console.log(JSON.stringify(state));
    }, [state]);

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
