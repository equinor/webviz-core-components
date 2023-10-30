/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import PropTypes from "prop-types";


const propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string.isRequired,
    eventName: PropTypes.string.isRequired,
    value: PropTypes.string,
    /**
     * Dash-assigned callback that gets fired when the input changes
     */
    setProps: PropTypes.func,
};

/**
 * WebvizEmbedDash is a component for enabling publish-subscription state sharing
 * between a React application where the Dash application is embedded.
 * 
 * It will listen on dispatched events with name eventName, and store the event detail
 * in a prop called "value", which can be accessed as normally by other Dash components.
 */
export const WebvizEmbedDash = ({eventName, setProps}) => {

    const onEvent = (event) => {
        setProps({value: JSON.stringify(event.detail)})
    };

    React.useEffect(() => {
        window.addEventListener(eventName, onEvent);

        return () => {
            window.removeEventListener(eventName, onEvent)
        }
    }, []);

    return <></>;
};

WebvizEmbedDash.propTypes = propTypes;
