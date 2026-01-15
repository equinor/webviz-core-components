export type QueryItem = {
    id: string;
    query: string;
};

export type TextSelection = {
    anchorOffset: number;
    focusOffset: number;
};

export type QueryTextSelection = TextSelection & {
    queryId: string;
};

export type QuerySelection = {
    anchorIndex: number;
    focusIndex: number;
};

export type SegmentTextSelection = QueryTextSelection & {
    queryId: string;
    segmentIndex: number;
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

export type StatePatch = {
    selectionMode?: SelectionMode;
    queryItemUpdates?: QueryItem[];
    textSelections?: QueryTextSelection[];
    querySelection?: QuerySelection | null;
};
