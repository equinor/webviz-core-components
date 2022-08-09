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

import "./webviz-view.css";

export type ParentProps = {
    data_requested: number | null;
};

export type WebvizViewProps = {
    id: string;
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
    }, [props.download, props.setProps]);

    React.useEffect(() => {
        store.dispatch({
            type: StoreActions.SetActiveViewDownloadCallback,
            payload: {
                callback: () => {
                    const requests = downloadRequests + 1;
                    setDownloadRequested(requests);
                    if (props.setProps) {
                        props.setProps({ data_requested: requests });
                    }
                },
            },
        });
    }, [props.setProps, downloadRequests]);

    return (
        <div id={props.id} className="WebvizView">
            {props.children}
        </div>
    );
};

WebvizView.propTypes = {
    id: PropTypes.string.isRequired,
    children: PropTypes.node,
    download: PropTypes.shape(DownloadDataPropTypes),
    setProps: PropTypes.func,
};
