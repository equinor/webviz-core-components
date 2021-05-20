/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component, Fragment, MouseEvent } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './Suggestions.css';
import TreeNodeSelection from '../utils/TreeNodeSelection';
import { TreeDataNodeMetaData } from '../utils/TreeDataNodeTypes';

type SuggestionsProps = {
    suggestionsRef: React.RefObject<HTMLDivElement>;
    tagInputFieldRef: React.RefObject<HTMLUListElement>;
    visible: boolean;
    useSuggestion: (e: globalThis.KeyboardEvent | MouseEvent<HTMLDivElement>, option: string) => void;
    treeNodeSelection?: TreeNodeSelection;
};

type SuggestionsState = {
    fromIndex: number;
}

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
    private allOptions: { nodeName: string; metaData: TreeDataNodeMetaData }[];
    private currentNodeLevel: number;
    private currentNodeName: string;
    private lastNodeSelection?: TreeNodeSelection;

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

        this.state = {
            fromIndex: 0
        };

        if (this.props.treeNodeSelection) {
            this.allOptions = this.props.treeNodeSelection.getSuggestions();
            this.currentNodeLevel = this.props.treeNodeSelection.getFocussedLevel();
        }
    }

    componentDidMount(): void {
        document.addEventListener('mousemove', () => this.handleMouseMove(), true);
        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e), true);
    }

    componentWillUnmount(): void {
        document.removeEventListener('mousemove', () => this.handleMouseMove(), true);
        document.removeEventListener('keydown', (e) => this.handleGlobalKeyDown(e), true);
    }

    componentDidUpdate(previousProps: SuggestionsProps): void {
        const { visible, treeNodeSelection, suggestionsRef } = this.props;
        if (previousProps.visible != visible || previousProps.treeNodeSelection != treeNodeSelection) {
            this.upperSpacerHeight = 0;
            (suggestionsRef.current as HTMLDivElement).scrollTop = 0;
            this.currentlySelectedSuggestionIndex = 0;
            this.setState({ fromIndex: 0 });
        }
    }

    private currentlySelectedSuggestion(): Element {
        return (
            document.getElementsByClassName("Suggestions__Suggestion")[
            this.currentlySelectedSuggestionIndex - this.state.fromIndex
            ]
        );
    }

    private maybeLoadNewOptions(): void {
        const { treeNodeSelection, suggestionsRef } = this.props;
        if (treeNodeSelection !== undefined &&
            (
                treeNodeSelection.getFocussedLevel() != this.currentNodeLevel
                || treeNodeSelection.getFocussedNodeName() != this.currentNodeName
                || (
                    this.lastNodeSelection === undefined
                    || !treeNodeSelection.objectEquals(this.lastNodeSelection)
                )
            )
        ) {
            this.allOptions = treeNodeSelection.getSuggestions();
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
            }
            else if (e.key === "ArrowDown") {
                this.markSuggestionAsHoveredAndMakeVisible(
                    Math.min(this.allOptions.length - 1, this.currentlySelectedSuggestionIndex + 1)
                );
            }
            if (e.key == "Enter" && this.currentlySelectedSuggestion() !== undefined) {
                this.useSuggestion(
                    e,
                    this.currentlySelectedSuggestion().getAttribute("data-use") as string
                );
            }
        }
    }

    private handleOnScroll(): void {
        const { tagInputFieldRef, suggestionsRef } = this.props;
        const maxHeight = window.innerHeight - (tagInputFieldRef.current
            ? (tagInputFieldRef.current.getBoundingClientRect().bottom + 10)
            : 200);
        const height = Math.min(maxHeight, this.allOptions.length * this.rowHeight);
        const index = Math.min(
            Math.floor(
                (suggestionsRef.current as HTMLDivElement).scrollTop / this.rowHeight
            ),
            this.allOptions.length - Math.floor(height / this.rowHeight)
        );
        const remainder = (suggestionsRef.current as HTMLDivElement).scrollTop - index * this.rowHeight
        this.upperSpacerHeight = (suggestionsRef.current as HTMLDivElement).scrollTop - remainder;
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
        const maxHeight = window.innerHeight - (tagInputFieldRef.current
            ? (tagInputFieldRef.current.getBoundingClientRect().bottom + 10)
            : 200);

        const maxNumSuggestions = Math.min(Math.floor(
            maxHeight / this.rowHeight
        ), this.allOptions.length - this.state.fromIndex);

        const currentRangeStart = this.state.fromIndex;
        const currentRangeEnd = this.state.fromIndex + maxNumSuggestions;

        if (
            index >= currentRangeStart
            && index <= currentRangeEnd
        ) {
            this.markSuggestionAsHovered(index);
            this.scrollSuggestionsToMakeSelectedElementVisible();
        }
        else if (index < currentRangeStart) {
            this.currentlySelectedSuggestionIndex = index;
            suggestions.scroll(0, this.currentlySelectedSuggestionIndex * this.rowHeight);
        }
        else if (index > currentRangeEnd) {
            this.currentlySelectedSuggestionIndex = index;
            suggestions.scroll(0, (this.currentlySelectedSuggestionIndex + 1) * this.rowHeight - maxHeight);
        }
    }

    private markSuggestionAsHovered(index: number): void {
        this.currentlySelectedSuggestionIndex = index;
        const newSelectedSuggestion = this.currentlySelectedSuggestion();
        const selectedSuggestions = document.getElementsByClassName("Suggestions__Suggestion--Selected");
        for (let i = 0; i < selectedSuggestions.length; i++) {
            selectedSuggestions[i].classList.remove("Suggestions__Suggestion--Selected");
        }
        newSelectedSuggestion.classList.add("Suggestions__Suggestion--Selected");
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
            suggestions.scroll(0, suggestions.scrollTop + elementBoundingRect.bottom - suggestionsBoundingRect.bottom);
        }
        else if (elementBoundingRect.top < suggestionsBoundingRect.top) {
            suggestions.scroll(0, suggestions.scrollTop + elementBoundingRect.top - suggestionsBoundingRect.top);
        }
    }

    private useSuggestion(e: globalThis.KeyboardEvent | React.MouseEvent<HTMLDivElement>, suggestion: string): void {
        this.currentlySelectedSuggestionIndex = 0;
        this.props.useSuggestion(e, suggestion);
    }

    private decorateOption(option: string, treeNodeSelection: TreeNodeSelection): React.ReactNode {
        return (
            <Fragment>
                <span className="Suggestions__Match">{treeNodeSelection.getFocussedNodeName()}</span>
                {option.substring(treeNodeSelection.getFocussedNodeName().length)}
            </Fragment>
        )
    }

    private createSuggestionsForCurrentTag(maxHeight: number): React.ReactFragment | null {
        const { treeNodeSelection } = this.props;
        if (treeNodeSelection === undefined)
            return "";
        if (!treeNodeSelection.focussedNodeNameContainsWildcard()) {
            const options = this.allOptions.slice(
                this.state.fromIndex,
                this.state.fromIndex + Math.ceil(maxHeight / this.rowHeight)
            );
            return (<Fragment>
                {
                    options.map((option, i) => (
                        <div
                            key={option.nodeName}
                            onMouseEnter={(): void => this.maybeMarkSuggestionAsHovered(i + this.state.fromIndex)}
                            data-use={option.nodeName}
                            data-index={i}
                            className={
                                classNames(
                                    {
                                        "Suggestions__Suggestion": true,
                                        "Suggestions__Icon": option.metaData.icon !== undefined,
                                        "Suggestions__Suggestion--Selected":
                                            i == this.currentlySelectedSuggestionIndex - this.state.fromIndex
                                    }
                                )
                            }
                            style={{
                                color: (option.metaData.color !== undefined ? option.metaData.color : "inherit"),
                                backgroundImage: (
                                    option.metaData.icon !== undefined
                                        ? "url(" + option.metaData.icon + ")"
                                        : "none"
                                ),
                                height: this.rowHeight + "px"
                            }}
                            onClick={(e): void => this.useSuggestion(e, option.nodeName)}>
                            {this.decorateOption(option.nodeName, treeNodeSelection)}
                            {option.metaData.description ? ` - ${option.metaData.description}` : ""}
                        </div>
                    ))
                }</Fragment>);
        }
        return null;
    }

    render(): React.ReactNode {
        this.maybeLoadNewOptions();
        const { tagInputFieldRef, visible, suggestionsRef } = this.props;
        const maxHeight = window.innerHeight - (tagInputFieldRef.current
            ? (tagInputFieldRef.current.getBoundingClientRect().bottom + 10)
            : 200);
        const height = Math.min(maxHeight, this.allOptions.length * this.rowHeight);
        let lowerSpacerHeight =
            this.allOptions.length * this.rowHeight
            - this.upperSpacerHeight
            - Math.floor(height / this.rowHeight) * this.rowHeight;
        if (Math.ceil(height / this.rowHeight) == this.allOptions.length - this.state.fromIndex) {
            lowerSpacerHeight = 0;
        }

        return (
            <div
                ref={suggestionsRef}
                className="Suggestions"
                onScroll={(): void => this.handleOnScroll()}
                style={
                    {
                        maxHeight: maxHeight,
                        display: (visible ? "block" : "none")
                    }
                }>
                <div
                    className="Suggestions__Spacer"
                    style={{
                        height: this.upperSpacerHeight + "px"
                    }}>
                </div>
                { this.createSuggestionsForCurrentTag(maxHeight)}
                <div className="Suggestions__Spacer"
                    style={{
                        height: lowerSpacerHeight + "px"
                    }}>
                </div>
            </div >
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
    treeNodeSelection: PropTypes.instanceOf(TreeNodeSelection)
};

export default Suggestions;
