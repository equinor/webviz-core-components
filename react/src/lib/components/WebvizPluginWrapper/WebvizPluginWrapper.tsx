import React from "react";
import PropTypes from "prop-types";

import { camera, fullscreen_exit } from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";
Icon.add({ camera, fullscreen_exit });

import {
    useStore,
    StoreActions,
} from "../WebvizContentManager/WebvizContentManager";
import { View, ViewPropTypes } from "../../shared-types/webviz-content/webviz";
import {
    ContactPerson,
    ContactPersonPropTypes,
} from "../../shared-types/webviz-content/contact-person";
import {
    DeprecationWarning,
    DeprecationWarningPropTypes,
} from "../../shared-types/webviz-content/deprecation-warning";

import "./webviz-plugin-wrapper.css";
import {
    TourStep,
    TourStepPropTypes,
} from "../../shared-types/webviz-content/tour-step";
import { WebvizView } from "../WebvizView";

export type WebvizPluginWrapperProps = {
    id: string;
    name: string;
    views: View[];
    children?: React.ReactNode;
    screenshotFilename?: string;
    contactPerson?: ContactPerson;
    deprecationWarnings?: DeprecationWarning[];
    feedbackUrl?: string;
    stretch?: boolean;
    tourSteps?: TourStep[];
    persistence?: boolean | string | number;
    persisted_props?: string[];
    persistence_type?: "local" | "session" | "memory";
};

export const WebvizPluginWrapper: React.FC<WebvizPluginWrapperProps> = (
    props: WebvizPluginWrapperProps
) => {
    const store = useStore();
    const [active, setActive] = React.useState<boolean>(false);

    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        store.dispatch({
            type: StoreActions.RegisterPlugin,
            payload: {
                id: props.id,
                name: props.name,
                views: props.views,
                contactPerson: props.contactPerson,
                deprecationWarnings: props.deprecationWarnings,
                screenshotFilename: props.screenshotFilename,
                feedbackUrl: props.feedbackUrl,
                tourSteps: props.tourSteps,
            },
        });

        return () => {
            store.dispatch({
                type: StoreActions.UnregisterPlugin,
                payload: { id: props.id },
            });
        };
    }, []);

    React.useLayoutEffect(() => {
        const isActive = store.state.activePluginId === props.id;
        setActive(isActive);
        if (isActive) {
            store.dispatch({
                type: StoreActions.SetActivePluginWrapperRef,
                payload: { ref: wrapperRef },
            });
        }
    }, [store.state.activePluginId, props.id]);

    const handlePluginClick = React.useCallback(() => {
        store.dispatch({
            type: StoreActions.SetActivePlugin,
            payload: { pluginId: props.id },
        });
    }, [props.id]);

    const pluginData = store.state.pluginsData.find((el) => el.id === props.id);

    return (
        <div
            id={props.id}
            ref={wrapperRef}
            className={`WebvizPluginWrapper${
                active ? " WebvizPluginWrapper__Active" : ""
            }`}
            onClick={() => handlePluginClick()}
            style={{ flexGrow: props.stretch ? 4 : 0 }}
        >
            <WebvizView
                id={pluginData?.activeViewId || ""}
                showDownload={
                    pluginData?.views.find(
                        (view) => view.id === pluginData.activeViewId
                    )?.showDownload || false
                }
            >
                <div className="WebvizPluginWrapper__FullScreenContainer">
                    {props.children}
                </div>
            </WebvizView>
        </div>
    );
};

WebvizPluginWrapper.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    views: PropTypes.arrayOf(PropTypes.shape(ViewPropTypes).isRequired)
        .isRequired,
    children: PropTypes.node,
    screenshotFilename: PropTypes.string,
    contactPerson: PropTypes.shape(ContactPersonPropTypes),
    deprecationWarnings: PropTypes.arrayOf(
        PropTypes.shape(DeprecationWarningPropTypes).isRequired
    ),
    stretch: PropTypes.bool,
    feedbackUrl: PropTypes.string,
    tourSteps: PropTypes.arrayOf(PropTypes.shape(TourStepPropTypes).isRequired),
    /**
     * Used to allow user interactions in this component to be persisted when
     * the component - or the page - is refreshed. If `persisted` is truthy and
     * hasn't changed from its previous value, a `value` that the user has
     * changed while using the app will keep that change, as long as
     * the new `value` also matches what was given originally.
     * Used in conjunction with `persistence_type`.
     */
    persistence: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.string,
        PropTypes.number,
    ]),

    /**
     * Properties whose user interactions will persist after refreshing the
     * component or the page.
     */
    persisted_props: PropTypes.arrayOf(
        PropTypes.oneOf(["children"]).isRequired
    ),

    /**
     * Where persisted user changes will be stored:
     * memory: only kept in memory, reset on page refresh.
     * local: window.localStorage, data is kept after the browser quit.
     * session: window.sessionStorage, data is cleared once the browser quit.
     */
    persistence_type: PropTypes.oneOf(["local", "session", "memory"]),
};
