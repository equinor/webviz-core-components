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
        <div className="Menu__TopMenu">
            <Button
                variant="ghost_icon"
                onClick={props.onPinnedChange}
                title={props.pinned ? "Unpin menu" : "Pin menu"}
            >
                <span
                    className={`Menu__TopMenu__PinButton ${
                        props.pinned
                            ? "Menu__TopMenu__unpin"
                            : "Menu__TopMenu__pin"
                    }`}
                />
            </Button>
        </div>
    );
};

TopMenu.propTypes = {
    pinned: PropTypes.bool.isRequired,
    onPinnedChange: PropTypes.func.isRequired,
};
