import React from "react";
import { SmartNodeSelectorDataContext } from "../SmartNodeSelector";
import { KeyboardHandler } from "../core/KeyboardHandler";
import { useSubscribeToTopic } from "../core/PubSubDelegate";
import { Topic } from "../core/StateManager/StateManager";

export function HiddenTextarea(): React.ReactElement {
    const { stateManager, completionsState: suggestionsState } =
        React.useContext(SmartNodeSelectorDataContext);

    const ref = React.useRef<HTMLTextAreaElement | null>(null);

    const keyboardHandler = React.useMemo(() => {
        return new KeyboardHandler({
            stateManager,
            suggestionsState,
        });
    }, [stateManager, suggestionsState]);

    // Clean up keyboard handler on unmount
    React.useEffect(() => {
        return () => {
            keyboardHandler.destroy();
        };
    }, [keyboardHandler]);

    const hasFocus = useSubscribeToTopic(stateManager, Topic.HAS_FOCUS);

    React.useEffect(
        function focusTextarea() {
            if (!ref.current) {
                return;
            }
            if (hasFocus) {
                ref.current.focus({ preventScroll: true });
            } else {
                ref.current.blur();
            }
        },
        [hasFocus]
    );

    const handleInput = React.useCallback(
        function handleInput(event: React.FormEvent<HTMLTextAreaElement>) {
            const target = event.currentTarget;
            keyboardHandler.handleInput(target.value);
            target.value = "";
        },
        [keyboardHandler]
    );

    const handleKeyDown = React.useCallback(
        function handleKeyDown(
            event: React.KeyboardEvent<HTMLTextAreaElement>
        ) {
            keyboardHandler.handleKeyDown(event);
        },
        [keyboardHandler]
    );

    const handleFocus = React.useCallback(
        function handleFocus() {
            // Set focus in state manager when textarea is focused
            stateManager.processFocusChange(true);
        },
        [stateManager]
    );

    const handleBlur = React.useCallback(
        function handleBlur() {
            // Clear caret positions when textarea loses focus
            stateManager.processFocusChange(false);
        },
        [stateManager]
    );

    return (
        <textarea
            spellCheck={false}
            ref={ref}
            style={{
                position: "fixed",
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
