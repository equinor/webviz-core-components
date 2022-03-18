import PropTypes from "prop-types";

export type DownloadData = {
    filename: string;
    content: string;
    mime_type: string;
};

export const DownloadDataPropTypes = {
    filename: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    mime_type: PropTypes.string.isRequired,
};
