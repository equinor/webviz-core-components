import { ScrollArea } from "../../../../../ScrollArea";
import React from "react";
import ReactDOM from "react-dom";

import "./values-list.css";

export type ValueProps = {
    checked: boolean;
    selected: boolean;
    onClick: () => void;
    children: React.ReactChild;
};

const Value: React.FC<ValueProps> = (props) => {
    return (
        <div
            className={`WebvizAttributesSelector__ValuesList__Value${
                props.selected
                    ? " WebvizAttributesSelector__ValuesList__Value--selected"
                    : ""
            }`}
            onClick={() => props.onClick()}
        >
            <div
                className={`WebvizAttributesSelector__ValuesList__Value__Checkbox${
                    props.checked
                        ? " WebvizAttributesSelector__ValuesList__Value__Checkbox--checked"
                        : ""
                }`}
            ></div>
            {props.children}
        </div>
    );
};

export type ValuesListProps = {
    open: boolean;
    alwaysOpen: boolean;
    values: string[];
    contentRef: React.RefObject<HTMLUListElement>;
};

type ValueSelection = {
    fromIndex: number;
    toIndex: number;
};

export const ValuesList: React.FC<ValuesListProps> = (props) => {
    const popup = React.useRef<HTMLDivElement | null>(null);
    const valuesListPositionRef = React.useRef<HTMLDivElement | null>(null);
    const [selections, setSelections] = React.useState<ValueSelection[]>([]);
    const [lastSelectedIndex, setLastSelectedIndex] =
        React.useState<number>(-1);
    const [ctrlPressed, setCtrlPressed] = React.useState<boolean>(false);
    const [shiftPressed, setShiftPressed] = React.useState<boolean>(false);

    React.useEffect(() => {
        popup.current = document.createElement("div");
        document.body.appendChild(popup.current);

        return () => {
            if (popup.current) {
                document.body.removeChild(popup.current);
                popup.current = null;
            }
        };
    }, []);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Control") {
                setCtrlPressed(true);
            }
            if (e.key === "Shift") {
                setShiftPressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Control") {
                setCtrlPressed(false);
            }
            if (e.key === "Shift") {
                setShiftPressed(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
        };
    }, [setCtrlPressed, setShiftPressed]);

    const handleValueClicked = React.useCallback(
        (index: number) => {
            if (ctrlPressed) {
                if (
                    selections.some(
                        (selection) =>
                            selection.fromIndex <= index &&
                            selection.toIndex >= index
                    )
                ) {
                    setSelections(
                        selections.reduce(
                            (
                                previousArray: ValueSelection[],
                                currentValue: ValueSelection
                            ) => {
                                if (
                                    currentValue.fromIndex === index &&
                                    currentValue.toIndex === index
                                ) {
                                    return previousArray;
                                } else if (currentValue.fromIndex === index) {
                                    return [
                                        ...previousArray,
                                        {
                                            fromIndex:
                                                currentValue.fromIndex + 1,
                                            toIndex: currentValue.toIndex,
                                        },
                                    ];
                                } else if (currentValue.toIndex === index) {
                                    return [
                                        ...previousArray,
                                        {
                                            fromIndex: currentValue.fromIndex,
                                            toIndex: currentValue.toIndex - 1,
                                        },
                                    ];
                                } else if (
                                    currentValue.fromIndex <= index &&
                                    currentValue.toIndex >= index
                                ) {
                                    return [
                                        ...previousArray,
                                        {
                                            fromIndex: currentValue.fromIndex,
                                            toIndex: index - 1,
                                        },
                                        {
                                            fromIndex: index + 1,
                                            toIndex: currentValue.toIndex,
                                        },
                                    ];
                                }
                                return [...previousArray, currentValue];
                            },
                            []
                        )
                    );
                } else {
                    setSelections([
                        ...selections,
                        { fromIndex: index, toIndex: index },
                    ]);
                }
            } else if (shiftPressed) {
                const lastSelection = selections[selections.length - 1];
                if (index <= lastSelection.toIndex) {
                    setSelections([
                        ...selections.slice(0, selections.length - 1),
                        { fromIndex: index, toIndex: lastSelection.toIndex },
                    ]);
                } else {
                    setSelections([
                        ...selections.slice(0, selections.length - 1),
                        { fromIndex: lastSelection.fromIndex, toIndex: index },
                    ]);
                }
            } else {
                setSelections([{ fromIndex: index, toIndex: index }]);
            }
        },
        [selections, setSelections, ctrlPressed, shiftPressed]
    );

    React.useEffect(() => {
        console.log(selections);
    }, [selections]);

    const valuesList = React.useCallback(
        (
            maxHeight?: number,
            top?: number,
            left?: number,
            width?: number,
            open = true,
            popup = false
        ) => {
            maxHeight = maxHeight || 300;
            const height = Math.min(maxHeight, (props.values.length + 1) * 34);
            return (
                <div
                    className={`WebvizAttributesSelector__ValuesList${
                        popup
                            ? " WebvizAttributesSelector__ValuesList--popup"
                            : ""
                    }`}
                    style={{
                        height: height,
                        display: open ? "block" : "none",
                        top: top,
                        left: left,
                        width: width,
                    }}
                >
                    <ScrollArea>
                        <div className="WebvizAttributesSelector__ValuesList__Value">
                            <div
                                className={
                                    "WebvizAttributesSelector__ValuesList__Value__Checkbox" +
                                    " WebvizAttributesSelector__ValuesList__Value__Checkbox--indeterminate"
                                }
                            ></div>
                            Select / unselect all
                        </div>
                        {props.values.map((value, index) => (
                            <Value
                                key={value}
                                checked={false}
                                selected={selections.some(
                                    (selection) =>
                                        selection.fromIndex <= index &&
                                        selection.toIndex >= index
                                )}
                                onClick={() => handleValueClicked(index)}
                            >
                                {value}
                            </Value>
                        ))}
                    </ScrollArea>
                </div>
            );
        },
        [selections, ctrlPressed, shiftPressed]
    );

    React.useEffect(() => {
        const renderValuesList = () => {
            if (valuesListPositionRef.current && popup.current) {
                const maxHeight =
                    window.innerHeight -
                    (props.contentRef.current
                        ? props.contentRef.current.getBoundingClientRect()
                              .bottom + 10
                        : 200);

                const boundingRect = valuesListPositionRef.current
                    ? {
                          top:
                              valuesListPositionRef.current.getBoundingClientRect()
                                  .top + window.scrollY,
                          left:
                              valuesListPositionRef.current.getBoundingClientRect()
                                  .left + window.scrollX,
                          bottom:
                              valuesListPositionRef.current.getBoundingClientRect()
                                  .bottom + window.scrollY,
                          right:
                              valuesListPositionRef.current.getBoundingClientRect()
                                  .right + window.scrollX,
                          width: valuesListPositionRef.current.getBoundingClientRect()
                              .width,
                          height: valuesListPositionRef.current.getBoundingClientRect()
                              .height,
                      }
                    : {
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          width: 0,
                          height: 0,
                      };
                ReactDOM.render(
                    valuesList(
                        maxHeight,
                        boundingRect.top,
                        boundingRect.left,
                        boundingRect.width,
                        props.open && !props.alwaysOpen,
                        true
                    ),
                    popup.current
                );
            }
        };

        window.addEventListener("resize", () => renderValuesList());
        window.addEventListener("scroll", () => renderValuesList(), true);
        renderValuesList();

        return () => {
            window.removeEventListener("resize", () => renderValuesList());
            window.removeEventListener(
                "scroll",
                () => renderValuesList(),
                true
            );
        };
    }, [valuesListPositionRef.current, popup.current, props.open]);
    return (
        <>
            <div
                ref={valuesListPositionRef}
                className="WebvizAttributesSelector__ValuesList WebvizAttributesSelector__ValuesList__Position"
            ></div>
            {props.alwaysOpen && valuesList()}
        </>
    );
};
