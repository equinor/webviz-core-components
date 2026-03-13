import type { IndexedNode } from "../../core";
import type { CompletionItem } from "../../core/query-language/types/completion";
import type {
    CompletionStrategy,
    CompletionStrategyKeyResult,
    CompletionStrategyReconcileArgs,
    CompletionStrategyRuntimeArgs,
    SelectedCompletion,
} from "../interface";
import { SimpleCompletionStrategyComponent } from "./Component";

export type SimpleCompletionSessionState = {
    highlightedId: string | null;
    selectedIds: string[];
};

export class SimpleCompletionStrategy implements CompletionStrategy<
    IndexedNode,
    SimpleCompletionSessionState
> {
    component = SimpleCompletionStrategyComponent;

    reconcileState(
        args: CompletionStrategyReconcileArgs<
            IndexedNode,
            SimpleCompletionSessionState
        >
    ): SimpleCompletionSessionState {
        return reconcileSimpleState(args.prevState, args.completions);
    }

    onKeyDown(
        event: React.KeyboardEvent<HTMLElement>,
        args: CompletionStrategyRuntimeArgs<
            IndexedNode,
            SimpleCompletionSessionState
        >
    ): CompletionStrategyKeyResult<SimpleCompletionSessionState> {
        const items = getSimpleItems(args.completions);

        switch (event.key) {
            case "ArrowDown":
                return {
                    nextState: {
                        ...args.state,
                        highlightedId: moveHighlightedId(
                            args.state.highlightedId,
                            items,
                            1
                        ),
                    },
                };

            case "ArrowUp":
                return {
                    nextState: {
                        ...args.state,
                        highlightedId: moveHighlightedId(
                            args.state.highlightedId,
                            items,
                            -1
                        ),
                    },
                };

            case " ":{
                const highlightedId = args.state.highlightedId;
                if (!highlightedId) {
                    return {};
                }

                const alreadySelected =
                    args.state.selectedIds.includes(highlightedId);

                return {
                    nextState: {
                        ...args.state,
                        selectedIds: alreadySelected
                            ? args.state.selectedIds.filter(
                                  (id) => id !== highlightedId
                              )
                            : [...args.state.selectedIds, highlightedId],
                    },
                };
            }

            case "Enter":
            case "Tab":
                return { accept: true };

            case "Escape":
                return { close: true };

            default:
                return {};
        }
    }

    getAppliedCompletion(
        args: CompletionStrategyRuntimeArgs<
            IndexedNode,
            SimpleCompletionSessionState
        >
    ): SelectedCompletion | null {
        const items = getSimpleItems(args.completions);
        const selectedItems = items.filter((item) =>
            args.state.selectedIds.includes(getCompletionKey(item))
        );

        if (selectedItems.length === 0) {
            return null;
        }

        const joined = selectedItems.map((item) => item.insertText).join("|");
        const text =
            `${joined}${args.delimiter}`;

        return {
            text,
            range: selectedItems[0].replaceRange,
        };
    }
}

function getCompletionKey<Node>(item: CompletionItem<Node>): string {
    return `${item.kind}::${item.label}::${item.insertText}::${item.replaceRange.start}::${item.replaceRange.end}`;
}

function isSimpleNodeCompletion<Node>(
    item: CompletionItem<Node>
): item is Extract<CompletionItem<Node>, { kind: "segment" }> {
    if (item.kind !== "segment") {
        return false;
    }

    // Temporary rule:
    // only accept single-origin node completions.
    return item.origin.kind === "single";
}

function getSimpleItems<Node>(
    completions: CompletionItem<Node>[]
): Extract<CompletionItem<Node>, { kind: "segment" }>[] {
    return completions.filter(isSimpleNodeCompletion) as Extract<CompletionItem<Node>, { kind: "segment" }>[];
}

function reconcileSimpleState<Node>(
    prevState: SimpleCompletionSessionState | null,
    completions: CompletionItem<Node>[]
): SimpleCompletionSessionState {
    const items = getSimpleItems(completions);
    const validIds = new Set(items.map(getCompletionKey));

    const selectedIds =
        prevState?.selectedIds.filter((id) => validIds.has(id)) ?? [];

    const highlightedId =
        prevState?.highlightedId && validIds.has(prevState.highlightedId)
            ? prevState.highlightedId
            : items.length > 0
              ? getCompletionKey(items[0])
              : null;

    return {
        highlightedId,
        selectedIds,
    };
}

function moveHighlightedId<Node>(
    currentId: string | null,
    items: Extract<CompletionItem<Node>, { kind: "segment" }>[],
    direction: 1 | -1
): string | null {
    if (items.length === 0) {
        return null;
    }

    const keys = items.map(getCompletionKey);
    const currentIndex = currentId ? keys.indexOf(currentId) : -1;

    if (currentIndex === -1) {
        return keys[0];
    }

    const nextIndex = Math.max(
        0,
        Math.min(currentIndex + direction, keys.length - 1)
    );
    return keys[nextIndex];
}
