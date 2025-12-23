import { v4 } from "uuid";
import { ActionType, type Action } from "./actions";
import type { State } from "./type";

export type InitializerArgs = {
    initialTags: State["tags"];
};

export function initializer(args: InitializerArgs): State {
    return {
        tags: args.initialTags,
        focusedAddress: null,
        selection: null,
    };
}

export type MakeReducerOptions = {
    delimiter: string;
};

export function makeReducer(options: MakeReducerOptions) {
    return function reducer(state: State, action: Action): State {
        switch (action.type) {
            case ActionType.ADD_TAG: {
                return {
                    ...state,
                    tags: [
                        ...state.tags.map((tag) => ({
                            ...tag,
                            isLast: false,
                        })),
                        {
                            id: v4(),
                            value: "",
                            isLast: true,
                        },
                    ],
                };
            }
            case ActionType.REMOVE_TAG: {
                const { tagId } = action.payload;
                const tag = state.tags.find((t) => t.id === tagId);
                const newTags = state.tags.filter((tag) => tag.id !== tagId);
                if (newTags.length === 0 || tag?.isLast) {
                    const id = v4();
                    newTags.push({
                        id,
                        value: "",
                        isLast: true,
                    });
                } else {
                    newTags[newTags.length - 1].isLast = true;
                }
                return {
                    ...state,
                    tags: newTags,
                    focusedAddress: null,
                };
            }
            case ActionType.UPDATE_TAG_VALUE: {
                const { tagId, newValue } = action.payload;
                return {
                    ...state,
                    tags: state.tags.map((tag) =>
                        tag.id === tagId ? { ...tag, value: newValue } : tag
                    ),
                };
            }
            case ActionType.CHANGE_FOCUSED_ADDRESS: {
                const { tagId, segmentIndex } = action.payload;
                return {
                    ...state,
                    focusedAddress:
                        tagId === null
                            ? null
                            : {
                                  tagId,
                                  segmentIndex: segmentIndex,
                              },
                };
            }
            case ActionType.CLEAR_FOCUSED_ADDRESS: {
                return {
                    ...state,
                    focusedAddress: null,
                };
            }
            case ActionType.APPLY_SUGGESTION: {
                const { suggestion } = action.payload;
                if (state.focusedAddress === null) {
                    return state;
                }

                const isPartial = suggestion.type === "partial";
                const isWildcard = suggestion.type === "wildcard";
                const isLeaf = suggestion.node?.isLeaf ?? false;

                // Determine the new focus address after applying suggestion
                let newAddress;
                let newTags = state.tags;

                if (isPartial || isWildcard) {
                    // Partial/wildcard suggestions stay in the current segment
                    newAddress = {
                        tagId: state.focusedAddress.tagId,
                        segmentIndex: state.focusedAddress.segmentIndex,
                    };
                } else if (!isLeaf) {
                    // Complete node suggestions move to next segment
                    newAddress = {
                        tagId: state.focusedAddress.tagId,
                        segmentIndex: state.focusedAddress.segmentIndex + 1,
                    };
                } else {
                    // Leaf nodes create a new tag
                    const newId = v4();
                    newTags = [
                        ...state.tags.map((tag) => ({
                            ...tag,
                            isLast: false,
                        })),
                        {
                            id: newId,
                            value: "",
                            isLast: true,
                        },
                    ];
                    newAddress = {
                        tagId: newId,
                        segmentIndex: 0,
                    };
                }

                return {
                    ...state,
                    tags: newTags.map((tag) => {
                        if (tag.id !== state.focusedAddress!.tagId) {
                            return tag;
                        }

                        // Always use completedTag, which includes the full tag value
                        // The suggestion engine already handles operators and context
                        const newValue = suggestion.completedTag;

                        return {
                            ...tag,
                            value: newValue + (isLeaf ? "" : options.delimiter),
                        };
                    }),
                    focusedAddress: newAddress,
                };
            }
            default:
                return assertNever(action);
        }
    };
}

function assertNever(value: never): never {
    throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
