/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component, Fragment, MouseEvent } from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";
import PropTypes from "prop-types";

import TreeNodeSelection from "../utils/TreeNodeSelection";
import { TreeDataNodeMetaData } from "../utils/TreeDataNodeTypes";
import { findHighestZIndex } from "../../../utils/dom";

import "./Suggestions.css";

type SuggestionsProps = {
    suggestionsRef: React.RefObject<HTMLDivElement>;
    tagInputFieldRef: React.RefObject<HTMLUListElement>;
    visible: boolean;
    useSuggestion: (
        e: globalThis.KeyboardEvent | MouseEvent<HTMLDivElement>,
        option: string
    ) => void;
    treeNodeSelection?: TreeNodeSelection;
    showAllSuggestions: boolean;
    enableInputBlur: () => void;
    disableInputBlur: () => void;
};

type SuggestionsState = {
    fromIndex: number;
};

type Option = { nodeName: string; metaData: TreeDataNodeMetaData };

/**
 * A component for showing a list of suggestions.
 */
class Suggestions extends Component<SuggestionsProps> {
    public props: SuggestionsProps;
    public state: SuggestionsState;
    public static propTypes: Record<string, unknown>;
    public static defaultProps: Partial<SuggestionsProps> = {};

    private mouseMoved: boolean;
    private currentlySelectedSuggestionIndex: number;
    private rowHeight: number;
    private upperSpacerHeight: number;
    private allOptions: Option[];
    private currentNodeLevel: number;
    private currentNodeName: string;
    private lastNodeSelection?: TreeNodeSelection;
    private positionRef: React.RefObject<HTMLDivElement>;
    private popup: HTMLDivElement | null;
    private showingAllSuggestions: boolean;

    constructor(props: SuggestionsProps) {
        super(props);

        this.props = props;
        this.mouseMoved = false;
        this.currentlySelectedSuggestionIndex = 0;
        this.rowHeight = 34;
        this.upperSpacerHeight = 0;
        this.currentNodeLevel = -1;
        this.currentNodeName = "";
        this.lastNodeSelection = props.treeNodeSelection;
        this.allOptions = [];
        this.positionRef = React.createRef();
        this.popup = null;
        this.showingAllSuggestions = false;

        this.state = {
            fromIndex: 0,
        };

        if (this.props.treeNodeSelection) {
            this.allOptions = this.props.treeNodeSelection.getSuggestions();
            this.currentNodeLevel = this.props.treeNodeSelection.getFocussedLevel();
        }
    }

    componentDidMount(): void {
        document.addEventListener(
            "mousemove",
            () => this.handleMouseMove(),
            true
        );
        document.addEventListener(
            "keydown",
            (e) => this.handleGlobalKeyDown(e),
            true
        );
        window.addEventListener("resize", () => this.renderPopup());
        window.addEventListener("scroll", () => this.renderPopup(), true);

        this.popup = document.createElement("div");
        document.body.appendChild(this.popup);
    }

    componentWillUnmount(): void {
        document.removeEventListener(
            "mousemove",
            () => this.handleMouseMove(),
            true
        );
        document.removeEventListener(
            "keydown",
            (e) => this.handleGlobalKeyDown(e),
            true
        );
        window.removeEventListener("resize", () => this.renderPopup());
        window.removeEventListener("scroll", () => this.renderPopup(), true);

        if (this.popup) {
            document.body.removeChild(this.popup);
        }
    }

    componentDidUpdate(previousProps: SuggestionsProps): void {
        const { visible, treeNodeSelection, suggestionsRef } = this.props;
        if (
            previousProps.visible != visible ||
            previousProps.treeNodeSelection != treeNodeSelection
        ) {
            this.upperSpacerHeight = 0;
            if (suggestionsRef.current) {
                (suggestionsRef.current as HTMLDivElement).scrollTop = 0;
            }
            this.currentlySelectedSuggestionIndex = 0;
            this.setState({ fromIndex: 0 });
        }

        if (this.popup) {
            this.renderPopup();
        }
    }

    private currentlySelectedSuggestion(): Element {
        return document.getElementsByClassName("Suggestions__Suggestion")[
            this.currentlySelectedSuggestionIndex - this.state.fromIndex
        ];
    }

