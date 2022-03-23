import React from "react";
import PropTypes from "prop-types";

import { IconButton } from "@material-ui/core";
import { camera, fullscreen_exit } from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";
Icon.add({ camera, fullscreen_exit });

import { useStore } from "../WebvizContentManager/WebvizContentManager";
import { StoreActions } from "../WebvizContentManager/WebvizContentManager";
import downloadFile from "../../utils/downloadFile";
import { View, ViewPropTypes } from "../../shared-types/webviz-content/webviz";
import {
    DownloadData,
    DownloadDataPropTypes,
} from "../../shared-types/webviz-content/download-data";
import {
    ContactPerson,
    ContactPersonPropTypes,
} from "../../shared-types/webviz-content/contact-person";
import {
    DeprecationWarning,
    DeprecationWarningPropTypes,
} from "../../shared-types/webviz-content/deprecation-warning";

import "./webviz-plugin-wrapper.css";

export interface ParentProps {
    data_requested: number | null;
}

export type WebvizPluginWrapperProps = {
    id: string;
    name: string;
    views: View[];
    showDownload: boolean;
    children?: React.ReactNode;
    download?: DownloadData;
    screenshotFilename?: string;
    contactPerson?: ContactPerson;
    deprecationWarnings?: DeprecationWarning[];
    feedbackUrl?: string;
    stretch?: boolean;
    setProps?: (props: ParentProps) => void;
};

export const WebvizPluginWrapper: React.FC<WebvizPluginWrapperProps> = (
    props: WebvizPluginWrapperProps
) => {
    const { download } = props;
    const store = useStore();
    const [active, setActive] = React.useState<boolean>(false);
    const [downloadRequests, setDownloadRequested] = React.useState<number>(0);

    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        store.dispatch({
            type: StoreActions.RegisterPlugin,
            payload: {
                id: props.id,
                name: props.name,
                views: props.views,
                showDownload: props.showDownload,
                contactPerson: props.contactPerson,
                deprecationWarnings: props.deprecationWarnings,
                screenshotFilename: props.screenshotFilename,
                feedbackUrl: props.feedbackUrl,
            },
        });

        return () => {
            store.dispatch({
                type: StoreActions.UnregisterPlugin,
                payload: { id: props.id },
            });
        };
    }, []);

    React.useEffect(() => {
        if (!active) {
            return;
        }
        if (download !== null && download !== undefined) {
            downloadFile({
                filename: download.filename,
                data: download.content,
                mimeType: download.mime_type,
            });
            if (props.setProps) {
                props.setProps({ data_requested: null });
            }
        }
    }, [download]);

    React.useEffect(() => {
        if (!active || !store.state.pluginDownloadRequested) {
            return;
        }
        if (store.state.pluginDownloadRequested) {
            const requests = downloadRequests + 1;
            setDownloadRequested(requests);
            if (props.setProps) {
                props.setProps({ data_requested: requests });
            }

            store.dispatch({
                type: StoreActions.SetPluginDownloadRequested,
                payload: { request: false },
            });
        }
    }, [store.state.pluginDownloadRequested]);

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
            <div className="WebvizPluginWrapper__FullScreenContainer">
                {props.children}
            </div>
        </div>
    );
};

WebvizPluginWrapper.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    views: PropTypes.arrayOf(PropTypes.shape(ViewPropTypes).isRequired)
        .isRequired,
    showDownload: PropTypes.bool.isRequired,
    children: PropTypes.node,
    download: PropTypes.shape(DownloadDataPropTypes),
    screenshotFilename: PropTypes.string,
    contactPerson: PropTypes.shape(ContactPersonPropTypes),
    deprecationWarnings: PropTypes.arrayOf(
        PropTypes.shape(DeprecationWarningPropTypes).isRequired
    ),
    feedbackUrl: PropTypes.string,
    setProps: PropTypes.func,
};
