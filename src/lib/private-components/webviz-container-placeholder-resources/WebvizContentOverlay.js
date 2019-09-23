import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";

export default class WebvizContentOverlay extends Component {
    render() {
        return (
            <div
                id={this.props.id}
                className="webviz-container-content-overlay"
                style={{ display: this.props.showOverlay ? "flex" : "none" }}
            >
                <div className="webviz-container-data-owner">
                    {"name" in this.props.contactPerson && (
                        <p>
                            <FontAwesomeIcon
                                icon={faUser}
                                style={{ marginRight: "5px" }}
                            />
                            {this.props.contactPerson.name}
                        </p>
                    )}
                    {"email" in this.props.contactPerson && (
                        <p>
                            <FontAwesomeIcon
                                icon={faEnvelope}
                                style={{ marginRight: "5px" }}
                            />
                            <a href="mailto:{this.props.contactPerson.email}">
                                {this.props.contactPerson.email}
                            </a>
                        </p>
                    )}
                    {"phone" in this.props.contactPerson && (
                        <p>
                            <FontAwesomeIcon
                                icon={faPhone}
                                style={{ marginRight: "5px" }}
                            />
                            {this.props.contactPerson.phone}
                        </p>
                    )}
                </div>
            </div>
        );
    }
}

WebvizContentOverlay.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string,

    /**
     * If the overlay should be visible or not.
     */
    showOverlay: PropTypes.bool,

    /**
     * A dictionary of information regarding contact person for the data content.
     * Valid keys are 'name', 'email' and 'phone'.
     */
    contactPerson: PropTypes.objectOf(PropTypes.string),
};
