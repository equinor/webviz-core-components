import PropTypes from "prop-types";

export type TourStep = {
    elementId: string;
    viewId: string;
    content: string;
};

export const TourStepPropTypes = {
    elementId: PropTypes.string.isRequired,
    viewId: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
};
