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
    const queryTextSelections = useSubscribeToTopic(
        stateManager,
        Topic.QUERY_TEXT_SELECTIONS
    );
    const querySelection = useSubscribeToTopic(
        stateManager,
        Topic.QUERY_SELECTION
    );
    const completionsPopoverFocused = useSubscribeToTopic(
        stateManager,
        Topic.COMPLETIONS_POPOVER_FOCUSED
    );

    React.useEffect(
        function focusTextarea() {
            if (!ref.current) {
                return;
            }
            if (hasFocus && !completionsPopoverFocused) {
                // Focus the textarea whenever we have active state and the
                // completions popover is not holding focus. This also handles
                // the case where the popover releases focus back to us.
                ref.current.focus({ preventScroll: true });
            } else if (!hasFocus) {
                ref.current.blur();
            }
        },
        [hasFocus, queryTextSelections, querySelection, completionsPopoverFocused]
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

    const handleKeyUp = React.useCallback(
        function handleKeyUp(event: React.KeyboardEvent<HTMLTextAreaElement>) {
            keyboardHandler.handleKeyUp(event);
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
            onKeyUp={handleKeyUp}
            onInput={handleInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
        />
    );
}
