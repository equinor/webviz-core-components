import type { StateManager } from "./StateManager";
import type { SuggestionsState } from "./SuggestionsState";
import { Topic } from "./StateManager";

export type KeyboardHandlerOptions = {
    stateManager: StateManager;
    suggestionsState: SuggestionsState;
};

/**
 * Handles keyboard input routing.
 * This class encapsulates the volatile keyboard input method,
 * routing events to the appropriate stable state managers.
 */
export class KeyboardHandler {
    private _stateManager: StateManager;
    private _suggestionsState: SuggestionsState;
    private _unsubscribeFocusedSegment: (() => void) | null = null;

    constructor(options: KeyboardHandlerOptions) {
        this._stateManager = options.stateManager;
        this._suggestionsState = options.suggestionsState;

        // Subscribe to focused segment changes to update suggestions
        this._unsubscribeFocusedSegment = this._stateManager
            .getPubSubDelegate()
            .subscribe(Topic.FOCUSED_SEGMENT, () => {
                this._updateSuggestions();
            });
    }

    private _updateSuggestions(): void {
        const focusedSegment = this._stateManager.makeSnapshotGetter(
            Topic.FOCUSED_SEGMENT
        )();

        if (focusedSegment === null) {
            this._suggestionsState.clearSuggestions();
            return;
        }

        const queryItem = this._stateManager.getQueryItemById(
            focusedSegment.queryId
        );
        if (!queryItem) {
            this._suggestionsState.clearSuggestions();
            return;
        }

        this._suggestionsState.updateSuggestions(
            queryItem.query,
            focusedSegment.segmentIndex
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
                        this._suggestionsState.getSelectedSuggestion();
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
                            selected.completedTag
                        );
                        this._stateManager.setCaretPositionToEndOfQueryItem(
                            focusedSegment.queryId
                        );
                        this._suggestionsState.clearSuggestions();
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
