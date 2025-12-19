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

export function reducer(state: State, action: Action) {
    switch (action.type) {
        case ActionType.ADD_TAG: {
            return state;
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
                              segmendIndex: segmentIndex,
                          },
            };
        }
        case ActionType.CLEAR_FOCUSED_ADDRESS: {
            return {
                ...state,
                focusedAddress: null,
            };
        }
        default:
            return assertNever(action);
    }
}

function assertNever(value: never): never {
    throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
