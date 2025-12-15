/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
    TagSuggestionEngine,
    type Suggestion,
    type TreeDataNode,
    type IndexedNode,
} from "./core";

export type SmartNodeSelectorProps = {
    /** Tree data to search */
    data: TreeDataNode[];

    /** Delimiter for path segments (default: ":") */
    delimiter?: string;

    /** Label for the input field */
    label?: string;

    /** Placeholder text for input */
    placeholder?: string;

    /** Initially selected tags */
    value?: string[];

    /** Callback when selected tags change */
    onChange?: (tags: string[]) => void;

    /** Callback when matched nodes change */
    onMatchesChange?: (matches: IndexedNode[]) => void;

    /** Maximum number of suggestions to show */
    maxSuggestions?: number;

    /** CSS class name for root element */
    className?: string;
};

const DEFAULT_DELIMITER = ":";
const DEFAULT_MAX_SUGGESTIONS = 10;

export function SmartNodeSelector(props: SmartNodeSelectorProps) {
    const {
        data,
        delimiter = DEFAULT_DELIMITER,
        label,
        placeholder = "Type to search...",
        value = [],
        onChange,
        onMatchesChange,
        maxSuggestions = DEFAULT_MAX_SUGGESTIONS,
        className = "",
    } = props;

    const [selectedTags, setSelectedTags] = React.useState<string[]>(value);
    const [inputValue, setInputValue] = React.useState("");
    const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const [validationError, setValidationError] = React.useState<
        string | null
    >(null);

    const inputRef = React.useRef<HTMLInputElement>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);
    const suggestionsListRef = React.useRef<HTMLUListElement>(null);
    const isSelectingRef = React.useRef(false);
    const lastExternalValueRef = React.useRef<string[]>(value);

    // Initialize engine
    const engine = React.useMemo(() => {
        const eng = new TagSuggestionEngine(delimiter);
        eng.setData(data);
        return eng;
    }, [data, delimiter]);

    // Update engine when data changes
    React.useEffect(() => {
        engine.setData(data);
    }, [engine, data]);

    // Sync with external value changes
    React.useEffect(() => {
        // Only update if external value actually changed (not from our onChange)
        if (JSON.stringify(value) !== JSON.stringify(lastExternalValueRef.current)) {
            lastExternalValueRef.current = value;
            setSelectedTags(value);
        }
    }, [value]);

    // Update suggestions when input changes
    React.useEffect(() => {
        if (!inputValue.trim()) {
            setSuggestions(engine.getSuggestions("", maxSuggestions));
            setValidationError(null);
            return;
        }

        const newSuggestions = engine.getSuggestions(
            inputValue,
            maxSuggestions
        );
        setSuggestions(newSuggestions);

        // Validate input
        const validation = engine.validate(inputValue);
        setValidationError(validation.valid ? null : (validation.message ?? null));
    }, [inputValue, engine, maxSuggestions]);

    // Show/hide popover based on focus and suggestions
    React.useEffect(() => {
        const popover = popoverRef.current;
        if (!popover) return;

        if (showSuggestions && suggestions.length > 0) {
            popover.showPopover();
        } else {
            popover.hidePopover();
        }
    }, [showSuggestions, suggestions.length]);

    // Notify parent of matches when input changes
    React.useEffect(() => {
        if (onMatchesChange && inputValue.trim()) {
            const matches = engine.getMatches(inputValue);
            onMatchesChange(matches);
        }
    }, [inputValue, engine, onMatchesChange]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
        setActiveIndex(-1);
        setShowSuggestions(true);
    };

    const handleInputFocus = () => {
        // Don't show suggestions if we're in the middle of selecting
        if (!isSelectingRef.current) {
            setShowSuggestions(true);
        }
    };

    const handleInputBlur = () => {
        // Delay to allow click on suggestion to complete
        setTimeout(() => {
            // Don't close if we're in the middle of selecting
            if (isSelectingRef.current) {
                return;
            }

            // Check if focus moved to the popover or stayed in the component
            const activeElement = document.activeElement;
            const isInsideComponent =
                inputRef.current?.contains(activeElement) ||
                popoverRef.current?.contains(activeElement);

            if (!isInsideComponent) {
                setShowSuggestions(false);
            }
        }, 200);
    };

    const selectSuggestion = (suggestion: Suggestion) => {
        isSelectingRef.current = true;

        // If the suggestion ends with delimiter, user is building a path - just update input
        if (suggestion.completedTag.endsWith(delimiter)) {
            setInputValue(suggestion.completedTag);
            setActiveIndex(-1);
            // Keep suggestions open for next segment
            setShowSuggestions(true);
            inputRef.current?.focus();
        } else {
            // Complete path - add as tag
            const newTags = [...selectedTags, suggestion.completedTag];
            setSelectedTags(newTags);
            setInputValue("");
            setValidationError(null);
            setActiveIndex(-1);
            setShowSuggestions(false);

            // Update ref before calling onChange to prevent sync loop
            lastExternalValueRef.current = newTags;
            onChange?.(newTags);

            // Don't refocus immediately - wait for state to settle
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }

        // Reset selecting flag after a brief delay
        setTimeout(() => {
            isSelectingRef.current = false;
        }, 250);
    };

    const addCurrentTag = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        // Validate before adding
        const validation = engine.validate(trimmed);
        if (!validation.valid) {
            setValidationError(validation.message ?? null);
            return;
        }

        const newTags = [...selectedTags, trimmed];
        setSelectedTags(newTags);
        setInputValue("");
        setValidationError(null);

        // Update ref before calling onChange to prevent sync loop
        lastExternalValueRef.current = newTags;
        onChange?.(newTags);
    };

    const removeTag = (tagToRemove: string) => {
        const newTags = selectedTags.filter((tag) => tag !== tagToRemove);
        setSelectedTags(newTags);

        // Update ref before calling onChange to prevent sync loop
        lastExternalValueRef.current = newTags;
        onChange?.(newTags);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                setActiveIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;

            case "ArrowUp":
                event.preventDefault();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;

            case "Enter":
                event.preventDefault();
                if (activeIndex >= 0 && suggestions[activeIndex]) {
                    selectSuggestion(suggestions[activeIndex]);
                } else if (inputValue.trim()) {
                    addCurrentTag();
                }
                break;

            case "Escape":
                event.preventDefault();
                setShowSuggestions(false);
                setActiveIndex(-1);
                break;

            case "Backspace":
                if (inputValue === "" && selectedTags.length > 0) {
                    removeTag(selectedTags[selectedTags.length - 1]);
                }
                break;
        }
    };

    // Scroll active suggestion into view
    React.useEffect(() => {
        if (activeIndex >= 0 && suggestionsListRef.current) {
            const activeElement = suggestionsListRef.current.children[
                activeIndex
            ] as HTMLElement;
            activeElement?.scrollIntoView({
                block: "nearest",
                behavior: "smooth",
            });
        }
    }, [activeIndex]);

    const activeDescendantId =
        activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined;

    return (
        <div className={`smart-node-selector ${className}`.trim()}>
            {label && (
                <label
                    htmlFor="smart-node-input"
                    className="sns-label"
                    style={{ display: "block", marginBottom: "4px" }}
                >
                    {label}
                </label>
            )}

            <div
                className="sns-input-area"
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px",
                    padding: "4px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    minHeight: "38px",
                    alignItems: "center",
                }}
            >
                <div
                    className="sns-selected-tags"
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px",
                    }}
                >
                    {selectedTags.map((tag, index) => (
                        <span
                            className="sns-tag-chip"
                            key={`${tag}-${index}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 8px",
                                backgroundColor: "#e0e0e0",
                                borderRadius: "12px",
                                fontSize: "14px",
                            }}
                        >
                            <span className="sns-tag-text">{tag}</span>
                            <button
                                type="button"
                                className="sns-tag-remove"
                                onClick={() => removeTag(tag)}
                                aria-label={`Remove ${tag}`}
                                style={{
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    padding: "0 2px",
                                    fontSize: "18px",
                                    lineHeight: "1",
                                    color: "#666",
                                }}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>

                <input
                    ref={inputRef}
                    id="smart-node-input"
                    type="text"
                    className="sns-input"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-controls="sns-suggestions-popover"
                    aria-expanded={showSuggestions}
                    aria-activedescendant={activeDescendantId}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    style={{
                        anchorName: "--sns-input-anchor",
                        border: "none",
                        outline: "none",
                        flex: "1",
                        minWidth: "120px",
                        fontSize: "14px",
                        padding: "4px",
                    } as React.CSSProperties}
                />
            </div>

            {validationError && (
                <div
                    className="sns-validation-error"
                    role="alert"
                    style={{
                        marginTop: "4px",
                        padding: "4px 8px",
                        backgroundColor: "#fee",
                        color: "#c33",
                        fontSize: "12px",
                        borderRadius: "4px",
                    }}
                >
                    {validationError}
                </div>
            )}

            <div
                ref={popoverRef}
                id="sns-suggestions-popover"
                // @ts-ignore - popover is not yet in React types
                popover="manual"
                className="sns-suggestions-popover"
                style={
                    {
                        positionAnchor: "--sns-input-anchor",
                        position: "absolute",
                        top: "anchor(bottom)",
                        left: "anchor(left)",
                        width: "anchor-size(width)",
                        margin: "4px 0 0 0",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        backgroundColor: "#fff",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        maxHeight: "300px",
                        overflow: "auto",
                    } as React.CSSProperties
                }
            >
                <ul
                    ref={suggestionsListRef}
                    className="sns-suggestions-list"
                    role="listbox"
                    style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                    }}
                >
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={`${suggestion.completedTag}-${index}`}
                            id={`suggestion-${index}`}
                            className={`sns-suggestion ${
                                index === activeIndex ? "sns-active" : ""
                            } sns-suggestion-${suggestion.type}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            onClick={() => selectSuggestion(suggestion)}
                            style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                backgroundColor:
                                    index === activeIndex ? "#f0f0f0" : "transparent",
                                borderBottom: "1px solid #eee",
                            }}
                        >
                            <div
                                className="sns-suggestion-text"
                                style={{ fontSize: "14px", fontWeight: 500 }}
                            >
                                {suggestion.displayText}
                            </div>
                            {suggestion.metadata?.description && (
                                <div
                                    className="sns-suggestion-description"
                                    style={{
                                        fontSize: "12px",
                                        color: "#666",
                                        marginTop: "2px",
                                    }}
                                >
                                    {suggestion.metadata.description}
                                </div>
                            )}
                            {suggestion.metadata?.nodeCount !== undefined && (
                                <div
                                    className="sns-suggestion-count"
                                    style={{
                                        fontSize: "11px",
                                        color: "#999",
                                        marginTop: "2px",
                                    }}
                                >
                                    {suggestion.metadata.nodeCount} matches
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
