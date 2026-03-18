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
    isFocused: boolean;
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
        return reconcileSimpleState(
            args.prevState,
            args.completions,
            args.selectionMode,
            args.currentSegmentSelections
        );
    }

    onFocus(
        args: CompletionStrategyRuntimeArgs<
            IndexedNode,
            SimpleCompletionSessionState
        >
    ): CompletionStrategyKeyResult<SimpleCompletionSessionState> {
        if (args.selectionMode === "segment") {
            const items = getSimpleItems(args.completions);
            const validIdSet = new Set(items.map(getCompletionKey));
            const firstSelectedId =
                args.state.selectedIds.find((id) => validIdSet.has(id)) ?? null;
            const targetId =
                firstSelectedId ??
                (items.length > 0 ? getCompletionKey(items[0]) : null);
            return {
                nextState: {
                    ...args.state,
                    isFocused: true,
                    highlightedId: targetId,
                },
            };
        }

        const syntaxCompletions = args.completions.filter(
            (item) => item.kind !== "node" && item.kind !== "segment"
        );
        const nodeCompletions = args.completions.filter(
            (item) => item.kind === "node"
        );
        const allCompletions = [...syntaxCompletions, ...nodeCompletions];
        const firstId =
            allCompletions.length > 0
                ? getCompletionKey(allCompletions[0])
                : null;
        return {
            nextState: {
                ...args.state,
                isFocused: true,
                highlightedId: firstId,
            },
        };
    }

    onKeyDown(
        event: React.KeyboardEvent<HTMLElement>,
        args: CompletionStrategyRuntimeArgs<
            IndexedNode,
            SimpleCompletionSessionState
        >
    ): CompletionStrategyKeyResult<SimpleCompletionSessionState> {
        if (args.selectionMode !== "segment") {
            const syntaxCompletions = args.completions.filter(
                (item) => item.kind !== "node" && item.kind !== "segment"
            );

            const nodeCompletions = args.completions.filter(
                (item) => item.kind === "node"
            );

            const allCompletions = [...syntaxCompletions, ...nodeCompletions];

            switch (event.key) {
                case "ArrowDown":
                    return {
                        nextState: {
                            ...args.state,
                            highlightedId: moveHighlightedId(
                                args.state.highlightedId,
                                allCompletions,
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
                                allCompletions,
                                -1
                            ),
                        },
                    };

                case "Enter":
                case "Tab":
                    return { accept: true };

                case "Escape":
                    return { close: true };

                default:
                    return {};
            }
        }

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

            case " ": {
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

            case "Enter": {
                const highlightedId = args.state.highlightedId;
                if (!highlightedId) {
                    return {};
                }

                if (args.state.selectedIds.length > 0) {
                    return { accept: true };
                }

                return {
                    nextState: {
                        ...args.state,
                        selectedIds: [...args.state.selectedIds, highlightedId],
                    },
                    accept: true,
                };
            }
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
        if (args.selectionMode === "segment") {
            const items = getSimpleItems(args.completions);
            const selectedItems = items.filter((item) =>
                args.state.selectedIds.includes(getCompletionKey(item))
            );

            if (selectedItems.length === 0) {
                return null;
            }

            const firstSelectedItem = selectedItems[0];

            let text = selectedItems.map((item) => item.insertText).join("|");
            if (
                (args.caretContext?.segmentIndex ?? 0) ===
                    args.queryContext.segmentCount - 1 &&
                !(
                    firstSelectedItem.origin.kind === "single" &&
                    firstSelectedItem.origin.node.isLeaf
                )
            ) {
                text = `${text}${args.delimiter}`;
            }

            return {
                text,
                range: args.caretContext?.segment.charRange ?? {
                    start: 0,
                    end: 0,
                },
                moveFocus: true,
            };
        }

        const syntaxCompletions = args.completions.filter(
            (item) => item.kind !== "node" && item.kind !== "segment"
        );

        const nodeCompletions = args.completions.filter(
            (item) => item.kind === "node"
        );

        const items = [...syntaxCompletions, ...nodeCompletions];

        const selectedItems = items.filter((item) =>
            args.state.selectedIds.includes(getCompletionKey(item))
        );

        if (selectedItems.length === 0) {
            return null;
        }

        const selectedItem = selectedItems[0];

        return {
            text: selectedItem.insertText,
            range: selectedItem.replaceRange,
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
    return completions.filter(isSimpleNodeCompletion) as Extract<
        CompletionItem<Node>,
        { kind: "segment" }
    >[];
}

function reconcileSimpleState<Node>(
    prevState: SimpleCompletionSessionState | null,
    completions: CompletionItem<Node>[],
    selectionMode: "segment" | "text",
    currentSegmentSelections: Node[] = []
): SimpleCompletionSessionState {
    const isFocused = prevState?.isFocused ?? false;

    const items = getSimpleItems(completions);
    const validIds = new Set(items.map(getCompletionKey));

    const persistedIds =
        prevState?.selectedIds.filter((id) => validIds.has(id)) ?? [];

    const selectionSet = new Set(currentSegmentSelections);
    const currentSelectionIds = items
        .filter(
            (item) =>
                item.origin.kind === "single" &&
                selectionSet.has(item.origin.node)
        )
        .map(getCompletionKey);

    // Persist the user's previous selection only when it overlaps with the
    // nodes currently matched by the segment text. If cycling moved to a
    // different node the persisted IDs point to the old node (still a valid
    // sibling, so still in validIds) and must be replaced.
    const persistedAlignsCurrent =
        persistedIds.length > 0 &&
        currentSelectionIds.some((id) => persistedIds.includes(id));

    const selectedIds = persistedAlignsCurrent
        ? persistedIds
        : currentSelectionIds;

    // Only auto-highlight when already focused; no default highlight on fresh open
    let highlightedId: string | null = null;
    if (prevState !== null && !persistedAlignsCurrent && selectedIds.length > 0) {
        // Cycling moved to a different node — follow the new selection.
        highlightedId = selectedIds[0];
    } else if (prevState?.highlightedId && validIds.has(prevState.highlightedId)) {
        highlightedId = prevState.highlightedId;
    } else if (isFocused) {
        if (selectionMode === "segment") {
            highlightedId =
                selectedIds.find((id) => validIds.has(id)) ??
                (items.length > 0 ? getCompletionKey(items[0]) : null);
        } else {
            highlightedId =
                items.length > 0 ? getCompletionKey(items[0]) : null;
        }
    }

    return {
        highlightedId,
        selectedIds,
        isFocused,
    };
}

function moveHighlightedId<Node>(
    currentId: string | null,
    items: CompletionItem<Node>[],
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
