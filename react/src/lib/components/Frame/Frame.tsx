/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import PropTypes, { InferProps } from "prop-types";

import { getPropsWithMissingValuesSetToDefault, Optionals } from "../../utils/DefaultPropsHelpers";
import "./Frame.css";
import { ThemeContext } from "../.."
const propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string.isRequired,
    /**
     * children
     */
    children: PropTypes.node,

    className: PropTypes.string,
    /**
     * Appends styles to the Frame tag
     */
    style: PropTypes.object,
    /**
     * Dash-assigned callback that gets fired when the input changes
     */
    setProps: PropTypes.func,
};

const defaultProps: Optionals<InferProps<typeof propTypes>> = {

    style: {},
    children: [],
    className: "",
    setProps: (): void => { return; }
};

/**
* Frame is a dash wrapper for the html Frame tag.
*/
const Frame: React.FC<InferProps<typeof propTypes>> = (props: InferProps<typeof propTypes>): JSX.Element => {
    const {
        id,
        className,
        style,
        children
    } = getPropsWithMissingValuesSetToDefault(props, defaultProps);

    const { themeName } = React.useContext(ThemeContext)
    return (
        <div
            id={id}
            className={themeName === "presentation" ? className : "webviz-config-frame " + className}
            style={style}
        >
            {children}
        </div >
    );
}

export default Frame;

Frame.defaultProps = defaultProps;

Frame.propTypes = propTypes;
