export type Tag = {
    id: string;
    value: string;
}

export type CaretPosition = {
    tagId: string;
    offset: number;
}

export enum Topic {
    HAS_FOCUS = 'hasFocus',
    TAGS = 'tags',
    CARET_POSITIONS = 'caretPositions',
    SUGGESTIONS_INDEX = 'suggestionsIndex',
    FOCUSED_SEGMENT = 'focusedSegment',
}

export type TopicPayloads = {
    [Topic.HAS_FOCUS]: boolean;
    [Topic.TAGS]: Tag[];
    [Topic.CARET_POSITIONS]: CaretPosition[];
    [Topic.SUGGESTIONS_INDEX]: number | null;
    [Topic.FOCUSED_SEGMENT]: string | null;
}

export type StateManagerOptions = {
    delimiter: string;
}

export class StateManager {
    // Internal
    private _subscribers: Map<Topic, Set<() => void>> = new Map();
    private _tagCounter: number = 0;

    // Settings
    private _delimiter: string;

    // State
    private _tags: Tag[] = [];
    private _caretPositions: Set<CaretPosition> = new Set();
    private _suggestionsIndex: number | null = null;

    constructor(options: StateManagerOptions) {
        this._delimiter = options.delimiter;
    }
    
    subscribe(topic: Topic, callback: () => void): () => void {
        const subscribers = this._subscribers.get(topic) ?? new Set();
        subscribers.add(callback);
        this._subscribers.set(topic, subscribers);

        return () => {
            subscribers.delete(callback);
        };
    }

    notifySubscribers(topic: Topic): void {
        const subscribers = this._subscribers.get(topic);
        if (subscribers) {
            subscribers.forEach(callback => callback());
        }
    }

    makeSnapshotGetter<T extends keyof TopicPayloads>(topic: T): () => TopicPayloads[T] {
        switch (topic) {
            case Topic.TAGS:
                return () => this._tags as TopicPayloads[T];
            case Topic.CARET_POSITIONS:
                return () => Array.from(this._caretPositions) as TopicPayloads[T];
            case Topic.SUGGESTIONS_INDEX:
                return () => this._suggestionsIndex as TopicPayloads[T];
            case Topic.FOCUSED_SEGMENT:
                return () => null as TopicPayloads[T];
            case Topic.HAS_FOCUS:
                return () => false as TopicPayloads[T];
        }
    }

    processInput(value: string): void {
        if (this._caretPositions.size === 0) {
            // No caret positions to process input for
            return;
        }
        console.log("Processing input:", value);
    }

    processFocusChange(hasFocus: boolean): void {
        console.log("Processing focus:", hasFocus);
    }

    processKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
        console.log("Processing key down:", event.key);
    }

    addTag(tagValue: string): void {
        const newTag: Tag = {
            id: this.generateTagId(),
            value: tagValue,
        };
        this._tags.push(newTag);
        this.notifySubscribers(Topic.TAGS);
    }

    private generateTagId(): string {
        this._tagCounter += 1;
        return `tag-${this._tagCounter}`;
    }

}