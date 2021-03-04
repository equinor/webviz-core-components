import React, { MouseEvent } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

type WebvizToolbarButtonProps = {
    icon: IconProp;
    selected?: boolean;
    onClick?: (event: MouseEvent) => void;
    tooltip?: string;
};

const WebvizToolbarButton: React.FC<WebvizToolbarButtonProps> = ({ icon, selected, onClick, tooltip }) => {
    return (
        <div className="webviz-config-tooltip-wrapper">
            <FontAwesomeIcon
                icon={icon}
                className={
                    "webviz-config-plugin-button" +
                    (selected
                        ? " webviz-config-plugin-button-selected"
                        : "")
                }
                onClick={onClick}
            />
            <div className="webviz-config-tooltip">
                {tooltip}
            </div>
        </div>
    );
}

export default WebvizToolbarButton;

WebvizToolbarButton.propTypes = {
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
    icon: PropTypes.any.isRequired,

    /**
     * The callback function to triger when button is clicked.
     */
    onClick: PropTypes.func,
};
