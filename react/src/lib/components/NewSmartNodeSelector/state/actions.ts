import type { Suggestion } from "../core";

export enum ActionType {
    ADD_TAG = "ADD_TAG",
    REMOVE_TAG = "REMOVE_TAG",
    UPDATE_TAG_VALUE = "UPDATE_TAG_VALUE",
    CHANGE_FOCUSED_ADDRESS = "CHANGE_FOCUSED_ADDRESS",
    CLEAR_FOCUSED_ADDRESS = "CLEAR_FOCUSED_ADDRESS",
    APPLY_SUGGESTION = "APPLY_SUGGESTION",
}

export type Payloads = {
    [ActionType.ADD_TAG]: undefined;
    [ActionType.REMOVE_TAG]: {
        tagId: string;
    };
    [ActionType.UPDATE_TAG_VALUE]: {
        tagId: string;
        newValue: string;
    };
    [ActionType.CHANGE_FOCUSED_ADDRESS]: {
        tagId: string | null;
        segmentIndex: number;
    };
    [ActionType.CLEAR_FOCUSED_ADDRESS]: undefined;
    [ActionType.APPLY_SUGGESTION]: {
        suggestion: Suggestion;
    };
};

type ActionMap<
    TPayloads extends {
        [index: string]: Record<string, unknown> | undefined;
    },
> = {
    [Key in keyof TPayloads]: TPayloads[Key] extends undefined
        ? {
              type: Key;
          }
        : {
              type: Key;
              payload: TPayloads[Key];
          };
};

export type Action = ActionMap<Payloads>[keyof ActionMap<Payloads>];
