import React from "react";
import { QueryTokenizer } from "../../core/TagTokenizer";
import type { Token } from "../../core/types/Token";
import type { Tag } from "../../state/type";
import { SmartNodeSelectorDataContext } from "../../SmartNodeSelector";
import { ActionType } from "../../state/actions";

export enum TagEditorKeyDownAction {
    LEAVE_LEFT,
    LEAVE_RIGHT,
    ARROW_UP,
    ARROW_DOWN,
}

export type TagEditorProps = {
    tag: Tag;
    delimiter: string;
    onChange?: (newValue: string) => void;
    onFocusedSegmentChange?: (segmentIndex: number) => void;
    onKeyDown?: (action: TagEditorKeyDownAction) => void;
    focusedSegmentIndex?: number;
    placeholder?: string;
};

const LINE_HEIGHT = 20;

const BRACKET_PAIRS = [
    { open: "(", close: ")" },
    { open: "{", close: "}" },
] as const;

/**
 * Find a GROUP or SET token that contains or is at the specified position
 */
function findGroupOrSetAtPosition(
    token: Token,
    position: number
): (Token & { type: "GROUP" | "SET" }) | null {
    // Check if this token is a GROUP or SET at the position
    if (token.type === "GROUP" || token.type === "SET") {
        if (position >= token.start && position < token.end) {
            return token as Token & { type: "GROUP" | "SET" };
        }
    }

    // Recursively search in children
    if ("children" in token && Array.isArray(token.children)) {
        for (const child of token.children) {
            const result = findGroupOrSetAtPosition(child, position);
            if (result) return result;
        }
    }

    // Check special nested structures in GROUP/SET tokens
    if (token.type === "GROUP") {
        if (
            token.openParen.start <= position &&
            position < token.openParen.end
        ) {
            return token as Token & { type: "GROUP" };
        }
        if (
            token.closeParen.start <= position &&
            position < token.closeParen.end
        ) {
            return token as Token & { type: "GROUP" };
        }
    }

    if (token.type === "SET") {
        if (
            token.openBrace.start <= position &&
            position < token.openBrace.end
        ) {
            return token as Token & { type: "SET" };
        }
        if (
            token.closeBrace.start <= position &&
            position < token.closeBrace.end
        ) {
            return token as Token & { type: "SET" };
        }
    }

    return null;
}

