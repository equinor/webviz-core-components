import React, { Component, Fragment } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import TagDataObject from '../utils/TagDataObject';
import './Suggestions.css';
import '../TagTreeSelector.css';

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

/**
 * A component for showing a list of suggestions.
 */
export default class Suggestions extends Component {
    constructor(props) {
        super();

        this.props = props;
        this.__suggestionsList = React.createRef();
        this.__mouseMoved = false;
        this.__currentlySelectedSuggestionIndex = 0;
    }

    componentDidMount() {
        document.addEventListener('mousemove', (e) => this.mouseMove(e), true);
        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e), true);
    }

    componentWillUnmount() {
        document.removeEventListener('mousemove', (e) => this.mouseMove(e), true);
        document.removeEventListener('keydown', (e) => this.handleGlobalKeyDown(e), true);
    }

    maybeMarkSuggestionAsHovered(index) {
        if (this.__mouseMoved) {
            this.markSuggestionAsHovered(index);
        }
    }

    mouseMove(e) {
        this.__mouseMoved = true;
    }

    markSuggestionAsHovered(index) {
        this.__currentlySelectedSuggestionIndex = index;
        let newSelectedSuggestion = this.currentlySelectedSuggestion();
        let selectedSuggestions = document.getElementsByClassName("Suggestions__Suggestion--Selected");
        for (var i = 0; i < selectedSuggestions.length; i++) {
            selectedSuggestions[i].classList.remove("Suggestions__Suggestion--Selected");
        }
        newSelectedSuggestion.classList.add("Suggestions__Suggestion--Selected");
    }

    useSuggestion(e, suggestion) {
        this.__currentlySelectedSuggestionIndex = 0;
        this.props.useSuggestion(e, suggestion);
    }

    scrollSuggestionsToMakeElementVisible(element) {
        this.__mouseMoved = false;
        const suggestions = this.__suggestionsList.current;
        if (!suggestions) return;

        const elementBoundingRect = element.getBoundingClientRect();
        const suggestionsBoundingRect = suggestions.getBoundingClientRect();

        if (elementBoundingRect.bottom > suggestionsBoundingRect.bottom)
            suggestions.scroll(0, suggestions.scrollTop + elementBoundingRect.bottom - suggestionsBoundingRect.bottom);
        else if (elementBoundingRect.top < suggestionsBoundingRect.top)
            suggestions.scroll(0, suggestions.scrollTop + elementBoundingRect.top - suggestionsBoundingRect.top);
    }

    currentlySelectedSuggestion() {
        return document.getElementsByClassName("Suggestions__Suggestion")[this.__currentlySelectedSuggestionIndex];
    }

    handleGlobalKeyDown(e) {
        if (this.props.visible) {
            if (e.key === "ArrowUp") {
                this.markSuggestionAsHovered(Math.max(0, this.__currentlySelectedSuggestionIndex - 1));
                this.scrollSuggestionsToMakeElementVisible(this.currentlySelectedSuggestion());
            }
            if (e.key === "ArrowDown") {
                this.markSuggestionAsHovered(
                    Math.min(
                        document.getElementsByClassName("Suggestions__Suggestion").length - 1,
                        this.__currentlySelectedSuggestionIndex + 1
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

    render() {
        const { visible, tagFieldRef } = this.props;
        return (
            <div ref={this.__suggestionsList} className="Suggestions" style={
                {
                    maxHeight: (
                        window.innerHeight - (
                            tagFieldRef.current ?
                                (tagFieldRef.current.getBoundingClientRect().bottom + 10)
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

    maybeMarkSuggestionAsHovered(index) {
        if (this.__mouseMoved) {
            this.markSuggestionAsHovered(index);
        }
    }

    createSuggestionsForCurrentTag() {
        var tag = this.props.tag;
        if (tag === undefined)
            return "";
        if (!tag.currentValueContainsWildcard()) {
            let allOptions = tag.availableData(true, true);
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
                                        "Suggestions__Suggestion--Selected": i == this.__currentlySelectedSuggestionIndex
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
        return "";
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