import React from "react";
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@material-ui/core";

import { Attribute } from "../../types";
import {
    CollapseExpandButton,
    MouseSelection,
    ValuesList,
    ValueTag,
} from "./components";
import { escapeRegExp, replaceAll } from "../../utils/string-operations";

import "animate.css";
import "./attribute-selector.css";

export type AttributeSelectorProps = {
    id: string;
    attribute: Attribute;
    onValuesChange: (values: string[]) => void;
};

type KeyboardSelection = {
    startIndex: number;
    endIndex: number;
};

export const AttributeSelector: React.FC<AttributeSelectorProps> = (props) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>([]);
    const [active, setActive] = React.useState<boolean>(false);
    const [alwaysOpen, setAlwaysOpen] = React.useState<boolean>(false);
    const [currentText, setCurrentText] = React.useState<string>("");
    const [inputActive, setInputActive] = React.useState<boolean>(false);
    const [inputShaking, setInputShaking] = React.useState<boolean>(false);
    const [confirmDialogOpen, setConfirmDialogOpen] =
        React.useState<boolean>(false);
    const [matchedSelection, setMatchedSelection] = React.useState<string>("");
    const [currentSelection, setCurrentSelection] = React.useState<string>("");
    const [currentKeyboardTagIndex, setCurrentKeyboardTagIndex] =
        React.useState<number>(-1);
    const [keyboardShiftTagIndex, setKeyboardShiftTagIndex] =
        React.useState<number>(-1);

    const [keyboardSelections, setKeyboardSelections] = React.useState<
        KeyboardSelection[]
    >([]);
    const [keyboardSelectionsIndex, setKeyboardSelectionsIndex] =
        React.useState<number>(0);

    const selectorRef = React.useRef<HTMLDivElement | null>(null);
    const contentRef = React.useRef<HTMLUListElement | null>(null);
    const valuesListRef = React.useRef<HTMLDivElement | null>(null);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const shakingTimer =
        React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        return () => {
            if (shakingTimer.current) {
                clearTimeout(shakingTimer.current);
            }
        };
    }, []);

    React.useEffect(() => {
        props.onValuesChange(selectedValues);
    }, [selectedValues]);

    React.useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            const eventTarget = e.target as Element;
            const domNode = (contentRef as React.RefObject<HTMLUListElement>)
                .current as HTMLUListElement;
            const valuesList = (
                valuesListRef as React.RefObject<HTMLDivElement>
            ).current as HTMLDivElement;
            if (
                (!domNode || !domNode.contains(eventTarget)) &&
                (!valuesList || !valuesList.contains(eventTarget))
            ) {
                setActive(false);
            } else {
                setActive(true);
            }
            if (contentRef.current) {
                Array.from(
                    contentRef.current.getElementsByClassName(
                        "WebvizAttributeSelector_ValueTag"
                    )
                ).forEach((child) =>
                    child.classList.remove(
                        "WebvizAttributeSelector_ValueTag--selected"
                    )
                );
            }
        };
        document.addEventListener("mousedown", handleMouseDown);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, [contentRef, valuesListRef, setActive]);

    const getMatchedValues = React.useCallback(
        (value: string): string[] => {
            return props.attribute.values.filter((v) =>
                v.match(
                    `^${replaceAll(
                        replaceAll(escapeRegExp(value), "*", ".*"),
                        "?",
                        "."
                    )}$`
                )
            );
        },
        [props.attribute]
    );

    const getMatchedSelections = React.useCallback(
        (value: string): string[] => {
            return selectedValues.filter((v) =>
                value.match(
                    `^${replaceAll(
                        replaceAll(escapeRegExp(v), "*", ".*"),
                        "?",
                        "."
                    )}$`
                )
            );
        },
        [selectedValues]
    );

    React.useEffect(() => {
        setCurrentKeyboardTagIndex(selectedValues.length);
        setKeyboardShiftTagIndex(-1);
        setKeyboardSelections([]);
        setKeyboardSelectionsIndex(0);
    }, [
        selectedValues,
        setCurrentKeyboardTagIndex,
        setKeyboardShiftTagIndex,
        setKeyboardSelections,
    ]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!active) {
                return;
            }
            if (e.key === "Delete" || e.key === "Backspace") {
                if (contentRef.current) {
                    const newValues: string[] = [];
                    Array.from(
                        contentRef.current.getElementsByClassName(
                            "WebvizAttributeSelector_ValueTag"
                        )
                    ).forEach((tag, index) => {
                        if (
                            !tag.classList.contains(
                                "WebvizAttributeSelector_ValueTag--selected"
                            )
                        ) {
                            if (index >= 0 && index < selectedValues.length) {
                                newValues.push(selectedValues.at(index) || "");
                            }
                        }
                    });
                    setSelectedValues(newValues);
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }
            } else if (e.key === "Shift") {
                setKeyboardShiftTagIndex(currentKeyboardTagIndex);
                setKeyboardSelectionsIndex(keyboardSelections.length);
            } else if (e.key === "Escape") {
                setCurrentKeyboardTagIndex(selectedValues.length);
                setKeyboardShiftTagIndex(-1);
                setKeyboardSelections([]);
                setKeyboardSelectionsIndex(0);
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            } else if (e.key === "ArrowLeft") {
                if (
                    currentKeyboardTagIndex === selectedValues.length &&
                    inputRef.current
                ) {
                    inputRef.current.blur();
                }
                const newKeyboardTagIndex = Math.max(
                    0,
                    currentKeyboardTagIndex - 1
                );
                setCurrentKeyboardTagIndex(newKeyboardTagIndex);
                if (e.shiftKey) {
                    if (keyboardSelectionsIndex < keyboardSelections.length) {
                        setKeyboardSelections([
                            ...keyboardSelections.slice(
                                0,
                                keyboardSelectionsIndex
                            ),
                            {
                                startIndex: Math.min(
                                    newKeyboardTagIndex,
                                    keyboardShiftTagIndex
                                ),
                                endIndex: Math.max(
                                    newKeyboardTagIndex,
                                    keyboardShiftTagIndex
                                ),
                            },
                        ]);
                    } else {
                        setKeyboardSelections([
                            ...keyboardSelections,
                            {
                                startIndex: Math.min(
                                    newKeyboardTagIndex,
                                    keyboardShiftTagIndex
                                ),
                                endIndex: Math.max(
                                    newKeyboardTagIndex,
                                    keyboardShiftTagIndex
                                ),
                            },
                        ]);
                    }
                }
            } else if (e.key === "ArrowRight") {
                if (
                    currentKeyboardTagIndex === selectedValues.length - 1 &&
                    inputRef.current
                ) {
                    inputRef.current.focus();
                }
                const newKeyboardTagIndex = Math.min(
                    selectedValues.length,
                    currentKeyboardTagIndex + 1
                );
                setCurrentKeyboardTagIndex(newKeyboardTagIndex);
                if (e.shiftKey) {
                    if (keyboardSelectionsIndex < keyboardSelections.length) {
                        setKeyboardSelections([
                            ...keyboardSelections.slice(
                                0,
                                keyboardSelectionsIndex
                            ),
                            {
                                startIndex: Math.min(
                                    newKeyboardTagIndex,
                                    keyboardShiftTagIndex
                                ),
                                endIndex: Math.max(
                                    newKeyboardTagIndex,
                                    keyboardShiftTagIndex
                                ),
                            },
                        ]);
                    } else {
                        setKeyboardSelections([
                            ...keyboardSelections,
                            {
                                startIndex: Math.min(
                                    newKeyboardTagIndex,
                                    keyboardShiftTagIndex
                                ),
                                endIndex: Math.max(
                                    newKeyboardTagIndex,
                                    keyboardShiftTagIndex
                                ),
                            },
                        ]);
                    }
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        active,
        selectedValues,
        inputRef.current,
        setSelectedValues,
        contentRef.current,
        inputActive,
        setCurrentKeyboardTagIndex,
        currentKeyboardTagIndex,
        setKeyboardShiftTagIndex,
        keyboardSelections,
        setKeyboardSelections,
        keyboardSelectionsIndex,
        keyboardShiftTagIndex,
    ]);

    const handleInputKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && inputRef.current) {
                if (getMatchedValues(inputRef.current.value).length > 0) {
                    setSelectedValues([
                        ...selectedValues,
                        inputRef.current.value,
                    ]);
                    inputRef.current.value = "";
                    setCurrentText("");
                } else {
                    if (shakingTimer.current) {
                        clearTimeout(shakingTimer.current);
                    }
                    setInputShaking(true);
                    shakingTimer.current = setTimeout(() => {
                        setInputShaking(false);
                    }, 300);
                }
            }
        },
        [
            selectedValues,
            inputRef.current,
            setCurrentText,
            shakingTimer.current,
            setInputShaking,
            setSelectedValues,
        ]
    );

    const handleInputKeyUp = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "ArrowDown" && inputRef.current) {
                inputRef.current.blur();
                setInputActive(false);
            }
        },
        [inputRef.current, setInputActive]
    );

    React.useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (e.target === contentRef.current) {
                const input = document.getElementById(
                    `WebvizAttributeSelector_${props.id}`
                );
                if (input) {
                    input.focus();
                    (input as HTMLInputElement).setSelectionRange(0, 0);
                    e.preventDefault();
                }
            }
        };
        if (contentRef.current) {
            contentRef.current.addEventListener("mousedown", handleMouseDown);
        }

        return () => {
            if (contentRef.current) {
                contentRef.current.removeEventListener(
                    "mousedown",
                    handleMouseDown
                );
            }
        };
    }, [contentRef.current]);

    const handleClearSelection = React.useCallback(() => {
        if (selectedValues.length > 0) {
            setSelectedValues([]);
        } else {
            setSelectedValues(props.attribute.values);
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    }, [selectedValues, setSelectedValues, inputRef.current]);

    return (
        <div className="WebvizAttributeSelector" ref={selectorRef}>
            <div className="WebvizAttributeSelector__Header">
                <label htmlFor={`WebvizAttributeSelector_${props.id}`}>
                    {props.attribute.name}
                </label>
                <CollapseExpandButton
                    expanded={alwaysOpen}
                    onToggle={(expanded: boolean) => setAlwaysOpen(expanded)}
                />
            </div>
            <MouseSelection selectorRef={selectorRef} contentRef={contentRef} />
            <ul
                className={`WebvizAttributeSelector__Content${
                    alwaysOpen
                        ? " WebvizAttributeSelector__Content--expanded"
                        : ""
                }`}
                ref={contentRef}
            >
                {selectedValues.map((value, index) => (
                    <ValueTag
                        key={value}
                        highlighted={matchedSelection === value}
                        value={value}
                        onRemove={(v) => {
                            setSelectedValues(
                                selectedValues.filter((el) => el !== v)
                            );
                        }}
                        matchedValues={getMatchedValues(value)}
                        focused={currentKeyboardTagIndex === index}
                        selected={
                            keyboardSelections.some(
                                (selection) =>
                                    index >= selection.startIndex &&
                                    index <= selection.endIndex
                            ) || currentKeyboardTagIndex === index
                        }
                    />
                ))}
                <input
                    id={`WebvizAttributeSelector_${props.id}`}
                    className={
                        inputShaking
                            ? "animate__animated animate__headShake"
                            : ""
                    }
                    ref={inputRef}
                    placeholder="Add attribute"
                    onFocus={() => {
                        setActive(true);
                        setInputActive(true);
                        setCurrentKeyboardTagIndex(selectedValues.length);
                    }}
                    value={currentText}
                    onBlur={() => setInputActive(false)}
                    onChange={(e) => setCurrentText(e.target.value)}
                    onKeyDown={(e) => handleInputKeyDown(e)}
                    onKeyUp={(e) => handleInputKeyUp(e)}
                    onMouseDown={() => {
                        setCurrentKeyboardTagIndex(selectedValues.length);
                        setKeyboardShiftTagIndex(-1);
                        setKeyboardSelections([]);
                        setKeyboardSelectionsIndex(0);
                    }}
                />
            </ul>
            <ValuesList
                open={active}
                alwaysOpen={alwaysOpen}
                values={props.attribute.values}
                contentRef={contentRef}
                valuesListRef={valuesListRef}
                onNewSelection={(selection: string[]) => {
                    setSelectedValues([
                        ...selectedValues,
                        ...selection.filter(
                            (el) => getMatchedSelections(el).length === 0
                        ),
                    ]);
                }}
                selectedValues={selectedValues}
                onClearSelection={() => handleClearSelection()}
                currentText={currentText}
                inputActive={inputActive}
                inputRef={inputRef}
                onToggleChecked={(v) => {
                    const matchedSelections = getMatchedSelections(v);
                    if (matchedSelections.length > 0) {
                        if (getMatchedValues(matchedSelections[0]).length > 1) {
                            setConfirmDialogOpen(true);
                            setMatchedSelection(matchedSelections[0]);
                            setCurrentSelection(v);
                        } else {
                            setSelectedValues(
                                selectedValues.filter((el) => el !== v)
                            );
                        }
                    } else {
                        setSelectedValues([...selectedValues, v]);
                    }
                }}
            />
            <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
            >
                <DialogTitle>Remove wildcard selector?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Unchecking this value will remove the wildcard selector
                        <span className="WebvizAttributeSelector__Dialog__Highlight">
                            {matchedSelection}
                        </span>
                        .
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setConfirmDialogOpen(false);
                            setMatchedSelection("");
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectedValues(
                                selectedValues.filter(
                                    (el) => el !== matchedSelection
                                )
                            );
                            setMatchedSelection("");
                            setConfirmDialogOpen(false);
                        }}
                    >
                        Remove
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectedValues([
                                ...selectedValues.filter(
                                    (el) => el !== matchedSelection
                                ),
                                ...getMatchedValues(matchedSelection).filter(
                                    (el) => el !== currentSelection
                                ),
                            ]);
                            setMatchedSelection("");
                            setConfirmDialogOpen(false);
                        }}
                    >
                        Expand
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
