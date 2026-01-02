import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { Topic } from "../core/StateManager";
import { useSubscribeToTopic } from "../core/PubSubDelegate";

export function HiddenTextarea(): React.ReactElement {
    const { stateManager } = React.useContext(SmartNodeSelectorDataContext);

    const ref = React.useRef<HTMLTextAreaElement | null>(null);

    const hasFocus = useSubscribeToTopic(stateManager, Topic.HAS_FOCUS);

    React.useEffect(
        function focusTextarea() {
            if (!ref.current) {
                return;
            }
            if (hasFocus) {
                ref.current.focus();
            } else {
                ref.current.blur();
            }
        },
        [hasFocus]
    );

    const handleInput = React.useCallback(
        function handleInput(event: React.FormEvent<HTMLTextAreaElement>) {
            const target = event.currentTarget;
            stateManager.processInput(target.value);
            target.value = "";
        },
        [stateManager]
    );

    const handleFocus = React.useCallback(
        function handleFocus() {
            stateManager.processFocusChange(true);
        },
        [stateManager]
    );

    const handleBlur = React.useCallback(
        function handleBlur() {
            stateManager.processFocusChange(false);
        },
        [stateManager]
    );

    const handleKeyDown = React.useCallback(
        function handleKeyDown(
            event: React.KeyboardEvent<HTMLTextAreaElement>
        ) {
            stateManager.processKeyDown(event);
        },
        [stateManager]
    );

    return (
        <textarea
            spellCheck={false}
            ref={ref}
            style={{
                position: "absolute",
                opacity: 0,
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                resize: "none",
                border: "none",
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
