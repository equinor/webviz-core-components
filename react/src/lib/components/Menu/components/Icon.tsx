import React from "react";
import PropTypes from "prop-types";
import * as edsIcons from "@equinor/eds-icons";
import { IconData } from "@equinor/eds-icons";
import { Icon as EdsIcon } from "@equinor/eds-core-react";

type IconProps = {
    icon: string;
    active?: boolean;
    className?: string;
};

export const Icon: React.FC<IconProps> = (props) => {
    let icon: IconData | undefined = undefined;
    if (props.icon) {
        Object.values(edsIcons).forEach((el) => {
            if (el.name === props.icon) {
                icon = el;
            }
        });
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