    private maybeLoadNewOptions(): void {
        const {
            treeNodeSelection,
            suggestionsRef,
            showAllSuggestions,
        } = this.props;
        if (
            treeNodeSelection !== undefined &&
            (treeNodeSelection.getFocussedLevel() !== this.currentNodeLevel ||
                treeNodeSelection.getFocussedNodeName() !==
                    this.currentNodeName ||
                this.lastNodeSelection === undefined ||
                !treeNodeSelection.objectEquals(this.lastNodeSelection) ||
                this.props.showAllSuggestions !== this.showingAllSuggestions)
        ) {
            this.showingAllSuggestions = this.props.showAllSuggestions;
            this.allOptions = treeNodeSelection.getSuggestions(
                showAllSuggestions
            );
            this.currentNodeLevel = treeNodeSelection.getFocussedLevel();
            this.lastNodeSelection = treeNodeSelection;
            this.currentNodeName = treeNodeSelection.getFocussedNodeName();
            if (suggestionsRef.current) {
                (suggestionsRef.current as HTMLDivElement).scrollTo(0, 0);
            }
        }
    }

    private handleMouseMove(): void {
        this.mouseMoved = true;
    }

    private handleGlobalKeyDown(e: globalThis.KeyboardEvent): void {
        const { visible } = this.props;
        if (visible) {
            if (e.key === "ArrowUp") {
                this.markSuggestionAsHoveredAndMakeVisible(
                    Math.max(0, this.currentlySelectedSuggestionIndex - 1)
                );
            } else if (e.key === "ArrowDown") {
                this.markSuggestionAsHoveredAndMakeVisible(
                    Math.min(
                        this.allOptions.length - 1,
                        this.currentlySelectedSuggestionIndex + 1
                    )
                );
            }
            if (
                e.key == "Enter" &&
                this.currentlySelectedSuggestion() !== undefined
            ) {
                this.useSuggestion(
                    e,
                    this.currentlySelectedSuggestion().getAttribute(
                        "data-use"
                    ) as string
                );
            }
        }
    }

    private handleOnScroll(): void {
        const { tagInputFieldRef, suggestionsRef } = this.props;
        const maxHeight =
            window.innerHeight -
            (tagInputFieldRef.current
                ? tagInputFieldRef.current.getBoundingClientRect().bottom + 10
                : 200);
        const height = Math.min(
            maxHeight,
            this.allOptions.length * this.rowHeight
        );
        const index = Math.min(
            Math.floor(
                (suggestionsRef.current as HTMLDivElement).scrollTop /
                    this.rowHeight
            ),
            this.allOptions.length - Math.floor(height / this.rowHeight)
        );
        const remainder =
            (suggestionsRef.current as HTMLDivElement).scrollTop -
            index * this.rowHeight;
        this.upperSpacerHeight =
            (suggestionsRef.current as HTMLDivElement).scrollTop - remainder;
        this.setState({ fromIndex: index });
    }

    private maybeMarkSuggestionAsHovered(index: number): void {
        if (this.mouseMoved) {
            this.markSuggestionAsHovered(index);
        }
    }

    private markSuggestionAsHoveredAndMakeVisible(index: number): void {
        const { suggestionsRef } = this.props;
        const suggestions = suggestionsRef.current;
        if (!suggestions) return;

        const { tagInputFieldRef } = this.props;
        const maxHeight =
            window.innerHeight -
            (tagInputFieldRef.current
                ? tagInputFieldRef.current.getBoundingClientRect().bottom + 10
                : 200);

        const maxNumSuggestions = Math.min(
            Math.floor(maxHeight / this.rowHeight),
            this.allOptions.length - this.state.fromIndex
        );

        const currentRangeStart = this.state.fromIndex;
        const currentRangeEnd = this.state.fromIndex + maxNumSuggestions;

        if (index >= currentRangeStart && index <= currentRangeEnd) {
            this.markSuggestionAsHovered(index);
            this.scrollSuggestionsToMakeSelectedElementVisible();
        } else if (index < currentRangeStart) {
            this.currentlySelectedSuggestionIndex = index;
            suggestions.scroll(
                0,
                this.currentlySelectedSuggestionIndex * this.rowHeight
            );
        } else if (index > currentRangeEnd) {
            this.currentlySelectedSuggestionIndex = index;
            suggestions.scroll(
                0,
                (this.currentlySelectedSuggestionIndex + 1) * this.rowHeight -
                    maxHeight
            );
        }
    }

