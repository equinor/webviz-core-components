import React from "react";
import type {
    InactiveSegmentRenderer,
    InactiveSegmentRendererComponentProps,
} from "./interface";
import type { IndexedNode } from "../core";
import { well, error_filled } from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";

Icon.add({ well, error_filled });

export const IconRenderer: InactiveSegmentRenderer<IndexedNode> = (
    segmentIndex: number
) => {
    if (segmentIndex > 0) {
        return null;
    }
    return IconRendererComponent;
};

export function IconRendererComponent(
    props: InactiveSegmentRendererComponentProps<IndexedNode>
): React.ReactElement {
    if (props.matchedNodes.size === 0) {
        return <Icon data={error_filled} size={16} />;
    } else if (props.matchedNodes.size === 1) {
        return <Icon data={well} size={16} />;
    }
    return <span>◉</span>;
}
