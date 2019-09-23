import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default class WebvizToolbarButton extends Component {
    render() {
        return (
            <div className="webviz-config-tooltip-wrapper">
                <FontAwesomeIcon
                    icon={this.props.icon}
                    className={
                        "webviz-config-container-button" +
                        (this.props.selected
                            ? " webviz-config-container-button-selected"
                            : "")
                    }
                    onClick={this.props.onClick}
                />
                <div className="webviz-config-tooltip">
                    {this.props.tooltip}
                </div>
            </div>
        );
    }
}

WebvizToolbarButton.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string,

    /**
     * If the button should append the selected button css class
     */
    selected: PropTypes.bool,

    /**
     * The tooltip string to show on hover.
     */
    tooltip: PropTypes.string,

    /**
     * The font awesome icon to show.
     */
    icon: PropTypes.object,

    /**
     * The callback function to triger when button is clicked.
     */
    onClick: PropTypes.func,
};
