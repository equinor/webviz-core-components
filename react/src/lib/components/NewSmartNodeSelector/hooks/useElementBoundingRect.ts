import React from "react";
import { domRectsAreEqual } from "../../../utils/geometry";

function elementIsVisible(element: HTMLElement | SVGSVGElement): boolean {
    if (element instanceof HTMLElement) {
        return !!(
            element.offsetWidth ||
            element.offsetHeight ||
            element.getClientRects().length
        );
    }
    return (
        element.getClientRects() &&
        element.getBoundingClientRect().width > 0 &&
        element.getBoundingClientRect().height > 0
    );
}

export function useElementBoundingRect(
    element: HTMLElement | SVGSVGElement | null,
    onChange?: (rect: DOMRect) => void
): DOMRect {
    const [rect, setRect] = React.useState<DOMRect>(new DOMRect(0, 0, 0, 0));

    React.useEffect(
        function onMountEffect() {
            let isHidden = false;
            let currentRect = new DOMRect(0, 0, 0, 0);
            let intersectionObserver: IntersectionObserver | null = null;

            function handlePotentialRectChange() {
                // Anytime the element's position is changing, the intersection observer must be reinitialized
                // in order to get the new correct root margin
                // https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#rootmargin
                intersectionObserver?.disconnect();

                if (element) {
                    // Using the browser's viewport as the root for the intersection observer
                    // and calculating the root margin based on the element's position
                    const rect = element.getBoundingClientRect();
                    const margins =
                        `${-Math.round(rect.top)}px ${-Math.round(rect.right)}px ` +
                        `${-Math.round(rect.bottom)}px ${-Math.round(rect.left)}px`;

                    intersectionObserver = new IntersectionObserver(
                        handlePotentialRectChange,
                        {
                            root: document.body,
                            rootMargin: margins,
                        }
                    );

                    intersectionObserver.observe(element);

                    // If element is not visible do not change size as it might be expensive to render
                    if (!isHidden && !elementIsVisible(element)) {
                        isHidden = true;
                        return;
                    }

                    isHidden = false;

                    if (domRectsAreEqual(currentRect, rect)) {
                        return;
                    }

                    currentRect = rect;

                    // Call onChange immediately before state update
                    if (onChange) {
                        onChange(rect);
                    }

                    setRect(rect);
                }
            }

            // Anytime the element's position might change,
            // the intersection observer must be reinitialized with the correct root margin.
            // Hence, we listen to resize, scroll, and mutation events.
            const resizeObserver = new ResizeObserver(
                handlePotentialRectChange
            );
            const mutationObserver = new MutationObserver(
                handlePotentialRectChange
            );
            window.addEventListener("resize", handlePotentialRectChange, true);
            window.addEventListener("scroll", handlePotentialRectChange, true);

            if (element) {
                resizeObserver.observe(document.body);
                mutationObserver.observe(element, {
                    attributes: true,
                    subtree: false,
                    childList: false,
                    attributeFilter: ["style", "class"],
                });
                handlePotentialRectChange();
            }

            return function onUnmount() {
                resizeObserver.disconnect();
                intersectionObserver?.disconnect();
                mutationObserver.disconnect();
                window.removeEventListener(
                    "resize",
                    handlePotentialRectChange,
                    true
                );
                window.removeEventListener(
                    "scroll",
                    handlePotentialRectChange,
                    true
                );
            };
        },
        [element, onChange]
    );

    return rect;
}