    private markSuggestionAsHovered(index: number): void {
        this.currentlySelectedSuggestionIndex = index;
        const newSelectedSuggestion = this.currentlySelectedSuggestion();
        const selectedSuggestions = document.getElementsByClassName(
            "Suggestions__Suggestion--Selected"
        );
        for (let i = 0; i < selectedSuggestions.length; i++) {
            selectedSuggestions[i].classList.remove(
                "Suggestions__Suggestion--Selected"
            );
        }
        newSelectedSuggestion.classList.add(
            "Suggestions__Suggestion--Selected"
        );
    }

    private scrollSuggestionsToMakeSelectedElementVisible(): void {
        const { suggestionsRef } = this.props;
        this.mouseMoved = false;
        const element = this.currentlySelectedSuggestion();
        const suggestions = suggestionsRef.current;
        if (!suggestions) return;

        const elementBoundingRect = element.getBoundingClientRect();
        const suggestionsBoundingRect = suggestions.getBoundingClientRect();

        if (elementBoundingRect.bottom > suggestionsBoundingRect.bottom) {
            suggestions.scroll(
                0,
                suggestions.scrollTop +
                    elementBoundingRect.bottom -
                    suggestionsBoundingRect.bottom
            );
        } else if (elementBoundingRect.top < suggestionsBoundingRect.top) {
            suggestions.scroll(
                0,
                suggestions.scrollTop +
                    elementBoundingRect.top -
                    suggestionsBoundingRect.top
            );
        }
    }

    private useSuggestion(
        e: globalThis.KeyboardEvent | React.MouseEvent<HTMLDivElement>,
        suggestion: string
    ): void {
        this.currentlySelectedSuggestionIndex = 0;
        this.props.useSuggestion(e, suggestion);
    }

    private decorateOption(
        option: Option,
        treeNodeSelection: TreeNodeSelection
    ): React.ReactNode {
        const regexName = RegExp(
            `^${treeNodeSelection.getFocussedNodeName()}`,
            "i"
        );
        const regexDescription = RegExp(
            `${treeNodeSelection.getFocussedNodeName()}`,
            "i"
        );
        const matchName = option.nodeName.match(regexName);
        const matchDescription = option.metaData.description?.match(
            regexDescription
        );

        const matchedNodePart = matchName
            ? option.nodeName.substring(0, matchName[0].length)
            : "";
        const unmatchedNodePart = matchName
            ? option.nodeName.substring(
                  matchName[0].length,
                  option.nodeName.length
              )
            : option.nodeName;

        const unmatchedDescriptionPartBefore = matchDescription
            ? option.metaData.description?.substring(
                  0,
                  matchDescription.index as number
              )
            : option.metaData.description;

        const matchedDescription = matchDescription
            ? option.metaData.description?.substring(
                  matchDescription.index as number,
                  (matchDescription.index as number) +
                      matchDescription[0].length
              )
            : "";

        const unmatchedDescriptionPartAfter = matchDescription
            ? option.metaData.description?.substring(
                  (matchDescription.index as number) +
                      matchDescription[0].length,
                  option.metaData.description.length
              )
            : "";

        return (
            <Fragment>
                <span className="Suggestions__Match">{matchedNodePart}</span>
                {unmatchedNodePart}
                {option.metaData.description && (
                    <>
                        - {unmatchedDescriptionPartBefore}
                        <span className="Suggestions__Match">
                            {matchedDescription}
                        </span>
                        {unmatchedDescriptionPartAfter}
                    </>
                )}
            </Fragment>
        );
    }

