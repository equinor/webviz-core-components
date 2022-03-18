import PropTypes from "prop-types";

export type DeprecationWarning = {
    message: string;
    url: string;
};

export const DeprecationWarningPropTypes = {
    message: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
};
