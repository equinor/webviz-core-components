import { ScrollArea } from "../../../../../ScrollArea";
import React from "react";
import ReactDOM from "react-dom";

import { escapeRegExp, replaceAll } from "../../../../utils/string-operations";

import "./values-list.css";

export type ValueProps = {
    checked: boolean;
    selected: boolean;
    keyboardHover: boolean;
    onClick: () => void;
    onToggleCheck: () => void;
    children: React.ReactChild;
};

const Value: React.FC<ValueProps> = (props) => {
    const handleCheckboxClick = (e: React.MouseEvent) => {
        props.onToggleCheck();
        e.preventDefault();
        e.stopPropagation();
    };
    return (
        <div
            className={`WebvizAttributesSelector__ValuesList__Value${
                props.selected
                    ? " WebvizAttributesSelector__ValuesList__Value--selected"
                    : ""
            }${
                props.keyboardHover
                    ? " WebvizAttributesSelector__ValuesList__Value--KeyboardHover"
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
                onClick={(e) => handleCheckboxClick(e)}
            ></div>
            {props.children}
        </div>
    );
};

export type ValuesListProps = {
    open: boolean;
    alwaysOpen: boolean;
    values: string[];
    selectedValues: string[];
    currentText: string;
    inputActive: boolean;
    contentRef: React.RefObject<HTMLUListElement>;
    valuesListRef: React.RefObject<HTMLDivElement>;
    inputRef: React.RefObject<HTMLInputElement>;
    onNewSelection: (selection: string[]) => void;
    onClearSelection: () => void;
    onToggleChecked: (value: string) => void;
};

type ValueSelection = {
    fromIndex: number;
    toIndex: number;
};

export const ValuesList: React.FC<ValuesListProps> = (props) => {
    const popup = React.useRef<HTMLDivElement | null>(null);
    const valuesListPositionRef = React.useRef<HTMLDivElement | null>(null);
    const [selections, setSelections] = React.useState<ValueSelection[]>([]);
    const [ctrlPressed, setCtrlPressed] = React.useState<boolean>(false);
    const [shiftPressed, setShiftPressed] = React.useState<boolean>(false);
    const [currentKeyboardHoverIndex, setCurrentKeyboardHoverIndex] =
        React.useState<number>(-2);
    const [shiftKeyboardIndex, setShiftKeyboardIndex] =
        React.useState<number>(-1);
    const [keyboardSelectionStarted, setKeyboardSelectionStarted] =
        React.useState<boolean>(false);

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
        if (!props.open) {
            setSelections([]);
            setCurrentKeyboardHoverIndex(-2);
        }
    }, [props.open, setSelections, setCurrentKeyboardHoverIndex]);

    React.useEffect(() => {
        if (!props.inputActive) {
            return;
        }
        setCurrentKeyboardHoverIndex(-2);
        if (props.currentText === "") {
            setSelections([]);
        } else {
            setSelections(
                props.values
                    .filter((v) =>
                        v.match(
                            `^${replaceAll(
                                replaceAll(
                                    escapeRegExp(props.currentText),
                                    "*",
                                    ".*"
                                ),
                                "?",
                                "."
                            )}$`
                        )
                    )
                    .map((v) => ({
                        fromIndex: props.values.indexOf(v),
                        toIndex: props.values.indexOf(v),
                    }))
            );
        }
    }, [
        props.currentText,
        setSelections,
        props.values,
        props.inputActive,
        setCurrentKeyboardHoverIndex,
    ]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                !props.open ||
                (!props.inputActive && currentKeyboardHoverIndex === -2)
            ) {
                return;
            }
            if (e.key === "Control") {
                setCtrlPressed(true);
            }
            if (e.key === "Shift") {
                setShiftPressed(true);
            }
            if (e.key === "Enter" && !props.inputActive) {
                if (currentKeyboardHoverIndex === -1) {
                    setSelections([]);
                    props.onClearSelection();
                    return;
                }
                props.onNewSelection(
                    selections.reduce(
                        (newSelection, selection) => [
                            ...newSelection,
                            ...props.values.slice(
                                selection.fromIndex,
                                selection.toIndex + 1
                            ),
                        ],
                        [] as string[]
                    )
                );
                setSelections([]);
            }
            if (e.key === "ArrowDown") {
                if (e.shiftKey) {
                    if (!keyboardSelectionStarted) {
                        if (currentKeyboardHoverIndex > -1) {
                            setShiftKeyboardIndex(
                                currentKeyboardHoverIndex + 1
                            );
                            const lastSelection =
                                selections.length > 0
                                    ? selections[selections.length - 1]
                                    : { fromIndex: -1, toIndex: -1 };
                            if (
                                currentKeyboardHoverIndex ===
                                    lastSelection.fromIndex &&
                                currentKeyboardHoverIndex ===
                                    lastSelection.toIndex
                            ) {
                                setSelections([
                                    ...selections.slice(
                                        0,
                                        selections.length - 1
                                    ),
                                    {
                                        fromIndex: currentKeyboardHoverIndex,
                                        toIndex: currentKeyboardHoverIndex,
                                    },
                                ]);
                            } else {
                                setSelections([
                                    ...selections,
                                    {
                                        fromIndex:
                                            currentKeyboardHoverIndex + 1,
                                        toIndex: currentKeyboardHoverIndex + 1,
                                    },
                                ]);
                            }
                            setKeyboardSelectionStarted(true);
                        }
                    } else {
                        setSelections([
                            ...selections.slice(0, selections.length - 1),
                            {
                                fromIndex: Math.min(
                                    shiftKeyboardIndex,
                                    currentKeyboardHoverIndex + 1
                                ),
                                toIndex: Math.max(
                                    shiftKeyboardIndex,
                                    currentKeyboardHoverIndex + 1
                                ),
                            },
                        ]);
                    }
                }
                setCurrentKeyboardHoverIndex(
                    Math.min(
                        currentKeyboardHoverIndex + 1,
                        props.values.length - 1
                    )
                );
            }
            if (e.key === "ArrowUp") {
                if (e.shiftKey) {
                    if (!keyboardSelectionStarted) {
                        if (currentKeyboardHoverIndex > -1) {
                            setShiftKeyboardIndex(
                                currentKeyboardHoverIndex - 1
                            );
                            const lastSelection =
                                selections.length > 0
                                    ? selections[selections.length - 1]
                                    : { fromIndex: -1, toIndex: -1 };
                            if (
                                currentKeyboardHoverIndex ===
                                    lastSelection.fromIndex &&
                                currentKeyboardHoverIndex ===
                                    lastSelection.toIndex
                            ) {
                                setSelections([
                                    ...selections.slice(
                                        0,
                                        selections.length - 1
                                    ),
                                    {
                                        fromIndex: currentKeyboardHoverIndex,
                                        toIndex: currentKeyboardHoverIndex,
                                    },
                                ]);
                            } else {
                                setSelections([
                                    ...selections,
                                    {
                                        fromIndex:
                                            currentKeyboardHoverIndex - 1,
                                        toIndex: currentKeyboardHoverIndex - 1,
                                    },
                                ]);
                            }
                            setKeyboardSelectionStarted(true);
                        }
                    } else {
                        setSelections([
                            ...selections.slice(0, selections.length - 1),
                            {
                                fromIndex: Math.min(
                                    shiftKeyboardIndex,
                                    currentKeyboardHoverIndex - 1
                                ),
                                toIndex: Math.max(
                                    shiftKeyboardIndex,
                                    currentKeyboardHoverIndex - 1
                                ),
                            },
                        ]);
                    }
                }
                setCurrentKeyboardHoverIndex(
                    Math.max(currentKeyboardHoverIndex - 1, -2)
                );
                if (
                    currentKeyboardHoverIndex - 1 === -2 &&
                    props.inputRef.current
                ) {
                    props.inputRef.current.focus();
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (
                !props.open ||
                (!props.inputActive && currentKeyboardHoverIndex === -2)
            ) {
                return;
            }
            if (e.key === "Control") {
                setCtrlPressed(false);
            }
            if (e.key === "Shift") {
                setShiftPressed(false);
                setShiftKeyboardIndex(-1);
                setKeyboardSelectionStarted(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
        };
    }, [
        props.open,
        setCtrlPressed,
        setShiftPressed,
        selections,
        setSelections,
        props.onNewSelection,
        currentKeyboardHoverIndex,
        setCurrentKeyboardHoverIndex,
        setShiftKeyboardIndex,
        shiftKeyboardIndex,
        keyboardSelectionStarted,
        setKeyboardSelectionStarted,
    ]);

    const handleValueClicked = React.useCallback(
        (index: number) => {
            setCurrentKeyboardHoverIndex(index);
            setKeyboardSelectionStarted(true);
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
        [
            selections,
            setSelections,
            setCurrentKeyboardHoverIndex,
            ctrlPressed,
            shiftPressed,
        ]
    );

    const valuesList = (
        maxHeight?: number,
        top?: number,
        left?: number,
        width?: number,
        open = true,
        popup = false
    ) => {
        maxHeight = maxHeight || 300;
        const height = Math.min(
            maxHeight,
            (props.values.length + (selections.length > 0 ? 2 : 1)) * 34.5
        );
        return (
            <div
                ref={props.valuesListRef}
                className={`WebvizAttributesSelector__ValuesList${
                    popup ? " WebvizAttributesSelector__ValuesList--popup" : ""
                }`}
                style={{
                    height: height,
                    display: open ? "block" : "none",
                    top: top,
                    left: left,
                    width: width,
                }}
            >
                <div
                    className={`WebvizAttributesSelector__ValuesList__Value${
                        currentKeyboardHoverIndex === -1
                            ? " WebvizAttributesSelector__ValuesList__Value--KeyboardHover"
                            : ""
                    }`}
                    onClick={() => props.onClearSelection()}
                >
                    <div
                        className={
                            "WebvizAttributesSelector__ValuesList__Value__Checkbox" +
                            " WebvizAttributesSelector__ValuesList__Value__Checkbox--indeterminate"
                        }
                    ></div>
                    Select / unselect all
                </div>
                <ScrollArea
                    height={Math.min(maxHeight, props.values.length * 34)}
                >
                    {props.values.map((value, index) => (
                        <Value
                            key={value}
                            keyboardHover={index === currentKeyboardHoverIndex}
                            checked={props.selectedValues.some((v) =>
                                value.match(
                                    `^${replaceAll(
                                        replaceAll(escapeRegExp(v), "*", ".*"),
                                        "?",
                                        "."
                                    )}$`
                                )
                            )}
                            selected={selections.some(
                                (selection) =>
                                    selection.fromIndex <= index &&
                                    selection.toIndex >= index
                            )}
                            onClick={() => handleValueClicked(index)}
                            onToggleCheck={() => props.onToggleChecked(value)}
                        >
                            {value}
                        </Value>
                    ))}
                </ScrollArea>
                {selections.length > 0 && (
                    <div className="WebvizAttributesSelector__ValuesList__Tooltip">
                        Press Enter to confirm your selection
                    </div>
                )}
            </div>
        );
    };

    React.useLayoutEffect(() => {
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
    }, [
        valuesListPositionRef.current,
        popup.current,
        props.open,
        props.valuesListRef,
        selections,
        shiftPressed,
        ctrlPressed,
        props.selectedValues,
        props.onClearSelection,
        props.onToggleChecked,
        currentKeyboardHoverIndex,
    ]);
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
