import React, { Component } from "react";
import PropTypes from "prop-types";
import "./Select.css";
/**
 * Select is a dash wrapper for the html select tag.
 */
export default class Select extends Component {
    handleChange(e) {
        const options = e.target.selectedOptions;
        const values = [];
        for (let i = 0; i < options.length; i++) {
            values.push(options[i].value);
        }
        this.props.setProps({ value: values });
    }
    render() {
        return (
            <div
                id={this.props.id}
                className={this.props.parent_className}
                style={this.props.parent_style}
            >
                <select
                    defaultValue={this.props.value}
                    multiple={this.props.multi}
                    size={this.props.size}
                    onChange={this.handleChange.bind(this)}
                    className={"webviz-config-select " + this.props.className}
                    style={this.props.style}
                >
                    {this.props.options.map((opt, idx) => {
                        return (
                            <option key={idx + opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    }
}

Select.defaultProps = {
    options: [{}],
    size: 4,
    value: [],
    multi: true,
    className: "",
    parent_className: "",
    persisted_props: ["value"],
    persistence_type: "local",
};

Select.propTypes = {
    /**
     * The ID used to identify this compnent in Dash callbacks
     */
    id: PropTypes.string.isRequired,
    /**
     * The number of visible options
     */
    size: PropTypes.number,
    /**
     * An array of options {label: [string|number], value: [string|number]},
     * an optional disabled field can be used for each option
     */
    options: PropTypes.arrayOf(
        PropTypes.exact({
            /**
             * The dropdown's label
             */
            label: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
                .isRequired,

            /**
             * The value of the dropdown. This value
             * corresponds to the items specified in the
             * `value` property.
             */
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
                .isRequired,
        })
    ),
    /**
     * The value of the input. If `multi` is false
     * then value is just a string that corresponds to the values
     * provided in the `options` property. If `multi` is true, then
     * multiple values can be selected at once, and `value` is an
     * array of items with values corresponding to those in the
     * `options` prop.
     */
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(
            PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        ),
    ]),
    /**
     * If true, the user can select multiple values
     */
    multi: PropTypes.bool,
    /**
     * Appends a class to the select tag
     */
    className: PropTypes.string,
    /**
     * Appends styles to the select tag
     */
    style: PropTypes.object,
    /**
     * Appends a class to the wrapping div
     */
    parent_className: PropTypes.string,
    /**
     * Appends inline styles to the wrapping div
     */
    parent_style: PropTypes.object,
    /**
     * Dash-assigned callback that gets fired when the input changes
     */
    setProps: PropTypes.func,
    /**
     * Used to allow user interactions in this component to be persisted when
     * the component - or the page - is refreshed. If `persisted` is truthy and
     * hasn't changed from its previous value, a `value` that the user has
     * changed while using the app will keep that change, as long as
     * the new `value` also matches what was given originally.
     * Used in conjunction with `persistence_type`.
     */
    persistence: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.string,
        PropTypes.number,
    ]),

    /**
     * Properties whose user interactions will persist after refreshing the
     * component or the page. Since only `value` is allowed this prop can
     * normally be ignored.
     */
    persisted_props: PropTypes.arrayOf(PropTypes.oneOf(["value"])),

    /**
     * Where persisted user changes will be stored:
     * memory: only kept in memory, reset on page refresh.
     * local: window.localStorage, data is kept after the browser quit.
     * session: window.sessionStorage, data is cleared once the browser quit.
     */
    persistence_type: PropTypes.oneOf(["local", "session", "memory"]),
};
