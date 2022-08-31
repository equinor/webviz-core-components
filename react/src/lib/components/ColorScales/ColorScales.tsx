// Adapted from https://github.com/plotly/dash-colorscales

import React from "react";
import PropTypes, { InferProps } from "prop-types";
import { ColorLegend } from "@emerson-eps/color-tables";

// Use "Viridis" as the default scale
export const DEFAULT_SCALE = [
    "#fafa6e",
    "#9cdf7c",
    "#4abd8c",
    "#00968e",
    "#106e7c",
    "#2a4858",
];

const propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string.isRequired,

    /**
     * Optional: Initial colorscale to display. Default is Viridis.
     */
    colorscale: PropTypes.arrayOf(PropTypes.string.isRequired),

    /**
     * Optional: Initial number of colors in scale to display.
     */
    nSwatches: PropTypes.number,

    /**
     * Optional: Set to `True` to fix the number of colors in the scale.
     */
    fixSwatches: PropTypes.bool,

    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change
     */
    setProps: PropTypes.func,
};

export type ColorScalesProps = InferProps<typeof propTypes>;

/**
 * ColorScales is a Dash wrapper for `react-colorscales`.
 * It takes an array of colors, `colorscale`, and
 * displays a UI for modifying it or choosing a new scale.
 */
