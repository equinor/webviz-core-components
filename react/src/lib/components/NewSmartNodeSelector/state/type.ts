export type Tag = {
    id: string;
    value: string;
    isLast: boolean;
};

export type SelectionRange = {
    startTagId: string;
    endTagId: string;
};

export type Address = {
    tagId: string;
    segmentIndex: number;
    caretIndex: number;
};

export type State = {
    tags: Tag[];

    focusedAddress: Address | null;

    selection: {
        ranges: SelectionRange[];
        // Anchor point for the current selection
        anchorTagId: string | null;
    } | null;
};
