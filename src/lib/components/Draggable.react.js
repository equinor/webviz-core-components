import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDraggable from "react-draggable";

export default class Draggable extends Component {
    render() {
        return (
            <div id={this.props.id}>
                <ReactDraggable
                    axis={this.props.axis}
                    handle={this.props.handle}
                    defaultPosition={this.props.defaultPosition}
                    position={this.props.position}
                    grid={this.props.grid}
                    disabled={this.props.disabled}
                >
                    <div>{this.props.children}</div>
                </ReactDraggable>
            </div>
        );
    }
}
Draggable.defaultProps = {
    defaultPosition: { x: 0, y: 0 },
    position: null,
    axis: "both",
    grid: null,
    handle: null,
    disabled: false,
    children: "<div />",
};
Draggable.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string,

    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change
     */
    setProps: PropTypes.func,

    /**
     * ...
     */
    axis: PropTypes.string,

    /**
     * ...
     */
    handle: PropTypes.string,

    /**
     * ...
     */
    defaultPosition: PropTypes.object,

    /**
     * ...
     */
    position: PropTypes.object,

    /**
     * ...
     */
    grid: PropTypes.array,

    /**
     * ...
     */
    children: PropTypes.node,

    /**
     * ...
     */
    disabled: PropTypes.bool,
};
