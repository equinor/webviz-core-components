import type { CompletionsState } from "./CompletionsState";
import type { StateManager } from "./StateManager/StateManager";

export type KeyboardHandlerOptions = {
    stateManager: StateManager;
    suggestionsState: CompletionsState<any, any>;
};

/**
 * Handles keyboard input routing.
 * This class encapsulates the volatile keyboard input method,
 * routing events to the appropriate stable state managers.
 */
export class KeyboardHandler {
    private _stateManager: StateManager;
    private _completionsState: CompletionsState<any, any>;
    private _unsubscribeFunctions: (() => void)[] = [];
    private _inputBuffer: string[] = [];

    constructor(options: KeyboardHandlerOptions) {
        this._stateManager = options.stateManager;
        this._completionsState = options.suggestionsState;
    }

    handleKeyUp(_: React.KeyboardEvent<HTMLTextAreaElement>): void {
        this._inputBuffer = [];
    }

    private hasBufferedInput(): boolean {
        return this._inputBuffer.length > 1;
    }

    handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
        const { key, shiftKey: selecting } = event;

        this._inputBuffer.push(key);

        // When completions are visible, Tab/ArrowDown/ArrowUp switch focus to
        // the popover. The popover owns its own keyboard handler from there.
        if (this._completionsState.getCompletions().length > 0) {
            switch (key) {
                case "Tab":
                    this._stateManager.setCompletionsPopoverFocused(true);
                    event.preventDefault();
                    return;
                case "ArrowDown":
                    this._stateManager.setCompletionsPopoverFocused(true);
                    event.preventDefault();
                    return;
                case "ArrowUp":
                    this._stateManager.setCompletionsPopoverFocused(true);
                    event.preventDefault();
                    return;
            }
        }

        // Segment selection mode handling
        if (this._stateManager.getSelectionMode() === "segment") {
            switch (key) {
                case "ArrowLeft":
                    this._stateManager.moveFocus(
                        -1,
                        selecting,
                        this.hasBufferedInput()
                    );
                    event.preventDefault();
                    return;
                case "ArrowRight":
                    this._stateManager.moveFocus(
                        1,
                        selecting,
                        this.hasBufferedInput()
                    );
                    event.preventDefault();
                    return;
                case "ArrowUp":
                    this._stateManager.cycleSibling(-1);
                    event.preventDefault();
                    return;
                case "ArrowDown":
                    this._stateManager.cycleSibling(1);
                    event.preventDefault();
                    return;
                case "PageUp": {
                    const sel = this._stateManager.getSegmentSelection();
                    if (sel && sel.anchor === sel.focus) {
                        this._stateManager.cycleSibling(-1);
                        event.preventDefault();
                    }
                    return;
                }
                case "PageDown": {
                    const sel = this._stateManager.getSegmentSelection();
                    if (sel && sel.anchor === sel.focus) {
                        this._stateManager.cycleSibling(1);
                        event.preventDefault();
                    }
                    return;
                }
                case "Escape":
                    this._stateManager.exit();
                    event.preventDefault();
                    return;
                case "Enter":
                    this._stateManager.confirm();
                    event.preventDefault();
                    return;
                case "Backspace":
                    this._stateManager.removeCurrentSelection("backward");
                    event.preventDefault();
                    return;
                case "Delete":
                    this._stateManager.removeCurrentSelection("forward");
                    event.preventDefault();
                    return;
                // Any other key falls through to handleInput → insertText,
                // which auto-switches to text mode before inserting.
            }
        }

        // Default keyboard handling - route to StateManager operations
        switch (key) {
            // Navigation
            case "ArrowRight":
                this._stateManager.moveFocus(
                    1,
                    selecting,
                    this.hasBufferedInput()
                );
                event.preventDefault();
                break;
            case "ArrowLeft":
                this._stateManager.moveFocus(
                    -1,
                    selecting,
                    this.hasBufferedInput()
                );
                event.preventDefault();
                break;
            case "Home":
                this._stateManager.moveFocusToStartOrEnd("start", selecting);
                event.preventDefault();
                break;
            case "End":
                this._stateManager.moveFocusToStartOrEnd("end", selecting);
                event.preventDefault();
                break;
            case "Escape":
                this._stateManager.exit();
                event.preventDefault();
                break;

            // Selection
            case "a":
                if (event.ctrlKey || event.metaKey) {
                    this._stateManager.selectAll();
                    event.preventDefault();
                }
                break;

            // Copy/Paste
            case "v":
                if (event.ctrlKey || event.metaKey) {
                    const pasteData = navigator.clipboard.readText();
                    pasteData.then((text) => {
                        this._stateManager.pasteText(text);
                    });
                    event.preventDefault();
                }
                break;

            case "c":
                if (event.ctrlKey || event.metaKey) {
                    const selection = this._stateManager.getCurrentSelection();
                    navigator.clipboard.writeText(selection);
                    event.preventDefault();
                }
                break;

            // Editing
            case "Backspace":
                this._stateManager.removeCurrentSelection("backward");
                event.preventDefault();
                break;
            case "Delete":
                this._stateManager.removeCurrentSelection("forward");
                event.preventDefault();
                break;
            case "Enter":
                this._stateManager.confirm();
                event.preventDefault();
                break;
        }
    }

    handleInput(value: string): void {
        this._stateManager.insertText(value, true);
    }

    destroy(): void {
        this._unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
        this._unsubscribeFunctions = [];
    }
}
