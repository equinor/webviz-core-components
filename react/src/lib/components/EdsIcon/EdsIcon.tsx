import React from "react";
import PropTypes from "prop-types";
import * as edsIcons from "@equinor/eds-icons";
import { IconData } from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";
import { Tooltip } from "@material-ui/core";

export type EdsIconProps = {
    id?: string;
    icon: string;
    size?: 16 | 24 | 32 | 40 | 48;
    color?: string;
};

export const EdsIcon: React.FC<EdsIconProps> = (props) => {
    let icon: IconData | undefined = undefined;
    if (props.icon) {
        icon = Object.values(edsIcons).find((el) => el.name === props.icon);
    }

    if (!icon) {
        return (
            <Tooltip
                title={
                    `An icon with name "${props.icon}" does not exist.` +
                    ` Please check the icon name for typos. ` +
                    `An overview of all available icons can be found at ` +
                    `https://eds-storybook-react.azurewebsites.net/?path=/story/icons--preview.`
                }
            >
                <Icon
                    id={props.id}
                    data={edsIcons.report}
                    color="hsla(0, 100%, 50%, 1)"
                    className={"IconNotFound"}
                    size={props.size}
                />
            </Tooltip>
        );
    }

    return (
        <Icon id={props.id} data={icon} size={props.size} color={props.color} />
    );
};

EdsIcon.propTypes = {
    id: PropTypes.string,
    icon: PropTypes.string.isRequired,
    size: PropTypes.oneOf([16, 24, 32, 40, 48]),
    color: PropTypes.string,
};
