import React, { Component, Fragment, MouseEvent } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import TagDataObject from '../utils/TreeNodeSelection';
import './Suggestions.css';
import '../TagTreeSelector.css';
import TreeNodeSelection from '../utils/TreeNodeSelection';

type SuggestionsProps = {
    tagInputFieldRef: React.RefObject<HTMLInputElement>,
    visible: boolean,
    useSuggestion: (e: globalThis.KeyboardEvent | MouseEvent<HTMLDivElement>, option: string) => void,
    treeNodeSelection: TreeNodeSelection
};

/**
 * A component for showing a list of suggestions.
 */
export default class Suggestions extends Component {
    public props: SuggestionsProps;
    public static propTypes: object;
    public static defaultProps: object;

    private suggestionsList = React.createRef<HTMLDivElement>();
    private mouseMoved: boolean;
    private currentlySelectedSuggestionIndex: number;

    constructor(props: SuggestionsProps) {
        super(props);

        this.props = props;
        this.mouseMoved = false;
        this.currentlySelectedSuggestionIndex = 0;
    }

    componentDidMount(): void {
        document.addEventListener('mousemove', (e) => this.mouseMove(e), true);
        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e), true);
    }

    componentWillUnmount(): void {
        document.removeEventListener('mousemove', (e) => this.mouseMove(e), true);
        document.removeEventListener('keydown', (e) => this.handleGlobalKeyDown(e), true);
    }

    private maybeMarkSuggestionAsHovered(index: number): void {
        if (this.mouseMoved) {
            this.markSuggestionAsHovered(index);
        }
    }

    private mouseMove(e: globalThis.MouseEvent): void {
        this.mouseMoved = true;
    }

    private markSuggestionAsHovered(index: number): void {
        this.currentlySelectedSuggestionIndex = index;
        let newSelectedSuggestion = this.currentlySelectedSuggestion();
        let selectedSuggestions = document.getElementsByClassName("Suggestions__Suggestion--Selected");
        for (var i = 0; i < selectedSuggestions.length; i++) {
            selectedSuggestions[i].classList.remove("Suggestions__Suggestion--Selected");
        }
        newSelectedSuggestion.classList.add("Suggestions__Suggestion--Selected");
    }

    private useSuggestion(e: globalThis.KeyboardEvent | React.MouseEvent<HTMLDivElement>, suggestion: string): void {
        this.currentlySelectedSuggestionIndex = 0;
        this.props.useSuggestion(e, suggestion);
    }

    private scrollSuggestionsToMakeElementVisible(element: Element): void {
        this.mouseMoved = false;
        const suggestions = this.suggestionsList.current;
        if (!suggestions) return;

        const elementBoundingRect = element.getBoundingClientRect();
        const suggestionsBoundingRect = suggestions.getBoundingClientRect();

        if (elementBoundingRect.bottom > suggestionsBoundingRect.bottom)
            suggestions.scroll(0, suggestions.scrollTop + elementBoundingRect.bottom - suggestionsBoundingRect.bottom);
        else if (elementBoundingRect.top < suggestionsBoundingRect.top)
            suggestions.scroll(0, suggestions.scrollTop + elementBoundingRect.top - suggestionsBoundingRect.top);
    }

    currentlySelectedSuggestion(): Element {
        return document.getElementsByClassName("Suggestions__Suggestion")[this.currentlySelectedSuggestionIndex];
    }

    private handleGlobalKeyDown(e: globalThis.KeyboardEvent) {
        if (this.props.visible) {
            if (e.key === "ArrowUp") {
                this.markSuggestionAsHovered(Math.max(0, this.currentlySelectedSuggestionIndex - 1));
                this.scrollSuggestionsToMakeElementVisible(this.currentlySelectedSuggestion());
            }
            if (e.key === "ArrowDown") {
                this.markSuggestionAsHovered(
                    Math.min(
                        document.getElementsByClassName("Suggestions__Suggestion").length - 1,
                        this.currentlySelectedSuggestionIndex + 1
                    )
                );
                this.scrollSuggestionsToMakeElementVisible(this.currentlySelectedSuggestion());
            }
            if (e.key == "Enter" && this.currentlySelectedSuggestion() !== undefined) {
                this.useSuggestion(
                    e,
                    this.currentlySelectedSuggestion().getAttribute("data-use")
                );
            }
        }
    }

    render(): React.ReactNode {
        const { visible, tagInputFieldRef } = this.props;
        return (
            <div ref={this.suggestionsList} className="Suggestions" style={
                {
                    maxHeight: (
                        window.innerHeight - (
                            tagInputFieldRef.current ?
                                (tagInputFieldRef.current.getBoundingClientRect().bottom + 10)
                                : 200
                        )
                    ),
                    display: (visible ? "block" : "none")
                }
            }>
                {this.createSuggestionsForCurrentTag()}
            </div>
        );
    }

    createSuggestionsForCurrentTag(): React.ReactFragment | null {
        const { treeNodeSelection } = this.props;
        if (treeNodeSelection === undefined)
            return "";
        if (!treeNodeSelection.focussedNodeNameContainsWildcard()) {
            let allOptions = treeNodeSelection.availableChildNodes({
                filtered: true,
                openEnd: true
            });
            return (<Fragment>
                {
                    allOptions.map((option, i) => (
                        <div
                            key={option.name}
                            onMouseEnter={(e) => this.maybeMarkSuggestionAsHovered(i)}
                            data-use={option.name}
                            className={
                                classNames(
                                    {
                                        "Suggestions__Suggestion": true,
                                        "Suggestions__Icon": option.icon !== undefined,
                                        "Suggestions__Suggestion--Selected": i == this.currentlySelectedSuggestionIndex
                                    }
                                )
                            }
                            style={{
                                color: (option.color !== undefined ? option.color : "inherit"),
                                backgroundImage: (option.icon !== undefined ? "url(" + option.icon + ")" : "none")
                            }}
                            onClick={(e) => this.useSuggestion(e, option.name)}>
                            {option.name} - {option.description}
                        </div>
                    ))
                }</Fragment>);
        }
        return null;
    }
}

Suggestions.defaultProps = {};

Suggestions.propTypes = {
    /**
     * Reference to tag field.
     */
    tagFieldRef: PropTypes.object.isRequired,
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
    tag: PropTypes.instanceOf(TagDataObject).isRequired
};