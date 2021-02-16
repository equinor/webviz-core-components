import React, { ChangeEvent } from "react";
import PropTypes from "prop-types";
import "./Select.css";

type SelectType = {
    id: string,
    size?: number,
    options?: Array<{
        label: number | string,
        value: number | string
    }>,
    value?: number | string | Array<string>,
    multi?: boolean,
    className?: string,
    style?: object,
    parentClassName?: string,
    parentStyle?: object,
    setProps: (props: object) => void,
    persistence?: boolean | string | number,
    persistedProps?: Array<string>,
    persistenceType?: "local" | "session" | "memory"
};
/**
 * Select is a dash wrapper for the html select tag.
 */
const Select: React.FC<SelectType> = ({ id, size, options, value, multi, className, style, parentClassName, parentStyle, setProps, persistence, persistedProps, persistenceType }) => {
    const handleChange = (e: ChangeEvent) => {
        const options = (e.target as HTMLSelectElement).selectedOptions;
        let values: Array<string | number> = [];
        for (let i = 0; i < options.length; i++) {
            values.push(options[i].value);
        }
        setProps({ value: values });
    }

    return (
        <div
            id={id}
            className={parentClassName}
            style={parentStyle}
        >
            <select
                defaultValue={value}
                multiple={multi}
                size={size}
                onChange={handleChange}
                className={"webviz-config-select " + className}
                style={style}
            >
                {options !== undefined && options.map((opt, idx) => {
                    return (
                        <option key={idx.toString() + opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    );
                })}
            </select>
        </div>
    );
}

export default Select;

Select.defaultProps = {
    options: [],
    size: 4,
    value: [],
    multi: true,
    className: "",
    parentClassName: "",
    persistedProps: ["value"],
    persistenceType: "local",
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
            label: PropTypes.oneOfType([PropTypes.string.isRequired, PropTypes.number.isRequired]).isRequired,

            /**
             * The value of the dropdown. This value
             * corresponds to the items specified in the
             * `value` property.
             */
            value: PropTypes.oneOfType([PropTypes.string.isRequired, PropTypes.number.isRequired]).isRequired,
        }).isRequired
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
        PropTypes.string.isRequired,
        PropTypes.number.isRequired,
        PropTypes.arrayOf(
            PropTypes.string.isRequired
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
    parentClassName: PropTypes.string,
    /**
     * Appends inline styles to the wrapping div
     */
    parentStyle: PropTypes.object,
    /**
     * Dash-assigned callback that gets fired when the input changes
     */
    setProps: PropTypes.func.isRequired,
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
    persistedProps: PropTypes.arrayOf(PropTypes.oneOf(["value"]).isRequired),

    /**
     * Where persisted user changes will be stored:
     * memory: only kept in memory, reset on page refresh.
     * local: window.localStorage, data is kept after the browser quit.
     * session: window.sessionStorage, data is cleared once the browser quit.
     */
    persistenceType: PropTypes.oneOf(["local", "session", "memory"]),
};
