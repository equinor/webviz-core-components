import React from "react";

export type InputProps = {
    /** Current value of the input */
    value?: string;

    /** Placeholder text for the input */
    placeholder?: string;

    /** Label for the input field */
    label?: string;

    /** Callback when the input value changes */
    onChange?: (newValue: string) => void;

    /** Callback when the input gains focus */
    onFocus?: () => void;

    /** Callback when the input loses focus */
    onBlur?: () => void;

    className?: string;
};

export function Input(props: InputProps) {
    return (
        <input
            type="text"
            value={props.value}
            placeholder={props.placeholder}
            onChange={(e) => props.onChange?.(e.target.value)}
            onFocus={props.onFocus}
            onBlur={props.onBlur}
            style={{
                flexGrow: 1,
                border: "none",
                outline: "none",
                height: "100%",
            }}
        />
    );
}
