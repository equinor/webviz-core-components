export type QueryItem = {
    id: string;
    query: string;
};

export type Selection = {
    anchor: number;
    focus: number;
};

export type QueryTextSelection = Selection & {
    queryId: string;
};

export type QuerySelection = Selection;

export type SegmentTextSelection = {
    queryId: string;
    focusSegmentIndex: number;
    anchorSegmentIndex: number;
    focus: number; // segment-relative offset
    anchor: number; // segment-relative offset
};

export type QuerySegment = {
    queryId: string;
    segmentIndex: number;
};

export type CompletionContext = {
    queryId: string;
    queryItem: QueryItem;
    queryTextSelection: QueryTextSelection;
    segmentIndex: number;
};

export type Segment = {
    index: number;
    startOffset: number;
    endOffset: number;
    length: number;
};

export type SelectionMode = "query" | "text";

export type QueryItemUpdate = {
    kind: "update" | "remove" | "add";
    item: QueryItem;
};

export type StatePatch = {
    selectionMode?: SelectionMode;
    queryItemUpdates?: QueryItemUpdate[];
    textSelections?: QueryTextSelection[];
    querySelection?: QuerySelection | null;
};
