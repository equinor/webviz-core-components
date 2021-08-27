import React from "react";
import PropTypes from "prop-types";
import { Button } from "@equinor/eds-core-react";

import "./TopMenu.css";

type TopMenuProps = {
    pinned: boolean;
    onPinnedChange: () => void;
};

export const TopMenu: React.FC<TopMenuProps> = (props) => {
    return (
        <div className="TopMenu">
            <Button
                variant="ghost_icon"
                onClick={props.onPinnedChange}
                title={props.pinned ? "Unpin menu" : "Pin menu"}
            >
                <span
                    className={`PinButton ${props.pinned ? "unpin" : "pin"}`}
                />
            </Button>
        </div>
    );
};

TopMenu.propTypes = {
    pinned: PropTypes.bool.isRequired,
    onPinnedChange: PropTypes.func.isRequired,
};
