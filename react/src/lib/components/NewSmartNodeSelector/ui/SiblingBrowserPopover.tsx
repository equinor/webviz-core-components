import React from "react";
import { useElementBoundingRect } from "../hooks/useElementBoundingRect";

const NUM_SIBLINGS_TO_SHOW_IN_EACH_DIRECTION = 3;
const ITEM_HEIGHT = 32;
const ANGLE_PER_STEP_DEG = 18; // rotation per item
const WHEEL_RADIUS_PX = 150; // translateZ radius

export type SiblingBrowserPopoverProps = {
    siblings: string[];
    currentIndex: number; // -1 means pattern segment (no current match)
    anchorElement: HTMLElement | null;
    onCycle: (direction: 1 | -1) => void;
};

export function SiblingBrowserPopover(
    props: SiblingBrowserPopoverProps
): React.ReactElement {
    const { siblings, currentIndex, anchorElement, onCycle } = props;

    // Get the previous n siblings, if at the top, we continue from the bottom (circular)
    const maxNumSiblingsToShow = Math.min(
        NUM_SIBLINGS_TO_SHOW_IN_EACH_DIRECTION,
        Math.floor(siblings.length / 2)
    );
    const siblingsBefore = [];
    for (let i = 1; i <= maxNumSiblingsToShow; i++) {
        const index = (currentIndex - i + siblings.length) % siblings.length;
        siblingsBefore.push(siblings[index]);
    }
    siblingsBefore.reverse();

    const visibleSiblings = maxNumSiblingsToShow * 2 + 1;

    // Get the next n siblings, if at the bottom, we continue from the top (circular)
    const siblingsAfter = [];
    for (let i = 1; i <= maxNumSiblingsToShow; i++) {
        const index = (currentIndex + i) % siblings.length;
        siblingsAfter.push(siblings[index]);
    }

    const wheelHeight = ITEM_HEIGHT * visibleSiblings * 2 + 1;

    return (
        <>
            <HalfWheel
                anchorElement={anchorElement}
                items={siblingsBefore}
                direction="up"
                wheelHeight={wheelHeight}
                onSelect={(index) => onCycle(-1)}
            />
            <HalfWheel
                anchorElement={anchorElement}
                items={siblingsAfter}
                direction="down"
                wheelHeight={wheelHeight}
                onSelect={(index) => onCycle(1)}
            />
        </>
    );
}

type HalfWheelProps = {
    anchorElement: HTMLElement | null;
    items: string[];
    wheelHeight: number;
    direction: "up" | "down";
    onSelect: (index: number) => void;
};

function HalfWheel(props: HalfWheelProps) {
    const popoverRef = React.useRef<HTMLDivElement>(null);

    const updatePosition = React.useCallback(
        function updatePosition() {
            if (!props.anchorElement || !popoverRef.current) {
                return;
            }

            const rect = props.anchorElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const margin = 1;
            const popoverWidth = 200;
            const requiredHeight =
                requiredHalfHeightPx({
                    steps: props.items.length, // for this half
                    itemHeightPx: ITEM_HEIGHT,
                    anglePerStepDeg: ANGLE_PER_STEP_DEG,
                    radiusPx: WHEEL_RADIUS_PX / 2, // we reduce the radius for half wheel to make it less tall
                }) + margin;

            const spaceBelow = viewportHeight - (rect.bottom + margin);
            const spaceAbove = rect.top - margin;

            const popoverElement = popoverRef.current;
            popoverElement.style.position = "fixed";
            popoverElement.style.left = `${rect.left + rect.width / 2 - popoverWidth / 2}px`;
            popoverElement.style.width = `${popoverWidth}px`;

            if (props.direction === "down") {
                popoverElement.style.top = `${rect.bottom + margin}px`;
                popoverElement.style.bottom = "unset";
                popoverElement.style.height = `${Math.min(spaceBelow, requiredHeight)}px`;
                popoverElement.style.maxHeight = `${Math.min(spaceBelow, requiredHeight)}px`;
            } else {
                popoverElement.style.bottom = `${viewportHeight - rect.top + margin}px`;
                popoverElement.style.top = "unset";
                popoverElement.style.height = `${Math.min(spaceAbove, requiredHeight)}px`;
                popoverElement.style.maxHeight = `${Math.min(spaceAbove, requiredHeight)}px`;
            }
        },
        [props.anchorElement, props.direction, props.wheelHeight]
    );

    React.useEffect(
        function onAnchorChange() {
            if (props.anchorElement && props.items.length > 0) {
                popoverRef.current?.showPopover();
            } else {
                popoverRef.current?.hidePopover();
            }
        },
        [props.anchorElement, props.items.length]
    );

    useElementBoundingRect(props.anchorElement, updatePosition);

    return (
        <div
            ref={popoverRef}
            popover="manual"
            data-sibling-browser-popover
            onMouseDown={(e) => e.preventDefault()}
            style={{
                boxSizing: "border-box",
                borderRadius: 4,
                border: 0,
                boxShadow: "0 2px 8px rgba(42, 42, 42, 0.15)",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(3px)",
                inset: "unset",
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <ul
                style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    flex: 1,
                    overflow: "hidden",

                    // ✅ this is the key
                    display: "flex",
                    flexDirection: "column",
                    justifyContent:
                        props.direction === "down" ? "flex-start" : "flex-end",
                }}
            >
                {props.items.map((name, index) => {
                    let offset = props.items.length - index; // up: N..1 (last nearest)
                    if (props.direction === "down") {
                        offset = -(index + 1); // down: -1..-N (first nearest)
                    }

                    const rotateX = offset * ANGLE_PER_STEP_DEG;
                    const abs = Math.abs(offset);
                    const opacity = 1 - abs * 0.05;
                    const scale = 1 - abs * 0.01;

                    return (
                        <li
                            key={index}
                            style={{
                                padding: "5px 10px",
                                cursor: "pointer",
                                backgroundColor: "transparent",
                                fontWeight: 400,
                                fontSize: "13px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                textAlign: "center",
                                transformStyle: "preserve-3d",
                                transform: `translateY(${offset * ITEM_HEIGHT}px) rotateX(${rotateX}deg) translateZ(${WHEEL_RADIUS_PX}px) scale(${scale})`,
                                opacity,
                            }}
                            title={name}
                        >
                            {name}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function requiredHalfHeightPx(params: {
    numItems: number; // props.items.length (e.g. 3)
    itemHeightPx: number; // ITEM_HEIGHT
    anglePerStepDeg: number; // ANGLE_PER_STEP_DEG
    radiusPx: number; // WHEEL_RADIUS_PX
    direction: "up" | "down";
    paddingPx?: number;
}) {
    const {
        numItems,
        itemHeightPx,
        anglePerStepDeg,
        radiusPx,
        direction,
        paddingPx = 8,
    } = params;

    const a = (anglePerStepDeg * Math.PI) / 180;

    let minY = Infinity;
    let maxY = -Infinity;

    for (let index = 0; index < numItems; index++) {
        const offset = direction === "down" ? -(index + 1) : numItems - index;

        const theta = offset * a;
        const yTotal = offset * itemHeightPx - radiusPx * Math.sin(theta);

        minY = Math.min(minY, yTotal);
        maxY = Math.max(maxY, yTotal);
    }

    return maxY - minY + itemHeightPx + paddingPx * 2;
}
