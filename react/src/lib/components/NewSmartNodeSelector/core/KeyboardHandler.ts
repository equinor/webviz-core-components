import type { StateManager } from "./StateManager/StateManager";
import type { CompletionsState } from "./CompletionsState";
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
    private _suggestionsState: CompletionsState<any>;
    private _unsubscribeFocusedSegment: (() => void) | null = null;

    constructor(options: KeyboardHandlerOptions) {
        this._stateManager = options.stateManager;
        this._suggestionsState = options.suggestionsState;

        // Subscribe to focused segment changes to update suggestions
        this._unsubscribeFocusedSegment = this._stateManager
            .getPubSubDelegate()
            .subscribe(Topic.FOCUSED_SEGMENT, () => {
                this._updateCompletions();
            });
    }

    private _updateCompletions(): void {
        const caretPositions = this._stateManager.getCaretPositions();

        if (
            caretPositions.length !== 1 ||
            caretPositions[0].offset !== caretPositions[0].anchorOffset
        ) {
            this._suggestionsState.clearCompletions();
            return;
        }

        const queryItem = this._stateManager.getQueryItemById(
            caretPositions[0].queryId
        );
        if (!queryItem) {
            this._suggestionsState.clearCompletions();
            return;
        }

        this._suggestionsState.updateCompletions(
            queryItem,
            caretPositions[0].offset
        );
    }

    handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
        const { key, shiftKey: selecting } = event;

        // Try suggestions navigation first (if suggestions are visible)
        if (this._suggestionsState.hasSuggestions()) {
            switch (key) {
                case "ArrowDown":
                    this._suggestionsState.selectNext();
                    event.preventDefault();
                    return;
                case "ArrowUp":
                    this._suggestionsState.selectPrevious();
                    event.preventDefault();
                    return;
                case "Enter": {
                    const selected =
                        this._suggestionsState.getSelectedCompletion();
                    if (selected) {
                        // TODO: Accept suggestion - insert into query
                        const focusedSegment =
                            this._stateManager.getFocusedSegment();
                        if (focusedSegment === null) {
                            event.preventDefault();
                            return;
                        }
                        this._stateManager.updateQueryItem(
                            focusedSegment.queryId,
                            selected.insertText
                        );
                        this._stateManager.setCaretPositionToEndOfQueryItem(
                            focusedSegment.queryId
                        );
                        this._suggestionsState.clearCompletions();
                        event.preventDefault();
                        return;
                    }
                    // Fall through to default Enter handling if no suggestion selected
                    break;
                }
                case "Escape":
                    this._suggestionsState.clearSelection();
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
        if (this._unsubscribeFocusedSegment) {
            this._unsubscribeFocusedSegment();
            this._unsubscribeFocusedSegment = null;
        }
    }
}
