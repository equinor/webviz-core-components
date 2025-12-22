import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";

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
    const context = React.useContext(SmartNodeSelectorDataContext);

    const inputRef = React.useRef<HTMLInputElement>(null);
    const measureRef = React.useRef<HTMLSpanElement>(null);
    const [width, setWidth] = React.useState<number>(0);

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

    // Measure the text width whenever value or placeholder changes
    React.useEffect(function onValueOrPlaceholderChange() {
        if (measureRef.current) {
            const textToMeasure = props.value || props.placeholder || "";
            measureRef.current.textContent = textToMeasure;
            const measuredWidth = measureRef.current.offsetWidth;
            // Add some padding (minimum 20px, or measured width + 8px)
            setWidth(Math.max(20, measuredWidth));
        }
    }, [props.value, props.placeholder]);

    return (
        <>
            {/* Hidden span for measuring text width */}
            <span
                ref={measureRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    visibility: "hidden",
                    whiteSpace: "pre",
                    fontSize: "inherit",
                    fontFamily: "inherit",
                    fontWeight: "inherit",
                    letterSpacing: "inherit",
                }}
            />
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
                    width: `${width}px`,
                    border: "none",
                    outline: "none",
                    height: "100%",
                    backgroundColor: "transparent",
                    fontSize: "inherit",
                    fontFamily: "inherit",
                    fontWeight: "inherit",
                    letterSpacing: "inherit",
                }}
            />
        </>
    );
}
