import React, { MouseEvent } from "react";
import PropTypes from "prop-types";
import { IconData } from "@equinor/eds-icons";
import classNames from "classnames";
import { Icon } from "@equinor/eds-core-react";

type WebvizToolbarButtonProps = {
    icon: IconData;
    selected?: boolean;
    onClick?: (event: MouseEvent) => void;
    important?: boolean;
    tooltip?: string;
    href?: string;
    target?: string;
};

const WebvizToolbarButton: React.FC<WebvizToolbarButtonProps> = ({
    icon,
    selected,
    onClick,
    important,
    tooltip,
    href,
    target,
}) => {
    const createIcon = (useOnClick: boolean) => (
        // @ts-expect-error - this is a very weird bug
        <Icon
            data={icon}
            className={classNames({
                "webviz-config-plugin-button": true,
                "webviz-config-plugin-button-selected": selected,
                "webviz-config-plugin-button-important": important,
            })}
            onClick={useOnClick ? onClick : undefined}
        />
    );

    return (
        <div className="webviz-config-tooltip-wrapper">
            {href ? (
                <a href={href} target={target}>
                    {createIcon(false)}
                </a>
            ) : (
                createIcon(true)
            )}
            <div className="webviz-config-tooltip">{tooltip}</div>
        </div>
    );
};

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
     *
     */
    important: PropTypes.bool,

    /**
     * The font awesome icon to show.
     */
    icon: PropTypes.any.isRequired,

    /**
     * The callback function to triger when button is clicked.
     */
    onClick: PropTypes.func,

    /**
     * URL the button shall forward to.
     */
    href: PropTypes.string,

    /**
     * The target the URL defined in `href` is opened in.
     */
    target: PropTypes.string,
};
