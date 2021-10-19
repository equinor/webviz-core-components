import React from "react";
import PropTypes from "prop-types";
import * as edsIcons from "@equinor/eds-icons";
import { IconData } from "@equinor/eds-icons";
import { Icon as EdsIcon } from "@equinor/eds-core-react";
import { Tooltip } from "@material-ui/core";

type IconProps = {
    icon: string;
    active?: boolean;
    className?: string;
};

export const Icon: React.FC<IconProps> = (props) => {
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
                    `https://eds.equinor.com/assets/system-icons/library/.`
                }
            >
                <EdsIcon
                    data={edsIcons.report}
                    color="hsla(0, 100%, 50%, 1)"
                    className={(props.className || "") + " Menu__IconNotFound"}
                />
            </Tooltip>
        );
    }

    return (
        <EdsIcon
            data={icon}
            color={props.active ? "#FF1243" : "#989898"}
            className={props.className || ""}
        />
    );
};

Icon.propTypes = {
    icon: PropTypes.string.isRequired,
    active: PropTypes.bool,
    className: PropTypes.string,
};
