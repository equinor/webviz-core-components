import React from "react";
import PropTypes from "prop-types";

import {
    useStore,
    StoreActions,
} from "../WebvizContentManager/WebvizContentManager";

import downloadFile from "../../utils/downloadFile";

import {
    DownloadData,
    DownloadDataPropTypes,
} from "../../shared-types/webviz-content/download-data";

export type ParentProps = {
    data_requested: number | null;
};

export type WebvizViewProps = {
    id: string;
    showDownload: boolean;
    download?: DownloadData;
    setProps?: (props: ParentProps) => void;
    children?: React.ReactNode;
};

export const WebvizView: React.FC<WebvizViewProps> = (props) => {
    const [downloadRequests, setDownloadRequested] = React.useState<number>(0);

    const store = useStore();

    React.useEffect(() => {
        if (props.download !== null && props.download !== undefined) {
            downloadFile({
                filename: props.download.filename,
                data: props.download.content,
                mimeType: props.download.mime_type,
            });
            if (props.setProps) {
                props.setProps({ data_requested: null });
            }
        }
    }, [props.download]);

    React.useEffect(() => {
        if (!store.state.pluginDownloadRequested) {
            return;
        }
        const requests = downloadRequests + 1;
        setDownloadRequested(requests);
        if (props.setProps) {
            props.setProps({ data_requested: requests });
        }

        store.dispatch({
            type: StoreActions.SetPluginDownloadRequested,
            payload: { request: false },
        });
    }, [store.state.pluginDownloadRequested]);

    return <div id={props.id}>{props.children}</div>;
};

WebvizView.propTypes = {
    id: PropTypes.string.isRequired,
    showDownload: PropTypes.bool.isRequired,
    children: PropTypes.node,
    download: PropTypes.shape(DownloadDataPropTypes),
    setProps: PropTypes.func,
};
