import type { CompletionsState } from "./CompletionsState";
import type { StateManager } from "./StateManager/StateManager";
import { Topic } from "./StateManager/StateManager";

export type KeyboardHandlerOptions = {
    stateManager: StateManager;
    suggestionsState: CompletionsState<any>;
};

/**
 * Handles keyboard input routing.
 * This class encapsulates the volatile keyboard input method,
 * routing events to the appropriate stable state managers.
 */
export class KeyboardHandler {
    private _stateManager: StateManager;
    private _completionsState: CompletionsState<any>;
    private _unsubscribeFunctions: (() => void)[] = [];

    constructor(options: KeyboardHandlerOptions) {
        this._stateManager = options.stateManager;
        this._completionsState = options.suggestionsState;

        // Subscribe to focused segment changes to update suggestions
        const pubSub = this._stateManager.getPubSubDelegate();
        this._unsubscribeFunctions = [
            pubSub.subscribe(
                Topic.COMPLETION_CONTEXT,
                this.updateCompletions.bind(this)
            ),
        ];
    }

    private updateCompletions(): void {
        const completionContext = this._stateManager.getCompletionContext();
        if (!completionContext) {
            this._completionsState.clearCompletions();
            return;
        }

        const parsedQuery = this._stateManager.getParsedQuery(
            completionContext.queryItem.query
        );
        if (!parsedQuery) {
            this._completionsState.clearCompletions();
            return;
        }

        this._completionsState.updateCompletions(
            parsedQuery,
            completionContext.caretPosition.offset
        );
    }

    handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
        const { key, shiftKey: selecting } = event;

        // Try suggestions navigation first (if suggestions are visible)
        if (this._completionsState.hasCompletions()) {
            switch (key) {
                case "ArrowDown":
                    this._completionsState.selectNext();
                    event.preventDefault();
                    return;
                case "ArrowUp":
                    this._completionsState.selectPrevious();
                    event.preventDefault();
                    return;
                case "Enter": {
                    const selected =
                        this._completionsState.getSelectedCompletion();
                    const queryItem = this._stateManager.getFocusedQueryItem();
                    if (selected && queryItem) {
                        // TODO: Accept suggestion - insert into query
                        this._stateManager.updateFocusedQueryItem(
                            selected.insertText,
                            selected.replaceRange
                        );
                        event.preventDefault();
                        return;
                    }
                    // Fall through to default Enter handling if no suggestion selected
                    break;
                }
                case "Escape":
                    this._completionsState.clearCompletions();
                    event.preventDefault();
                    return;
            }
        }

        // Default keyboard handling - route to StateManager operations
        switch (key) {
            case "ArrowRight":
                this._stateManager.moveCaretRelative(1, selecting);
                event.preventDefault();
                break;
            case "ArrowLeft":
                this._stateManager.moveCaretRelative(-1, selecting);
                event.preventDefault();
                break;
            case "Backspace":
                this._stateManager.backspaceAtCaret();
                event.preventDefault();
                break;
            case "Enter":
                this._stateManager.addQueryItem("");
                this._stateManager.setCaretPositionToEndOfLastItem();
                event.preventDefault();
                break;
        }
    }

    handleInput(value: string): void {
        this._stateManager.insertTextAtCaret(value);
    }

    destroy(): void {
        this._unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
        this._unsubscribeFunctions = [];
    }
}