export function TagEditor(props: TagEditorProps) {
    const { onChange, onFocusedSegmentChange, onKeyDown } = props;

    const context = React.useContext(SmartNodeSelectorDataContext);

    const editorRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const caretRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLTextAreaElement>(null);

    const [value, setValue] = React.useState<string>(props.tag.value);
    const [prevValue, setPrevValue] = React.useState<string>(props.tag.value);
    const [caret, setCaret] = React.useState<number>(0);
    const [anchor, setAnchor] = React.useState<number>(0);
    const [isFocused, setIsFocused] = React.useState<boolean>(false);
    const [isMouseDown, setIsMouseDown] = React.useState<boolean>(false);

    const [segmentIndex, setSegmentIndex] = React.useState<number>(-1);
    const [prevFocusedSegmentIndex, setPrevFocusedSegmentIndex] =
        React.useState<number | undefined>(undefined);
    const isExternalUpdateRef = React.useRef<boolean>(false);
    const prevPropsSegmentIndexRef = React.useRef<number | undefined>(
        undefined
    );

    if (prevValue !== props.tag.value) {
        setValue(props.tag.value);
        setPrevValue(props.tag.value);
    }

    if (prevFocusedSegmentIndex !== props.focusedSegmentIndex) {
        setPrevFocusedSegmentIndex(props.focusedSegmentIndex);
    }

    React.useEffect(
        function updateSegmentIndex() {
            if (anchor !== caret) {
                setSegmentIndex(-1);
                return;
            }

            const beforeText = value.slice(0, caret);
            const segments = beforeText.split(props.delimiter);
            setSegmentIndex(segments.length - 1);
        },
        [value, caret, anchor, props.delimiter]
    );

    React.useEffect(
        function notifyAddressChange() {
            if (isFocused && segmentIndex !== -1) {
                context.dispatch({
                    type: ActionType.CHANGE_FOCUSED_ADDRESS,
                    payload: {
                        tagId: props.tag.id,
                        segmentIndex,
                        caretIndex: caret,
                    },
                });
            }
        },
        [isFocused, segmentIndex, caret, context.dispatch, props.tag.id]
    );

    React.useEffect(
        function notifyFocusedSegmentChange() {
            // Don't notify if this change was triggered by an external prop update
            if (isFocused && !isExternalUpdateRef.current) {
                onFocusedSegmentChange?.(segmentIndex);
            }
            // Reset flag after processing
            isExternalUpdateRef.current = false;
        },
        [isFocused, segmentIndex, onFocusedSegmentChange]
    );

    React.useEffect(
        function focusedAddressChangeEffect() {
            if (props.tag.id !== context.state.focusedAddress?.tagId) {
                setIsFocused(false);
                return;
            }

            setCaret(context.state.focusedAddress.caretIndex);
            setAnchor(context.state.focusedAddress.caretIndex);
        },
        [context.state.focusedAddress, props.tag.id]
    );

    React.useEffect(
        function syncCaretToFocusedSegment() {
            if (props.focusedSegmentIndex === undefined) {
                setIsFocused(false);
                return;
            }

            setIsFocused(true);

            const segments = value.split(props.delimiter);
            if (
                props.focusedSegmentIndex < 0 ||
                props.focusedSegmentIndex >= segments.length
            ) {
                return;
            }

            // Only sync if the prop actually changed (not just re-running due to other deps)
            if (
                prevPropsSegmentIndexRef.current === props.focusedSegmentIndex
            ) {
                return;
            }
            prevPropsSegmentIndexRef.current = props.focusedSegmentIndex;

            // Calculate what segment we're currently in
            const beforeText = value.slice(0, caret);
            const currentSegments = beforeText.split(props.delimiter);
            const currentSegmentIndex =
                caret === anchor ? currentSegments.length - 1 : -1;

            // If focused and already at the requested segment, don't sync
            // This prevents fighting with user's caret movements
            if (
                isFocused &&
                props.focusedSegmentIndex === currentSegmentIndex
            ) {
                return;
            }

            // Mark this as an external update to prevent notifying parent
            isExternalUpdateRef.current = true;

            const newCaret = segments.slice(0, props.focusedSegmentIndex);

            const caretPos =
                newCaret.length > 0
                    ? newCaret.join(props.delimiter).length +
                      props.delimiter.length
                    : 0;
            if (!isFocused) {
                inputRef.current?.focus();
            }
            setCaret(caretPos);
            setAnchor(caretPos);
        },
        [
            props.focusedSegmentIndex,
            value,
            props.delimiter,
            isFocused,
            caret,
            anchor,
        ]
    );

    // Tokenizer instance
    const tokenizer = React.useMemo(
        () => new QueryTokenizer(props.delimiter ?? ":"),
        [props.delimiter]
    );

    // Tokenize the current value
    const tokens = React.useMemo(() => {
        try {
            return tokenizer.tokenize(value);
        } catch (error) {
            // If tokenization fails, return a basic token structure
            return {
                type: "QUERY" as const,
                children: [],
                start: 0,
                end: value.length,
            };
        }
    }, [tokenizer, value]);

    // Compute display value with compressed segments
    const displayValue = React.useMemo(() => {
        // Only compress when tag is not focused (focusedSegmentIndex is undefined)
        if (props.focusedSegmentIndex !== undefined) {
            return value;
        }

        const segments = value.split(props.delimiter);
        const maxSegmentLength = 8; // Maximum total length for unfocused segments (aggressive compression)

        return segments
            .map((segment) => {
                // Compress all segments when tag is not focused
                if (segment.length > maxSegmentLength) {
                    // Show first 3 and last 2 characters with "..." in the middle
                    // E.g., "Data Source A" becomes "Dat...A" (8 chars total)
                    const prefixLength = 3;
                    const suffixLength = 2;
                    return (
                        segment.slice(0, prefixLength) +
                        "..." +
                        segment.slice(-suffixLength)
                    );
                }

                return segment;
            })
            .join(props.delimiter);
    }, [value, props.delimiter, props.focusedSegmentIndex]);

    // Tokenize the display value for rendering
    const displayTokens = React.useMemo(() => {
        try {
            return tokenizer.tokenize(displayValue);
        } catch (error) {
            // If tokenization fails, return a basic token structure
            return {
                type: "QUERY" as const,
                children: [],
                start: 0,
                end: displayValue.length,
            };
        }
    }, [tokenizer, displayValue]);

    const styles = React.useMemo(
        () => ({
            editor: {
                position: "relative" as const,
                height: LINE_HEIGHT,
                width: "100%",
                cursor: "text" as const,
            },
            content: {
                position: "relative" as const,
                width: "100%",
                height: "100%",
                whiteSpace: "nowrap" as const,
                fontFamily: "monospace",
                fontSize: 14,
                lineHeight: `${LINE_HEIGHT}px`,
                userSelect: "none" as const,
            },
            selection: {
                position: "absolute" as const,
                top: 0,
                height: LINE_HEIGHT,
                backgroundColor: "rgba(0, 120, 215, 0.3)",
                pointerEvents: "none" as const,
            },
            caret: {
                position: "absolute" as const,
                width: 1,
                background: "black",
                pointerEvents: "none" as const,
                animation: "blink 1s step-end infinite",
                display: isFocused ? "block" : "none",
            },
            input: {
                position: "absolute" as const,
                opacity: 0,
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                resize: "none" as const,
                border: 0,
                outline: "none",
                overflow: "hidden" as const,
            },
            placeholder: {
                position: "absolute" as const,
                color: "#999",
                top: 0,
                left: 0,
                whiteSpace: "nowrap" as const,
            },
        }),
        [isFocused]
    );

    const insertTextAtCaret = React.useCallback(
        function insertTextAtCaret(text: string) {
            const start = Math.min(caret, anchor);
            const end = Math.max(caret, anchor);
            const newValue = value.slice(0, start) + text + value.slice(end);
            const newCaret = start + text.length;
            setValue(newValue);
            setCaret(newCaret);
            setAnchor(newCaret);
        },
        [value, caret, anchor]
    );

    const moveCursor = React.useCallback(
        function moveCursor(args: {
            dx?: number;
            x?: number;
            selecting: boolean;
        }) {
            setCaret((prev) => {
                if (!args.selecting && prev === anchor) {
                    if (prev === 0 && args.dx === -1) {
                        onKeyDown?.(TagEditorKeyDownAction.LEAVE_LEFT);
                        return prev;
                    }

                    if (prev === value.length && args.dx === 1) {
                        onKeyDown?.(TagEditorKeyDownAction.LEAVE_RIGHT);
                        return prev;
                    }
                }

                const col = clamp(
                    args.x ?? prev + (args.dx ?? 0),
                    0,
                    value.length
                );
                if (!args.selecting) {
                    setAnchor(col);
                }
                return col;
            });
        },
        [value.length, onKeyDown, anchor]
    );

    const deleteSelectionIfAny = React.useCallback(
        function deleteSelectionIfAny(
            value: string,
            caret: number,
            anchor: number
        ): {
            newValue: string;
            newCaret: number;
            newAnchor: number;
            deleted: boolean;
        } {
            if (caret === anchor) {
                return {
                    newValue: value,
                    newCaret: caret,
                    newAnchor: anchor,
                    deleted: false,
                };
            }
            const start = Math.min(caret, anchor);
            const end = Math.max(caret, anchor);
            const newValue = value.slice(0, start) + value.slice(end);
            return {
                newValue,
                newCaret: start,
                newAnchor: start,
                deleted: true,
            };
        },
        []
    );

    const backspace = React.useCallback(
        function backspace() {
            const deleteSelection = deleteSelectionIfAny(value, caret, anchor);
            if (deleteSelection.deleted) {
                setValue(deleteSelection.newValue);
                setCaret(deleteSelection.newCaret);
                setAnchor(deleteSelection.newAnchor);
                return;
            }

            if (caret === 0) {
                return;
            }

            const charBefore = value[caret - 1];

            // Backspace after opening paren/brace: unwrap the group/set
            if (charBefore === "(" || charBefore === "{") {
                const groupToken = findGroupOrSetAtPosition(tokens, caret - 1);

                if (groupToken) {
                    // Check if group is empty
                    const isEmpty = groupToken.children.length === 0;

                    if (isEmpty) {
                        // Empty group: delete immediately
                        const newValue =
                            value.slice(0, groupToken.start) +
                            value.slice(groupToken.end);
                        setValue(newValue);
                        setCaret(groupToken.start);
                        setAnchor(groupToken.start);
                    } else {
                        // Non-empty group: unwrap (remove opening and closing chars)
                        const openPos = groupToken.start;
                        const closePos = groupToken.end - 1;
                        const newValue =
                            value.slice(0, openPos) +
                            value.slice(openPos + 1, closePos) +
                            value.slice(closePos + 1);
                        setValue(newValue);
                        setCaret(caret - 1);
                        setAnchor(caret - 1);
                    }
                    return;
                }
            }

            // Backspace after closing paren/brace: select group for deletion
            if (charBefore === ")" || charBefore === "{") {
                const groupToken = findGroupOrSetAtPosition(tokens, caret - 1);

                if (groupToken) {
                    // Check if already marked for deletion
                    if (groupToken.markedForDeletion) {
                        // Second backspace: delete the entire group
                        const newValue =
                            value.slice(0, groupToken.start) +
                            value.slice(groupToken.end);
                        setValue(newValue);
                        setCaret(groupToken.start);
                        setAnchor(groupToken.start);
                    } else {
                        // First backspace: mark for deletion (select)
                        setCaret(groupToken.start);
                        setAnchor(groupToken.end);
                    }
                    return;
                }
            }

            // Normal backspace
            const newValue = value.slice(0, caret - 1) + value.slice(caret);
            setValue(newValue);
            setCaret(caret - 1);
            setAnchor(caret - 1);
        },
        [
            value,
            caret,
            anchor,
            tokens,
            deleteSelectionIfAny,
            setValue,
            setCaret,
            setAnchor,
        ]
    );

    const del = React.useCallback(
        function del() {
            const deleteSelection = deleteSelectionIfAny(value, caret, anchor);
            if (deleteSelection.deleted) {
                setValue(deleteSelection.newValue);
                setCaret(deleteSelection.newCaret);
                setAnchor(deleteSelection.newAnchor);
                return;
            }

            if (caret === value.length) {
                return;
            }

            const charAfter = value[caret];

            // Delete before opening paren/brace: select group for deletion
            if (charAfter === "(" || charAfter === "{") {
                const groupToken = findGroupOrSetAtPosition(tokens, caret);

                if (groupToken) {
                    // Check if group is empty
                    const isEmpty = groupToken.children.length === 0;

                    if (isEmpty) {
                        // Empty group: delete immediately
                        const newValue =
                            value.slice(0, groupToken.start) +
                            value.slice(groupToken.end);
                        setValue(newValue);
                        setCaret(groupToken.start);
                        setAnchor(groupToken.start);
                    } else {
                        // Check if already marked for deletion
                        if (groupToken.markedForDeletion) {
                            // Second delete: delete the entire group
                            const newValue =
                                value.slice(0, groupToken.start) +
                                value.slice(groupToken.end);
                            setValue(newValue);
                            setCaret(groupToken.start);
                            setAnchor(groupToken.start);
                        } else {
                            // First delete: mark for deletion (select)
                            setCaret(groupToken.start);
                            setAnchor(groupToken.end);
                        }
                    }
                    return;
                }
            }

            // Delete before closing paren/brace: unwrap the group/set
            if (charAfter === ")" || charAfter === "}") {
                const groupToken = findGroupOrSetAtPosition(tokens, caret);

                if (groupToken) {
                    // Check if group is empty
                    const isEmpty = groupToken.children.length === 0;

                    if (isEmpty) {
                        // Empty group: delete immediately
                        const newValue =
                            value.slice(0, groupToken.start) +
                            value.slice(groupToken.end);
                        setValue(newValue);
                        setCaret(groupToken.start);
                        setAnchor(groupToken.start);
                    } else {
                        // Non-empty group: unwrap (remove opening and closing chars)
                        const openPos = groupToken.start;
                        const closePos = groupToken.end - 1;
                        const newValue =
                            value.slice(0, openPos) +
                            value.slice(openPos + 1, closePos) +
                            value.slice(closePos + 1);
                        setValue(newValue);
                        setCaret(caret);
                        setAnchor(caret);
                    }
                    return;
                }
            }

            // Normal delete
            const newValue = value.slice(0, caret) + value.slice(caret + 1);
            setValue(newValue);
            setCaret(caret);
            setAnchor(caret);
        },
        [
            value,
            caret,
            anchor,
            tokens,
            deleteSelectionIfAny,
            setValue,
            setCaret,
            setAnchor,
        ]
    );

    const handleKeyDown = React.useCallback(
        function handleKeyDown(
            event: React.KeyboardEvent<HTMLTextAreaElement>
        ) {
            const selecting = event.shiftKey;

            switch (event.key) {
                case "ArrowLeft":
                    moveCursor({ dx: -1, selecting });
                    break;
                case "ArrowRight":
                    moveCursor({ dx: 1, selecting });
                    break;
                case "ArrowUp":
                    onKeyDown?.(TagEditorKeyDownAction.ARROW_UP);
                    break;
                case "ArrowDown":
                    onKeyDown?.(TagEditorKeyDownAction.ARROW_DOWN);
                    break;
                case "Home":
                    moveCursor({ x: 0, selecting });
                    break;
                case "End":
                    moveCursor({ x: value.length, selecting });
                    break;
                case "Backspace":
                    backspace();
                    break;
                case "Delete":
                    del();
                    break;
                case "a":
                case "A":
                    if (event.ctrlKey || event.metaKey) {
                        setCaret(0);
                        setAnchor(value.length);
                        event.preventDefault();
                    }
                    break;
            }
        },
        [moveCursor, value, backspace, del, setCaret, setAnchor]
    );

    const handleInput = React.useCallback(
        function handleInput(event: React.FormEvent<HTMLTextAreaElement>) {
            const target = event.currentTarget;
            const val = target.value;
            if (val.length > 0) {
                // Check if the input is an opening bracket
                const bracketPair = BRACKET_PAIRS.find(
                    (pair) => pair.open === val
                );

                if (bracketPair) {
                    // Auto-close behavior for opening brackets/braces
                    const hasSelection = caret !== anchor;

                    if (hasSelection) {
                        // Wrap selection in the bracket pair
                        const start = Math.min(caret, anchor);
                        const end = Math.max(caret, anchor);
                        const selectedText = value.slice(start, end);
                        const wrappedText =
                            bracketPair.open + selectedText + bracketPair.close;
                        const newValue =
                            value.slice(0, start) +
                            wrappedText +
                            value.slice(end);
                        setValue(newValue);
                        setCaret(start + 1);
                        setAnchor(start + 1 + selectedText.length);
                    } else {
                        // Insert empty bracket pair and move cursor between them
                        insertTextAtCaret(bracketPair.open + bracketPair.close);
                        const start = Math.min(caret, anchor);
                        setCaret(start + 1);
                        setAnchor(start + 1);
                    }
                } else {
                    // Check if the input is a closing bracket
                    const closingBracket = BRACKET_PAIRS.find(
                        (pair) => pair.close === val
                    );

                    if (closingBracket) {
                        // Check if we're before a closing bracket/brace of the same type
                        const nextChar = value[caret];
                        if (nextChar === val) {
                            // Skip over the existing closing bracket/brace
                            setCaret(caret + 1);
                            setAnchor(caret + 1);
                        } else {
                            // Insert normally
                            insertTextAtCaret(val);
                        }
                    } else {
                        // Normal text input
                        insertTextAtCaret(val);
                    }
                }
                target.value = "";
            }
        },
        [insertTextAtCaret, caret, anchor, value, setValue, setCaret, setAnchor]
    );

    // Map caret position from actual value to display value
    const displayCaret = React.useMemo(() => {
        // When tag is focused, no compression, so caret position is unchanged
        if (props.focusedSegmentIndex !== undefined) {
            return caret;
        }

        // When tag is not focused, we don't show caret anyway, but return a safe value
        return 0;
    }, [caret, props.focusedSegmentIndex]);

    // Update caret position by measuring actual text width
    React.useEffect(
        function updateCaretPosition() {
            if (!caretRef.current || !contentRef.current) return;

            // Measure the actual width of text up to the caret position
            const textBeforeCaret = displayValue.slice(0, displayCaret);

            // Create a temporary span to measure the width
            const span = document.createElement("span");
            span.style.fontFamily = "monospace";
            span.style.fontSize = "14px";
            span.style.whiteSpace = "pre";
            span.textContent = textBeforeCaret || ""; // Empty string for position 0

            contentRef.current.appendChild(span);
            const left = span.offsetWidth;
            contentRef.current.removeChild(span);

            caretRef.current.style.left = `${left}px`;
            caretRef.current.style.top = "0";
            caretRef.current.style.height = `${LINE_HEIGHT}px`;
        },
        [displayCaret, displayValue]
    );

    // Map display position back to actual value position
    const mapDisplayPositionToActual = React.useCallback(
        function mapDisplayPositionToActual(displayPos: number): number {
            // When tag is focused, no compression, direct 1:1 mapping
            if (props.focusedSegmentIndex !== undefined) {
                return displayPos;
            }

            // When tag is not focused, map from compressed to actual position
            const segments = value.split(props.delimiter);
            const displaySegments = displayValue.split(props.delimiter);

            let actualCharCount = 0;
            let displayCharCount = 0;

            for (let i = 0; i < segments.length; i++) {
                const displaySegmentEnd =
                    displayCharCount + displaySegments[i].length;

                // Check if position is within this segment
                if (displayPos <= displaySegmentEnd) {
                    const displayOffset = displayPos - displayCharCount;

                    // If segment was compressed, map position proportionally
                    if (segments[i].length > displaySegments[i].length) {
                        // Compressed segment - map proportionally
                        const ratio =
                            segments[i].length / displaySegments[i].length;
                        const actualOffset = Math.round(displayOffset * ratio);
                        return (
                            actualCharCount +
                            Math.min(actualOffset, segments[i].length)
                        );
                    } else {
                        // Not compressed - direct mapping
                        return actualCharCount + displayOffset;
                    }
                }

                actualCharCount += segments[i].length;
                displayCharCount = displaySegmentEnd;

                // Add delimiter length if not the last segment
                if (i < segments.length - 1) {
                    actualCharCount += props.delimiter.length;
                    displayCharCount += props.delimiter.length;
                }
            }

            return value.length;
        },
        [value, displayValue, props.delimiter, props.focusedSegmentIndex]
    );

    // Helper to find character position from mouse X coordinate
    const getPositionFromMouseX = React.useCallback(
        function getPositionFromMouseX(mouseX: number): number {
            if (!contentRef.current) return 0;

            const rect = contentRef.current.getBoundingClientRect();
            const clickX = mouseX - rect.left;

            // Find closest character position by measuring text width at each position
            // Use displayValue for measurement since that's what's rendered
            let closestDisplayPosition = 0;
            let closestDistance = Math.abs(clickX);

            // Create a temporary span to measure widths
            const span = document.createElement("span");
            span.style.fontFamily = "monospace";
            span.style.fontSize = "14px";
            span.style.whiteSpace = "pre";
            contentRef.current.appendChild(span);

            for (let i = 0; i <= displayValue.length; i++) {
                span.textContent = displayValue.slice(0, i);
                const width = span.offsetWidth;
                const distance = Math.abs(clickX - width);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestDisplayPosition = i;
                }
            }

            contentRef.current.removeChild(span);

            // Map display position back to actual position
            return mapDisplayPositionToActual(closestDisplayPosition);
        },
        [displayValue, mapDisplayPositionToActual]
    );

    // Handle mouse click to position cursor
    const handleMouseDown = React.useCallback(
        function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
            if (!contentRef.current) return;

            // Focus the hidden textarea to capture keyboard input
            inputRef.current?.focus();

            const position = getPositionFromMouseX(event.clientX);
            setCaret(position);
            setAnchor(position);
            setIsMouseDown(true);

            event.preventDefault();
        },
        [getPositionFromMouseX, setCaret, setAnchor]
    );

    // Handle mouse move for drag selection
    const handleMouseMove = React.useCallback(
        function handleMouseMove(event: MouseEvent) {
            if (!isMouseDown) return;

            const position = getPositionFromMouseX(event.clientX);
            setCaret(position);
        },
        [isMouseDown, getPositionFromMouseX, setCaret]
    );

    // Handle mouse up to end drag selection
    const handleMouseUp = React.useCallback(function handleMouseUp() {
        setIsMouseDown(false);
    }, []);

    React.useEffect(
        function notifyChange() {
            onChange?.(value);
        },
        [value, onChange]
    );

    (React.useEffect(function setupMouseListeners() {
        const abortController = new AbortController();
        window.addEventListener("mousemove", handleMouseMove, {
            signal: abortController.signal,
        });
        window.addEventListener("mouseup", handleMouseUp, {
            signal: abortController.signal,
        });

        return function cleanup() {
            abortController.abort();
        };
    }),
        [handleMouseMove, handleMouseUp]);

    // Auto-focus the textarea when component mounts
    React.useEffect(function autoFocus() {
        inputRef.current?.focus();
    }, []);

    // Handle focus events
    const handleFocus = React.useCallback(function handleFocus() {
        setIsFocused(true);
    }, []);

    const handleBlur = React.useCallback(function handleBlur() {
        setIsFocused(false);
    }, []);

    // Map anchor position to display value
    const displayAnchor = React.useMemo(() => {
        // When tag is focused, no compression, so anchor position is unchanged
        if (props.focusedSegmentIndex !== undefined) {
            return anchor;
        }

        // When tag is not focused, we don't show selection anyway, but return a safe value
        return 0;
    }, [anchor, props.focusedSegmentIndex]);

    // Render selection by measuring actual text width
    const selectionStyle = React.useMemo(() => {
        if (displayCaret === displayAnchor || !contentRef.current)
            return { display: "none" };

        const start = Math.min(displayCaret, displayAnchor);
        const end = Math.max(displayCaret, displayAnchor);

        // Measure actual text widths using display value
        const span = document.createElement("span");
        span.style.fontFamily = "monospace";
        span.style.fontSize = "14px";
        span.style.whiteSpace = "pre";

        // Measure text up to selection start
        span.textContent = displayValue.slice(0, start);
        document.body.appendChild(span);
        const left = span.offsetWidth;

        // Measure text up to selection end
        span.textContent = displayValue.slice(0, end);
        const right = span.offsetWidth;
        document.body.removeChild(span);

        const width = right - left;

        return {
            ...styles.selection,
            left: `${left}px`,
            width: `${width}px`,
            display: "block",
        };
    }, [displayCaret, displayAnchor, displayValue, styles.selection]);

    return (
        <div
            ref={editorRef}
            tabIndex={0}
            style={styles.editor}
            onMouseDown={handleMouseDown}
            data-tag-id={props.tag.id}
        >
            <style>
                {`
        @keyframes blink { 50% { opacity: 0; } }
      `}
            </style>
            <div style={selectionStyle} />
            <div ref={contentRef} style={styles.content}>
                <TokenRenderer token={displayTokens} />
            </div>
            {value.length === 0 && !isFocused && (
                <div style={styles.placeholder}>
                    {props.placeholder ?? "Enter tag..."}
                </div>
            )}
            <div ref={caretRef} style={styles.caret} />
            <textarea
                ref={inputRef}
                spellCheck={false}
                style={styles.input}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
        </div>
    );
}

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}

