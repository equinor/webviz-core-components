export const findHighestZIndex = (element: Element): number => {
    let currentElement: Element | null = element;
    let highestZIndex = 0;
    while (currentElement) {
        const currentZIndex = parseInt(
            window.getComputedStyle(currentElement, null).zIndex
        );
        if (!isNaN(currentZIndex)) {
            highestZIndex = Math.max(highestZIndex, currentZIndex);
        }
        currentElement = currentElement.parentElement;
    }
    return highestZIndex;
};
