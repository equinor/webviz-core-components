import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";

export type HiddenTextareaProps = {
}

export function HiddenTextarea(props: HiddenTextareaProps): React.ReactElement {
    const { stateManager } = React.useContext(SmartNodeSelectorDataContext);
    
    const ref = React.useRef<HTMLTextAreaElement | null>(null);

    const handleInput = React.useCallback(function handleInput(event: React.FormEvent<HTMLTextAreaElement>) {
        const target = event.currentTarget;
        stateManager.processInput(target.value);
        target.value = "";
    }, [stateManager]);

    const handleFocus = React.useCallback(function handleFocus() {
        stateManager.processFocusChange(true);
    }, [stateManager]);

    const handleBlur = React.useCallback(function handleBlur() {
        stateManager.processFocusChange(false);
    }, [stateManager]);

    const handleKeyDown = React.useCallback(function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        stateManager.processKeyDown(event);
    }, [stateManager]);

    return (
        <textarea
            spellCheck={false}
            ref={ref}
            style={{
                position: "absolute",
                // opacity: 0,
                left: 0,
                top: 0,
                width: 400,
                height: 300,
                resize: "none",
                border: "1px black solid",
                outline: "none",
                overflow: "hidden",
            }}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
        />
    );
}