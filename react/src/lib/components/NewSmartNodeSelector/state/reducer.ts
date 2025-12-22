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
                    ]
                }
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

                const isLeaf = suggestion.node?.isLeaf ?? false;
                let newAddress = null;
                if (!isLeaf) {
                    newAddress = {
                        tagId: state.focusedAddress.tagId,
                        segmentIndex: state.focusedAddress.segmentIndex + 1,
                    };
                }
                else {
                    state.tags = state.tags.map((tag) => ({
                        ...tag,
                        isLast: false,
                    }));
                    const newId = v4();
                    state.tags.push({
                        id: newId,
                        value: "",
                        isLast: true,
                    });
                    newAddress = {
                        tagId: newId,
                        segmentIndex: 0,
                    };
                }

                return {
                    ...state,
                    tags: state.tags.map((tag) => {
                        if (tag.id !== state.focusedAddress!.tagId) {
                            return tag;
                        }
                        return {
                            ...tag,
                            value: suggestion.completedTag + (isLeaf ? "" : options.delimiter),
                        };
                    }),
                    focusedAddress: newAddress,
                };
            }
            default:
                return assertNever(action);
        }
    }
}

function assertNever(value: never): never {
    throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