export const ColorScales: React.FC<InferProps<typeof propTypes>> = (
    props: InferProps<typeof propTypes>
): JSX.Element => {
    return (
        <div id={props.id}>
            <ColorLegend
                colorName="Physics"
                colorTables={[
                    {
                        colors: [
                            [0, 255, 0, 0],
                            [0.25, 255, 255, 0],
                            [0.5, 0, 255, 0],
                            [0.75, 0, 255, 255],
                            [1, 0, 0, 255],
                        ],
                        discrete: false,
                        name: "Physics",
                    },
                    {
                        colors: [
                            [0, 255, 0, 0],
                            [0.2, 255, 255, 0],
                            [0.4, 0, 255, 0],
                            [0.6, 0, 255, 255],
                            [0.8, 0, 0, 255],
                            [1, 255, 0, 255],
                        ],
                        discrete: false,
                        name: "Rainbow",
                    },
                    {
                        colors: [
                            [0, 255, 246, 117],
                            [0.11, 255, 243, 53],
                            [0.18, 255, 241, 0],
                            [0.25, 155, 193, 0],
                            [0.32, 255, 155, 23],
                            [0.39, 255, 162, 61],
                            [0.46, 255, 126, 45],
                            [0.53, 227, 112, 24],
                            [0.6, 246, 96, 31],
                            [0.67, 229, 39, 48],
                            [0.74, 252, 177, 170],
                            [0.81, 236, 103, 146],
                            [0.88, 226, 44, 118],
                            [1, 126, 40, 111],
                        ],
                        discrete: false,
                        name: "Porosity",
                    },
                    {
                        colors: [
                            [0, 119, 63, 49],
                            [0.148, 135, 49, 45],
                            [0.246, 154, 89, 24],
                            [0.344, 191, 88, 22],
                            [0.441, 190, 142, 97],
                            [0.539, 255, 126, 45],
                            [0.637, 255, 162, 61],
                            [0.734, 255, 155, 23],
                            [0.832, 255, 241, 0],
                            [1, 255, 246, 117],
                        ],
                        discrete: false,
                        name: "Permeability",
                    },
                    {
                        colors: [
                            [0, 0, 0, 255],
                            [0.5, 255, 255, 255],
                            [1, 255, 2, 2],
                        ],
                        discrete: false,
                        name: "Seismic",
                    },
                    {
                        colors: [
                            [0, 252, 174, 169],
                            [0.1, 226, 44, 118],
                            [0.168, 229, 39, 48],
                            [0.234, 150, 40, 34],
                            [0.301, 255, 126, 45],
                            [0.367, 255, 162, 61],
                            [0.434, 255, 241, 0],
                            [0.5, 219, 228, 163],
                            [0.566, 0, 143, 74],
                            [0.633, 0, 110, 78],
                            [0.699, 0, 124, 140],
                            [0.766, 116, 190, 230],
                            [0.832, 0, 143, 212],
                            [0.898, 0, 51, 116],
                            [1, 74, 19, 86],
                        ],
                        discrete: false,
                        name: "Time/Depth",
                    },
                    {
                        colors: [
                            [0, 255, 120, 61],
                            [1, 255, 193, 0],
                            [2, 255, 155, 76],
                            [3, 255, 223, 161],
                            [4, 226, 44, 118],
                            [5, 255, 243, 53],
                            [6, 255, 212, 179],
                            [7, 255, 155, 23],
                            [8, 255, 246, 117],
                            [9, 255, 241, 0],
                            [10, 255, 211, 178],
                            [11, 255, 173, 128],
                            [12, 248, 152, 0],
                            [13, 154, 89, 24],
                            [14, 0, 138, 185],
                            [15, 82, 161, 40],
                            [16, 219, 228, 163],
                            [17, 0, 119, 64],
                            [18, 0, 110, 172],
                            [19, 116, 190, 230],
                            [20, 0, 155, 212],
                            [21, 0, 117, 190],
                            [22, 143, 40, 112],
                            [23, 220, 153, 190],
                            [24, 226, 44, 118],
                            [25, 126, 40, 111],
                            [26, 73, 69, 43],
                            [27, 203, 63, 42],
                            [28, 255, 198, 190],
                            [29, 135, 49, 45],
                            [30, 150, 136, 120],
                            [31, 198, 182, 175],
                            [32, 166, 154, 145],
                            [33, 191, 88, 22],
                            [34, 255, 212, 179],
                            [35, 251, 139, 105],
                            [36, 154, 89, 24],
                            [37, 186, 222, 200],
                            [38, 0, 124, 140],
                            [39, 87, 84, 83],
                        ],
                        discrete: true,
                        name: "Stratigraphy",
                    },
                    {
                        colors: [
                            [0, 255, 193, 0],
                            [1, 255, 246, 117],
                            [2, 166, 194, 42],
                            [3, 149, 160, 24],
                            [4, 9, 143, 74],
                            [5, 125, 98, 15],
                            [6, 0, 108, 154],
                            [7, 0, 117, 190],
                            [8, 28, 22, 59],
                            [9, 39, 142, 199],
                            [10, 0, 138, 185],
                            [11, 52, 178, 188],
                            [12, 235, 63, 34],
                            [13, 74, 19, 86],
                            [14, 248, 152, 0],
                            [15, 1, 1, 1],
                            [16, 128, 128, 128],
                        ],
                        discrete: true,
                        name: "Facies",
                    },
                    {
                        colors: [
                            [0, 255, 46, 0],
                            [1, 0, 184, 0],
                            [2, 0, 25, 255],
                            [3, 179, 179, 179],
                        ],
                        discrete: true,
                        name: "GasOilWater",
                    },
                    {
                        colors: [
                            [0, 255, 46, 0],
                            [1, 0, 25, 255],
                            [2, 179, 179, 179],
                        ],
                        discrete: true,
                        name: "GasWater",
                    },
                    {
                        colors: [
                            [0, 0, 184, 0],
                            [1, 0, 25, 255],
                            [2, 179, 179, 179],
                        ],
                        discrete: true,
                        name: "OilWater",
                    },
                    {
                        colors: [
                            [0, 127, 201, 127],
                            [1, 190, 174, 212],
                            [2, 253, 192, 134],
                            [4, 255, 255, 153],
                            [5, 56, 108, 176],
                            [6, 240, 2, 127],
                            [7, 191, 91, 23],
                            [8, 102, 102, 102],
                        ],
                        discrete: true,
                        name: "Accent",
                    },
                ]}
                dataObjectName="Legend"
                discreteData={{ objects: { BELOW: [[], 14] } }}
                horizontal
                max={0.35}
                min={0}
                position={[5, 10]}
            />
        </div>
    );
};

ColorScales.propTypes = propTypes;
