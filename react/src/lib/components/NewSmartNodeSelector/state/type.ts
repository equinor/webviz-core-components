export type Tag = {
    id: string;
    value: string;
    isLast: boolean;
};

export type SelectionRange = {
    startTagId: string;
    endTagId: string;
};

export type State = {
    tags: Tag[];

    focusedAddress: {
        tagId: string;
        segmentIndex: number;
        nodeAddress: number[];
    } | null;

    selection: {
        ranges: SelectionRange[];
        // Anchor point for the current selection
        anchorTagId: string | null;
    } | null;
};
