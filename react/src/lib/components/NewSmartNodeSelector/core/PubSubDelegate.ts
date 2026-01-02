import React from "react";

export type TopicPayloads = Record<string, any>;

export interface PubSub<TTopicPayloads extends TopicPayloads> {
    makeSnapshotGetter<T extends keyof TTopicPayloads>(
        topic: T
    ): () => TTopicPayloads[T];
    getPubSubDelegate(): PubSubDelegate<TTopicPayloads>;
}

export class PubSubDelegate<TTopicPayloads extends TopicPayloads> {
    private _subscribers: Map<keyof TTopicPayloads, Set<() => void>> =
        new Map();

    subscribe(topic: keyof TTopicPayloads, callback: () => void): () => void {
        const subscribers = this._subscribers.get(topic) ?? new Set();
        subscribers.add(callback);
        this._subscribers.set(topic, subscribers);

        return () => {
            subscribers.delete(callback);
        };
    }

    makeSubscriberFunction(
        topic: keyof TTopicPayloads
    ): (onStoreChangeCallback: () => void) => () => void {
        return (onStoreChangeCallback: () => void) => {
            return this.subscribe(topic, onStoreChangeCallback);
        };
    }

    notifySubscribers(topic: keyof TTopicPayloads): void {
        const subscribers = this._subscribers.get(topic);
        if (subscribers) {
            subscribers.forEach((callback) => callback());
        }
    }
}

export function useSubscribeToTopic<
    TTopicPayloads extends TopicPayloads,
    TTopic extends keyof TTopicPayloads,
>(
    publishSubscribe: PubSub<TTopicPayloads>,
    topic: TTopic
): TTopicPayloads[TTopic] {
    const value = React.useSyncExternalStore<TTopicPayloads[TTopic]>(
        publishSubscribe.getPubSubDelegate().makeSubscriberFunction(topic),
        publishSubscribe.makeSnapshotGetter(topic)
    );

    return value;
}
