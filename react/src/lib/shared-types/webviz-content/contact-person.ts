import PropTypes from "prop-types";

export type ContactPerson = {
    name: string;
    email: string;
    phone: string;
};

export const ContactPersonPropTypes = {
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
};
