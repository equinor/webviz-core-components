import React from "react";
import { SmartNodeSelectorContext } from "../SmartNodeSelector";

export type InputProps = {
    tagId: string;
    segmentIndex: number;

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

export function Input(props: InputProps): React.ReactElement {
    const context = React.useContext(SmartNodeSelectorContext);

    const inputRef = React.useRef<HTMLInputElement>(null);

    const isFocused =
        context.state.focusedAddress?.tagId === props.tagId &&
        context.state.focusedAddress?.segmentIndex === props.segmentIndex;

    React.useEffect(
        function onFocusChange() {
            if (isFocused && document.activeElement !== inputRef.current) {
                inputRef.current?.focus();
            }
        },
        [isFocused]
    );

    return (
        <input
            ref={inputRef}
            type="text"
            data-tag-id={props.tagId}
            data-segment-index={props.segmentIndex}
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