/**
 * Token renderer component - renders tokens with syntax highlighting
 */
type TokenRendererProps = {
    token: Token;
};

function TokenRenderer({ token }: TokenRendererProps): React.ReactElement {
    switch (token.type) {
        case "TAG":
            return (
                <>
                    {token.children.map((child, index) => (
                        <TokenRenderer key={index} token={child} />
                    ))}
                </>
            );

        case "DELIMITER":
            return (
                <span style={{ color: "#0996e8ff", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "LITERAL":
            return <span style={{ color: "#000" }}>{token.value}</span>;

        case "WILDCARD":
            return (
                <span style={{ color: "#0066CC", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "DEEP_WILDCARD":
            return (
                <span style={{ color: "#0066CC", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "CHAR_WILDCARD":
            return (
                <>
                    {token.children.map((child, index) => (
                        <TokenRenderer key={index} token={child} />
                    ))}
                </>
            );

        case "CHAR_WILDCARD_LITERAL":
            return <span style={{ color: "#000" }}>{token.value}</span>;

        case "CHAR_WILDCARD_CHAR":
            return (
                <span style={{ color: "#0066CC", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "GLOB":
            return (
                <>
                    {token.children.map((child, index) => (
                        <TokenRenderer key={index} token={child} />
                    ))}
                </>
            );

        case "GLOB_LITERAL":
            return <span style={{ color: "#000" }}>{token.value}</span>;

        case "GLOB_WILDCARD":
            return (
                <span style={{ color: "#0066CC", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "GROUP":
            return (
                <>
                    <TokenRenderer token={token.openParen} />
                    {token.children.map((child, index) => (
                        <TokenRenderer key={index} token={child} />
                    ))}
                    <TokenRenderer token={token.closeParen} />
                </>
            );

        case "OPEN_PAREN":
            return (
                <span style={{ color: "#999", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "CLOSE_PAREN":
            return (
                <span style={{ color: "#999", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "SET":
            return (
                <>
                    <TokenRenderer token={token.openBrace} />
                    {token.children.map((child, index) => (
                        <TokenRenderer key={index} token={child} />
                    ))}
                    <TokenRenderer token={token.closeBrace} />
                </>
            );

        case "OPEN_BRACE":
            return (
                <span style={{ color: "#999", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "CLOSE_BRACE":
            return (
                <span style={{ color: "#999", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "UNION_OPERATOR":
            return (
                <span style={{ color: "#CC6600", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "INTERSECTION_OPERATOR":
            return (
                <span style={{ color: "#CC6600", fontWeight: "bold" }}>
                    {token.value}
                </span>
            );

        case "COMMA_OPERATOR":
            return <span style={{ color: "#CC6600" }}>{token.value}</span>;

        default:
            return <span>{String(token)}</span>;
    }
}
