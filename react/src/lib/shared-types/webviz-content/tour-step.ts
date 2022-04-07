import PropTypes from "prop-types";

export type TourStep = {
    elementId: string;
    viewId: string;
    settingsGroupId?: string | null;
    viewElementId?: string | null;
    content: string;
};

export const TourStepPropTypes = {
    elementId: PropTypes.string.isRequired,
    viewId: PropTypes.string.isRequired,
    settingsGroupId: PropTypes.string,
    viewElementId: PropTypes.string,
    content: PropTypes.string.isRequired,
};
