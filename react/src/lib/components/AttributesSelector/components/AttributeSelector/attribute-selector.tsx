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
import { CollapseExpandButton, ValuesList, ValueTag } from "./components";
import { escapeRegExp, replaceAll } from "../../utils/string-operations";

import "animate.css";
import "./attribute-selector.css";

export type AttributeSelectorProps = {
    id: string;
    attribute: Attribute;
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

    return (
        <div className="WebvizAttributeSelector">
            <div className="WebvizAttributeSelector__Header">
                <label htmlFor={`WebvizAttributeSelector_${props.id}`}>
                    {props.attribute.name}
                </label>
                <CollapseExpandButton
                    expanded={alwaysOpen}
                    onToggle={(expanded: boolean) => setAlwaysOpen(expanded)}
                />
            </div>
            <ul
                className={`WebvizAttributeSelector__Content${
                    alwaysOpen
                        ? " WebvizAttributeSelector__Content--expanded"
                        : ""
                }`}
                ref={contentRef}
            >
                {selectedValues.map((value) => (
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
                    }}
                    value={currentText}
                    onBlur={() => setInputActive(false)}
                    onChange={(e) => setCurrentText(e.target.value)}
                    onKeyDown={(e) => handleInputKeyDown(e)}
                    onKeyUp={(e) => handleInputKeyUp(e)}
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
                onClearSelection={() => setSelectedValues([])}
                currentText={currentText}
                inputActive={inputActive}
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
