import React from "react";
import PropTypes, { InferProps } from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";

const propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string.isRequired,

    /**
     * If the overlay should be visible or not.
     */
    showOverlay: PropTypes.bool,

    /**
     * A dictionary of information regarding contact person for the data content.
     * Valid keys are 'name', 'email' and 'phone'.
     */
    contactPerson: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
        phone: PropTypes.string,
    }),
};

const WebvizContentOverlay: React.FC<InferProps<typeof propTypes>> = ({
    id,
    showOverlay,
    contactPerson,
}) => {
    return (
        <div
            id={id}
            className="webviz-plugin-content-overlay"
            style={{ display: showOverlay ? "flex" : "none" }}
        >
            <div className="webviz-plugin-data-owner">
                {contactPerson && "name" in contactPerson && (
                    <p>
                        <FontAwesomeIcon
                            icon={faUser}
                            style={{ marginRight: "5px" }}
                        />
                        {contactPerson.name}
                    </p>
                )}
                {contactPerson && "email" in contactPerson && (
                    <p>
                        <FontAwesomeIcon
                            icon={faEnvelope}
                            style={{ marginRight: "5px" }}
                        />
                        <a href="mailto:{this.props.contactPerson.email}">
                            {contactPerson.email}
                        </a>
                    </p>
                )}
                {contactPerson && "phone" in contactPerson && (
                    <p>
                        <FontAwesomeIcon
                            icon={faPhone}
                            style={{ marginRight: "5px" }}
                        />
                        {contactPerson.phone}
                    </p>
                )}
            </div>
        </div>
    );
};

export default WebvizContentOverlay;

WebvizContentOverlay.propTypes = propTypes;
