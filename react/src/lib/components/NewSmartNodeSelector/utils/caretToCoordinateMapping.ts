export function computeTextWidth(text: string, element: HTMLElement): number {
    if (!element) return 0;

    const computedStyle = window.getComputedStyle(element);
    const span = document.createElement("span");
    span.style.font = computedStyle.font;
    span.style.whiteSpace = "pre";
    span.textContent = text;

    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);

    return width;
}

export function getCaretOffsetFromX(
    x: number,
    text: string,
    element: HTMLElement
): number {
    const computedStyle = window.getComputedStyle(element);

    const span = document.createElement("span");
    span.style.font = computedStyle.font;
    span.style.whiteSpace = "pre";
    span.style.visibility = "hidden";

    document.body.appendChild(span);

    let closestOffset = 0;
    let closestDistance = Math.abs(x);

    // Linear search for simplicity (can optimize with binary search later)
    for (let i = 0; i <= text.length; i++) {
        span.textContent = text.slice(0, i);
        const width = span.offsetWidth;
        const distance = Math.abs(x - width);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestOffset = i;
        }
    }

    document.body.removeChild(span);

    return closestOffset;
}
