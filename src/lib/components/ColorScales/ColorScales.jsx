// Adapted from https://github.com/plotly/dash-colorscales

import React, { useState } from "react";
import PropTypes from "prop-types";

import ColorscalePicker, { Colorscale } from "react-colorscales";

// Use "Viridis" as the default scale
const DEFAULT_SCALE = [
    "#fafa6e",
    "#9cdf7c",
    "#4abd8c",
    "#00968e",
    "#106e7c",
    "#2a4858",
];

/**
 * ColorScales is a Dash wrapper for `react-colorscales`.
 * It takes an array of colors, `colorscale`, and
 * displays a UI for modifying it or choosing a new scale.
 */
const ColorScales = ({ id, setProps, initial_color_scale, num_swatches, fix_swatches }) => {
    const [showColorScalePicker, setShowColorScalePicker] = useState(false);
    const [colorScale, setColorScale] = useState(initial_color_scale || DEFAULT_SCALE);

    return (
        <div id={id}>
            <div
                onClick={() =>
                    setShowColorScalePicker(!showColorScalePicker)
                }
            >
                <Colorscale
                    colorscale={colorScale}
                    onClick={() => { }}
                    width={150}
                />
            </div>
            {showColorScalePicker && (
                <ColorscalePicker
                    colorscale={colorScale || DEFAULT_SCALE}
                    nSwatches={num_swatches || DEFAULT_SCALE.length}
                    fixSwatches={fix_swatches}
                    onChange={newColorScale => {
                        /*
                         * Send the new value to the parent component.
                         * In a Dash app, this will send the data back to the
                         * Python Dash app server.
                         */
                        if (setProps) {
                            setProps({
                                colorscale: newColorScale,
                            });
                        }
                        setColorScale(newColorScale);
                    }}
                />
            )}
        </div>
    );
};

export default ColorScales;

ColorScales.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string.isRequired,

    /**
     * Optional: Initial colorscale to display. Default is Viridis.
     */
    initial_color_scale: PropTypes.array,

    /**
     * Optional: Initial number of colors in scale to display.
     */
    num_swatches: PropTypes.number,

    /**
     * Optional: Set to `True` to fix the number of colors in the scale.
     */
    fix_swatches: PropTypes.bool,

    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change
     */
    setProps: PropTypes.func,
};
