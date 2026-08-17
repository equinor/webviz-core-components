import type React from "react";

export type InactiveSegmentRendererComponentProps<Node> = {
    matchedNodes: Set<Node>;
};

export interface InactiveSegmentRenderer<Node> {
    (
        segmentIndex: number
    ): React.ComponentType<InactiveSegmentRendererComponentProps<Node>> | null;
}
