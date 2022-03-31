import PropTypes from "prop-types";

export type TourStep = {
    elementId: string;
    viewId: string;
    isSettingsGroup: boolean;
    isViewElementSetting: boolean;
    content: string;
};

export const TourStepPropTypes = {
    elementId: PropTypes.string.isRequired,
    viewId: PropTypes.string.isRequired,
    isSettingsGroup: PropTypes.bool.isRequired,
    isViewElementSetting: PropTypes.bool.isRequired,
    content: PropTypes.string.isRequired,
};
