export function computeTextWidthAndHeight(
    text: string,
    element: HTMLElement
): { width: number; height: number } {
    if (!element) return { width: 0, height: 0 };

    try {
        // Use Range API to measure actual rendered text in the DOM
        // This accounts for all styles including bold tokens
        const textNodes = getTextNodesIn(element);

        if (textNodes.length === 0) {
            // Fallback: no text content yet
            return { width: 0, height: element.getBoundingClientRect().height };
        }

        const targetLength = text.length;

        // Special case: empty string
        if (targetLength === 0) {
            return { width: 0, height: element.getBoundingClientRect().height };
        }

        let currentLength = 0;
        let targetNode: Text | null = null;
        let offsetInNode = 0;

        // Find the text node and offset that corresponds to our target length
        for (const node of textNodes) {
            const nodeLength = node.textContent?.length || 0;
            if (currentLength + nodeLength >= targetLength) {
                targetNode = node;
                offsetInNode = targetLength - currentLength;
                break;
            }
            currentLength += nodeLength;
        }

        if (!targetNode) {
            // If we didn't find the target, use the last node
            targetNode = textNodes[textNodes.length - 1];
            offsetInNode = targetNode.textContent?.length || 0;
        }

        // Create a range from the start to our target position
        const range = document.createRange();
        range.setStart(textNodes[0], 0);
        range.setEnd(targetNode, offsetInNode);

        const rect = range.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
    } catch (error) {
        // Fallback on error
        console.error('Error computing text width:', error);
        return { width: 0, height: element.getBoundingClientRect().height };
    }
}

function getTextNodesIn(node: Node, depth = 0): Text[] {
    const MAX_DEPTH = 100; // Prevent stack overflow with deeply nested structures
    const textNodes: Text[] = [];

    if (depth > MAX_DEPTH) {
        console.warn('Max depth reached in getTextNodesIn');
        return textNodes;
    }

    if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node as Text);
    } else {
        for (const child of Array.from(node.childNodes)) {
            textNodes.push(...getTextNodesIn(child, depth + 1));
        }
    }

    return textNodes;
}

export function getCaretOffsetFromX(
    x: number,
    text: string,
    element: HTMLElement
): number {
    const computedStyle = window.getComputedStyle(element);

    const span = document.createElement("span");

    // Copy all text-rendering related styles
    span.style.font = computedStyle.font;
    span.style.fontSize = computedStyle.fontSize;
    span.style.fontFamily = computedStyle.fontFamily;
    span.style.fontWeight = computedStyle.fontWeight;
    span.style.fontStyle = computedStyle.fontStyle;
    span.style.letterSpacing = computedStyle.letterSpacing;
    span.style.wordSpacing = computedStyle.wordSpacing;
    span.style.textTransform = computedStyle.textTransform;
    span.style.whiteSpace = "pre";
    span.style.visibility = "hidden";

    document.body.appendChild(span);

    let closestOffset = 0;
    let closestDistance = Math.abs(x);

    // Linear search for simplicity (can optimize with binary search later)
    for (let i = 0; i <= text.length; i++) {
        span.textContent = text.slice(0, i);
        const width = span.getBoundingClientRect().width;
        const distance = Math.abs(x - width);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestOffset = i;
        }
    }

    document.body.removeChild(span);

    return closestOffset;
}

export type TruncationInfo = {
    startText: string;
    hiddenText: string;
    endText: string;
    ellipsisText: string;
};

/**
 * Maps a click x-coordinate on a truncated segment to the actual caret offset in the full text.
 * Uses proportional width-based mapping for accurate positioning.
 */
export function mapTruncatedClickToFullOffset(
    clickX: number,
    truncationInfo: TruncationInfo,
    segmentElement: HTMLElement
): number {
    const { startText, hiddenText, endText, ellipsisText } = truncationInfo;
    const fullText = startText + hiddenText + endText;

    // The segment is currently rendered as: startText + "..." + endText
    // We need to measure each part as rendered in the actual DOM with token styling

    // Measure widths using the actual rendered segment content
    const startWidth = computeTextWidthAndHeight(startText, segmentElement).width;
    const startPlusEllipsisWidth = computeTextWidthAndHeight(
        startText + ellipsisText,
        segmentElement
    ).width;
    const ellipsisWidth = startPlusEllipsisWidth - startWidth;

    // Determine which region was clicked
    if (clickX <= startWidth) {
        // Click in start portion - direct mapping
        return getCaretOffsetFromX(clickX, startText, segmentElement);
    } else if (clickX <= startPlusEllipsisWidth) {
        // Click on ellipsis - map to middle of hidden text
        const relativeX = clickX - startWidth;
        const ratio = relativeX / ellipsisWidth;

        // Simple proportional mapping: map the ellipsis region to the hidden text
        const hiddenOffset = Math.round(ratio * hiddenText.length);

        return startText.length + hiddenOffset;
    } else {
        // Click in end portion - map to end text with offset
        const relativeX = clickX - startPlusEllipsisWidth;
        const endOffset = getCaretOffsetFromX(relativeX, endText, segmentElement);

        return fullText.length - endText.length + endOffset;
    }
}
