import PropTypes from "prop-types";

export type ViewElement = {
    id: string;
    layout: React.ReactNode;
    settings?: React.ReactNode;
};

export const ViewElementPropTypes = {
    id: PropTypes.string.isRequired,
    layout: PropTypes.node.isRequired,
    settings: PropTypes.node,
};

export type SettingsGroup = {
    id: string;
    title: string;
    content: React.ReactNode;
};

export const SettingsGroupPropTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.node.isRequired,
};

export type View = {
    id: string;
    name: string;
    settings?: SettingsGroup[] | null;
    elements: ViewElement[];
};

export const ViewPropTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    settings: PropTypes.arrayOf(
        PropTypes.shape(SettingsGroupPropTypes).isRequired
    ),
    elements: PropTypes.arrayOf(
        PropTypes.shape(ViewElementPropTypes).isRequired
    ).isRequired,
};

export type Plugin = {
    id: string;
    name: string;
    views: View[];
    sharedSettings?: SettingsGroup[] | null;
    activeViewId: string;
};

export const PluginPropTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    views: PropTypes.arrayOf(PropTypes.shape(ViewPropTypes).isRequired)
        .isRequired,
    sharedSettings: PropTypes.arrayOf(
        PropTypes.shape(SettingsGroupPropTypes).isRequired
    ),
    activeViewId: PropTypes.string.isRequired,
};