    private createSuggestionsForCurrentTag(
        maxHeight: number
    ): React.ReactFragment | null {
        const {
            treeNodeSelection,
            enableInputBlur,
            disableInputBlur,
        } = this.props;
        if (treeNodeSelection === undefined) return "";
        if (!treeNodeSelection.focussedNodeNameContainsWildcard()) {
            const options = this.allOptions.slice(
                this.state.fromIndex,
                this.state.fromIndex + Math.ceil(maxHeight / this.rowHeight)
            );
            return (
                <Fragment>
                    {options.map((option, i) => (
                        <div
                            key={option.nodeName}
                            onMouseEnter={(): void =>
                                this.maybeMarkSuggestionAsHovered(
                                    i + this.state.fromIndex
                                )
                            }
                            data-use={option.nodeName}
                            data-index={i}
                            className={classNames({
                                Suggestions__Suggestion: true,
                                Suggestions__Icon:
                                    option.metaData.icon !== undefined,
                                "Suggestions__Suggestion--Selected":
                                    i ==
                                    this.currentlySelectedSuggestionIndex -
                                        this.state.fromIndex,
                            })}
                            style={{
                                color:
                                    option.metaData.color !== undefined
                                        ? option.metaData.color
                                        : "inherit",
                                backgroundImage:
                                    option.metaData.icon !== undefined
                                        ? "url(" + option.metaData.icon + ")"
                                        : "none",
                                height: this.rowHeight + "px",
                            }}
                            onMouseDown={() => disableInputBlur()}
                            onMouseUp={() => enableInputBlur()}
                            onClick={(e): void => {
                                this.useSuggestion(e, option.nodeName);
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            title={`${option.nodeName} - ${option.metaData.description}`}
                        >
                            {this.decorateOption(option, treeNodeSelection)}
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className="Suggestions__NoSuggestions">
                            No options available...
                        </div>
                    )}
                </Fragment>
            );
        }
        return null;
    }

    renderPopup(): void {
        this.maybeLoadNewOptions();
        const { tagInputFieldRef, visible, suggestionsRef } = this.props;
        const maxHeight =
            window.innerHeight -
            (tagInputFieldRef.current
                ? tagInputFieldRef.current.getBoundingClientRect().bottom + 10
                : 200);
        const height = Math.min(
            maxHeight,
            this.allOptions.length * this.rowHeight
        );
        let lowerSpacerHeight =
            this.allOptions.length * this.rowHeight -
            this.upperSpacerHeight -
            Math.floor(height / this.rowHeight) * this.rowHeight;
        if (
            Math.ceil(height / this.rowHeight) ==
            this.allOptions.length - this.state.fromIndex
        ) {
            lowerSpacerHeight = 0;
        }

        const boundingRect = this.positionRef.current
            ? {
                  top:
                      this.positionRef.current.getBoundingClientRect().top +
                      window.scrollY,
                  left:
                      this.positionRef.current.getBoundingClientRect().left +
                      window.scrollX,
                  bottom:
                      this.positionRef.current.getBoundingClientRect().bottom +
                      window.scrollY,
                  right:
                      this.positionRef.current.getBoundingClientRect().right +
                      window.scrollX,
                  width: this.positionRef.current.getBoundingClientRect().width,
                  height: this.positionRef.current.getBoundingClientRect()
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

        const zIndex = this.positionRef.current
            ? findHighestZIndex(this.positionRef.current) + 1
            : 99;

        ReactDOM.render(
            <div
                ref={suggestionsRef}
                className="Suggestions"
                onScroll={(): void => this.handleOnScroll()}
                style={{
                    maxHeight: maxHeight,
                    display: visible ? "block" : "none",
                    top: boundingRect.top,
                    left: boundingRect.left,
                    width: boundingRect.width,
                    zIndex: zIndex,
                }}
            >
                <div
                    className="Suggestions__Spacer"
                    style={{
                        height: this.upperSpacerHeight + "px",
                    }}
                ></div>
                {this.createSuggestionsForCurrentTag(maxHeight)}
                <div
                    className="Suggestions__Spacer"
                    style={{
                        height: lowerSpacerHeight + "px",
                    }}
                ></div>
            </div>,
            this.popup
        );
    }

    render(): React.ReactNode {
        return (
            <div
                ref={this.positionRef}
                className="Suggestions Suggestions__Position"
            ></div>
        );
    }
}

Suggestions.propTypes = {
    /**
     * Reference to suggestions div element.
     */
    suggestionsRef: PropTypes.object.isRequired,
    /**
     * Reference to tag field.
     */
    tagInputFieldRef: PropTypes.object.isRequired,
    /**
     * Boolean stating if suggestions are visible.
     */
    visible: PropTypes.bool.isRequired,
    /**
     * Function to call when using a suggestion.
     */
    useSuggestion: PropTypes.func.isRequired,
    /**
     * Tag data object to show suggestions for.
     */
    treeNodeSelection: PropTypes.instanceOf(TreeNodeSelection),
    /**
     * Boolean stating if all suggestions for node shall be shown.
     */
    showAllSuggestions: PropTypes.bool,
    /**
     * Function for disabling input blur in parent.
     * Prevents the input field from losing focus when clicking outside on a suggestion.
     */
    disableInputBlur: PropTypes.func,
    /**
     * Function for enabling input blur in parent.
     */
    enableInputBlur: PropTypes.func,
};

export default Suggestions;
