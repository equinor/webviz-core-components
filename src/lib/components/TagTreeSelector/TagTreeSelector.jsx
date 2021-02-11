import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './TagTreeSelector.css';
import TagDataObject from './utils/TagDataObject';
import Suggestions from './sub-components/Suggestions.react'
import Tag from './sub-components/Tag.react'

var DirectionEnums = Object.freeze({
    "Left": 0,
    "Right": 1
});

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

/**
 * TagTreeSelector is a component that allows to create tags by selecting data from a tree structure.
 * The tree structure can also provide meta data that is displayed as color or icon.
 */
export default class TagTreeSelector extends Component {
    constructor(props) {
        super();

        this.suggestionTimer = undefined;
        this.suggestions = React.createRef();
        this.refNumberOfTags = React.createRef();
        this.tagFieldRef = React.createRef();
        this.mouseButtonDown = false;
        this.mouseDownPosition = [0, 0];
        this.selectionHasStarted = false;
        this.firstSelectedTagIndex = -1;
        this.lastSelectedTagIndex = -1;
        this.currentSelectionDirection = 0;
        this.mouseMoved = false;
        this.clipboardData = undefined;
        this.noUserInputSelect = false;
        this.mouseDownElement = undefined;
        this.props = props;

        let tags = [];
        if (props.value !== undefined) {
            for (let tag of props.value) {
                let data = tag.split(this.props.delimiter);
                tags.push(new TagDataObject({
                    data: data,
                    activeDataIndex: data.length - 1,
                    props: props
                }));
            }
        }
        if (tags.length < props.maxTags)
            tags.push(this.createNewTag());

        this.state = {
            tags: tags,
            currentTagIndex: 0,
            suggestionsVisible: false
        };
    }

    componentDidMount() {
        document.addEventListener('click', (e) => this.handleClickOutside(e), true);
        document.addEventListener('mouseup', (e) => this.mouseUp(e), true);
        document.addEventListener('mousemove', (e) => this.mouseMove(e), true);
        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e), true);
    }

    componentWillUnmount() {
        document.removeEventListener('click', (e) => this.handleClickOutside(e), true);
        document.removeEventListener('mouseup', (e) => this.mouseUp(e), true);
        document.removeEventListener('mousemove', (e) => this.mouseMove(e), true);
        document.removeEventListener('keydown', (e) => this.handleGlobalKeyDown(e), true);
    }

    componentDidUpdate() {
        this.maybeShowSuggestions();
    }

    createNewTag() {
        return new TagDataObject({ props: this.props });
    }

    letMaxTagsBlink() {
        var numBlinks = 0;
        var blinkTimer = setInterval(() => {
            numBlinks++;
            if (numBlinks % 2 == 0) {
                this.refNumberOfTags.current.classList.add("TagTreeSelector__Warning");
            } else {
                this.refNumberOfTags.current.classList.remove("TagTreeSelector__Warning");
            }
            if (numBlinks === 7) {
                clearInterval(blinkTimer);
            }
        }, 200)
    }

    updateState({
        tags = undefined,
        currentTagIndex = undefined,
        suggestionsVisible = undefined,
        callback = () => { }
    }) {
        const newTags = tags === undefined ? this.state.tags : tags;
        const newTagIndex = currentTagIndex === undefined ? this.state.currentTagIndex : currentTagIndex;
        const newSuggestionsVisible = suggestionsVisible === undefined ? this.state.suggestionsVisible : suggestionsVisible;
        this.setState({ tags: newTags, currentTagIndex: newTagIndex, suggestionsVisible: newSuggestionsVisible }, callback);
        this.makeValues();
    }

    isCurrentTagValid() {
        return (this.currentTagIndex() >= 0 && this.currentTag().isValid());
    }

    maybeShowSuggestions() {
        if (this.suggestionTimer)
            clearTimeout(this.suggestionTimer);
        if (!this.isCurrentTagValid()) {
            this.suggestionTimer = setTimeout(() => this.showSuggestions(), 1500);
        }
    }

    hideSuggestions() {
        clearTimeout(this.suggestionTimer);
        this.updateState({ suggestionsVisible: false });
    }

    showSuggestions() {
        if (!document.activeElement || this.currentTagIndex() < 0) return;
        if (this.currentTag().ref() === document.activeElement)
            this.updateState({ suggestionsVisible: true });
    }

    unselectAllTags({
        newCurrentTagIndex = undefined,
        showSuggestions = false,
        focusInput = false
    }) {
        this.state.tags.forEach((tag) => tag.unselect());
        this.updateState({
            currentTagIndex: newCurrentTagIndex === undefined ? this.countTags() - 1 : newCurrentTagIndex,
            callback: () => {
                if (showSuggestions)
                    this.maybeShowSuggestions();
                if (focusInput)
                    this.focusCurrentTag();
            }
        });
    }

    checkIfDuplicate(tag, index) {
        let duplicateTags = this.state.tags.filter((entry, i) =>
            (i < index && entry.contains(tag))
        );
        return duplicateTags.length > 0;
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this);

        if (!domNode || !domNode.contains(event.target)) {
            this.hideSuggestions();
            if (!this.selectionHasStarted) {
                this.unselectAllTags({});

                this.updateState({ currentTagIndex: -1 });
            }
            this.selectionHasStarted = false;
        }
    }

    mouseUp(e) {
        this.mouseButtonDown = false;
        document.body.classList.remove("TagTreeSelector__unselectable");
        if (this.countSelectedTags() > 0) {
            this.hideSuggestions();
            if (document.activeElement) {
                document.activeElement.blur();
            }
            e.stopPropagation();
            e.preventDefault();
        }
    }

    mouseDown(e) {
        this.mouseDownElement = e.target;
        this.mouseDownPosition = [e.clientX, e.clientY];
        if (this.countSelectedTags() > 0) {
            this.unselectAllTags({});
            e.stopPropagation();
        }
        else {
            this.mouseButtonDown = true;
        }
    }

    selectedTags() {
        return this.state.tags.filter((tag) => tag.selected());
    }

    countSelectedTags() {
        return this.selectedTags().length;
    }

    handleGlobalKeyDown(e) {
        this.handleTagSelection(e);
        if ((e.key === "Backspace" || e.key === "Delete") && this.countSelectedTags() > 0) {
            this.removeSelectedTags();
        }
        else if (e.key === "c" && e.ctrlKey) {
            this.copyAllSelectedTags();
        }
    }

    copyAllSelectedTags() {
        const selectedTags = this.selectedTags();
        this.clipboardData = selectedTags;
    }

    canAddTag() {
        return this.countValidTags() < this.props.maxTags || this.props.maxTags == -1;
    }

    pasteTags(e) {
        if (this.clipboardData === undefined) return;
        let tags = this.clipboardData;
        if (tags && tags.length > 0) {
            let newTags = this.state.tags;
            if (this.lastTag().isEmpty()) {
                newTags.pop();
            }
            for (let tag of tags) {
                if (newTags.length < this.props.maxTags) {
                    newTags.push(tag.clone());
                }
            }
            if (newTags.length < this.props.maxTags)
                newTags.push(this.createNewTag());
            this.updateState({
                tags: newTags, currentTagIndex: newTags.length - 1, suggestionsVisible: false, callback: () => {
                    this.unselectAllTags({});
                }
            });
        }
        e.preventDefault();
    }

    removeSelectedTags() {
        let newTags = this.state.tags.filter((tag) => !tag.selected());
        const numRemovedTags = this.countTags() - newTags.length;
        let newTagIndex = this.currentTagIndex();
        if (newTagIndex >= this.firstSelectedTagIndex) {
            newTagIndex = Math.max(0, newTagIndex - numRemovedTags);
        }
        if (newTags.length == 0 || !this.hasLastEmptyTag()) {
            newTags = [...newTags, this.createNewTag()];
        }
        this.updateState({ tags: newTags, currentTagIndex: newTagIndex, suggestionsVisible: false, callback: () => this.focusCurrentTag() });
    }

    handleTagSelection(e) {
        if (e.shiftKey) {
            if (this.countSelectedTags() > 0) {
                let selectionChanged = false;
                if (e.key === "ArrowLeft") {
                    if (this.currentSelectionDirection == DirectionEnums.Left) {
                        this.firstSelectedTagIndex = Math.max(0, this.firstSelectedTagIndex - 1);
                    } else {
                        this.lastSelectedTagIndex = this.lastSelectedTagIndex - 1;
                    }
                    selectionChanged = true;
                }
                else if (e.key === "ArrowRight") {
                    if (this.currentSelectionDirection == DirectionEnums.Left) {
                        this.firstSelectedTagIndex = this.firstSelectedTagIndex + 1;
                    } else {
                        this.lastSelectedTagIndex = Math.min(this.countTags() - 1, this.lastSelectedTagIndex + 1);
                    }
                    selectionChanged = true;
                }
                if (selectionChanged) {
                    this.markTagsAsSelected(this.firstSelectedTagIndex, this.lastSelectedTagIndex);
                }
                if (this.firstSelectedTagIndex > this.lastSelectedTagIndex) {
                    this.focusCurrentTag();
                }
            }
        }
    }

    mouseMove(e) {
        this.mouseMoved = true;

        if (!this.mouseButtonDown) return;

        let manhattanLength = Math.abs(this.mouseDownPosition[0] - e.clientX) + Math.abs(this.mouseDownPosition[1] - e.clientY);

        if (manhattanLength <= 3) return;

        // Still allow selection within input elements
        if (e.target == this.mouseDownElement && e.target.nodeName === "INPUT") return;

        // Hide any suggestions and blur any focus
        this.hideSuggestions();
        if (document.activeElement) {
            document.activeElement.blur();
        }

        // This is somewhat buggy
        //const domNode = ReactDOM.findDOMNode(this);
        const domNode = this.tagFieldRef.current;
        if (!domNode)
            return;

        this.selectionHasStarted = true;

        document.body.classList.add("TagTreeSelector__unselectable");

        // Get bounding box of input field
        let inputFieldBoundingRect = domNode.getBoundingClientRect();

        // Define key coordinates
        let top = Math.min(this.mouseDownPosition[1], e.clientY);
        let bottom = Math.max(this.mouseDownPosition[1], e.clientY);
        let left = (this.mouseDownPosition[1] == top ? this.mouseDownPosition[0] : e.clientX);
        let right = (this.mouseDownPosition[1] == top ? e.clientX : this.mouseDownPosition[0]);
        if (Math.abs(top - bottom) < 30) {
            left = Math.min(this.mouseDownPosition[0], e.clientX);
            right = Math.max(this.mouseDownPosition[0], e.clientX);
        }

        // Find first and last touched tag fields
        let firstSelectedIndex = 99999999999;
        let lastSelectedIndex = -1;

        // Tag elements
        let tags = domNode.getElementsByClassName("TagTreeSelector__Border");

        // Check if selection is out of box - requires some fine tuning to take into account padding!
        if (top <= inputFieldBoundingRect.top) {
            firstSelectedIndex = 0;
        } else {
            let currentIndex = 0;
            while (currentIndex < tags.length) {
                let boundingRect = tags[currentIndex].getBoundingClientRect();
                if (boundingRect.bottom >= top && boundingRect.right >= left) {
                    firstSelectedIndex = currentIndex;
                    break;
                }
                currentIndex++;
            }
        }
        if (bottom >= inputFieldBoundingRect.bottom) {
            lastSelectedIndex = tags.length - 1;
        } else {
            let currentIndex = tags.length - 1;
            while (currentIndex >= 0) {
                let boundingRect = tags[currentIndex].getBoundingClientRect();
                if (boundingRect.top <= bottom && boundingRect.left <= right) {
                    lastSelectedIndex = currentIndex;
                    break;
                }
                currentIndex--;
            }
        }
        this.markTagsAsSelected(firstSelectedIndex, lastSelectedIndex);
    }

    markTagsAsSelected(startIndex, endIndex) {
        this.state.tags.map((tag, index) => {
            if (index >= startIndex && index <= endIndex) {
                tag.select();
            }
            else {
                tag.unselect();
            }
        });
        this.updateState({});
    }

    makeValues() {
        const { setProps } = this.props;
        let selection = [];
        for (let i = 0; i < this.countTags(); i++) {
            const tag = this.tag(i);
            if (tag.isValid() && !this.checkIfDuplicate(tag, i))
                selection.push(tag.value());
        }
        setProps({ value: selection });
    }

    render() {
        const { id, label, maxTags } = this.props;
        const { tags, suggestionsVisible } = this.state;

        return (
            <div id={id}>
                <label>{label}</label>
                <div className={classNames({
                    "TagTreeSelector": true,
                    "TagTreeSelector--SuggestionsActive": suggestionsVisible,
                    "TagTreeSelector--Invalid": (this.props.maxTags > 0 && this.countValidTags() > this.props.maxTags)
                })}
                    onClick={(e) => this.selectLastInput(e)}
                    onMouseDown={(e) => this.mouseDown(e)}
                >
                    <ul className="TagTreeSelector__Tags" ref={this.tagFieldRef}>
                        {tags.map((tag, index) => (
                            <Tag
                                key={index}
                                index={index}
                                tag={tag}
                                countTags={this.countTags()}
                                currentTag={index === this.currentTagIndex()}
                                checkIfDuplicate={(tag, index) => this.checkIfDuplicate(tag, index)}
                                inputKeyDown={(e) => this.inputKeyDown(e)}
                                inputKeyUp={(e) => this.inputKeyUp(e)}
                                inputChange={(e) => this.inputChange(e)}
                                inputSelect={(e, index) => this.inputSelect(e, index)}
                                hideSuggestions={() => this.hideSuggestions()}
                                removeTag={(e, index) => this.removeTag(e, index)}
                            />
                        ))}
                    </ul>
                    <div className="TagTreeSelector__ClearAll">
                        <button type="button" title="Clear all" onClick={(e) => this.clearAll(e)} disabled={(this.countTags() <= 1 && this.hasLastEmptyTag())}>+</button>
                    </div>
                    {this.currentTagIndex() >= 0 && <Suggestions ref={this.suggestions} tagFieldRef={this.tagFieldRef} visible={suggestionsVisible} useSuggestion={(e, suggestion) => this.useSuggestion(e, suggestion)} tag={this.currentTag()}></Suggestions>}
                </div>
                {maxTags > 0 && <div className={classNames({
                    "TagTreeSelector__NumberOfTags": true,
                    "TagTreeSelector__Error": this.countValidTags() > maxTags
                })} ref={this.refNumberOfTags}>Selected {this.countValidTags()} of {maxTags}</div>}
            </div >
        );
    }

    tagTitle(tag, index) {
        if (index === this.countTags() - 1 && this.hasLastEmptyTag()) {
            return "Enter a new name";
        }
        else if (!tag.isValid()) {
            return "Invalid";
        }
        else if (this.checkIfDuplicate(tag, index)) {
            return "Duplicate";
        }
        else if (tag.isComplete()) {
            return "Incomplete";
        }
        else {
            this.tagText(tag);
        }
    }

    clearAll(e) {
        this.updateState({
            tags: [
                this.createNewTag(),
            ],
            currentTagIndex: 0,
            suggestionsVisible: false,
            callback: () => {
                this.state.tags[0].ref().focus();
            }
        });
        e.stopPropagation();
        e.preventDefault();
    }

    lastTag() {
        return this.state.tags[this.countTags() - 1];
    }

    useSuggestion(e, suggestion) {
        var tag = this.currentTag();
        this.noUserInputSelect = true;

        tag.setData(suggestion);
        tag.incrementDataIndex();

        let struct = {};
        if (tag.isValid() && this.currentTagIndex() == this.countTags() - 1 && this.canAddTag()) {
            struct = {
                tags: [...this.state.tags, this.createNewTag()],
                currentTagIndex: this.currentTagIndex() + 1,
                callback: () => this.focusCurrentTag()
            };
        }
        else {
            this.focusCurrentTag();
        }
        struct.suggestionsVisible = false;
        this.updateState(struct);
        e.stopPropagation();
        return;
    }

    selectLastInput(e) {
        if (!this.selectionHasStarted) {
            this.setFocusOnTagInput(this.countTags() - 1);
            e.preventDefault();
        }
        this.selectionHasStarted = false;
    }

    debugCurrentTag() {
        let tag = this.state.tags[this.state.currentTagIndex];
        if (tag) {
            return (<div>
                <label>State: {tag.state}</label><br />
                <label>Active: {tag.active}</label><br />
                <label>Source: {tag.source}</label><br />
                <label>Type: {tag.type}</label><br />
                <label>Tag: {tag.tag}</label><br />
                <label>Subgroup: {tag.subgroup}</label><br />
                <label>Current index: {this.state.currentTagIndex}</label><br />
                <label>Show suggestions: {this.state.suggestionsVisible}</label>
            </div>);
        }
    }

    setFocusOnTagInput(index) {
        if (index >= 0 && index < this.countTags())
            this.state.tags[index].ref().focus();
    }

    currentTagIndex() {
        return this.state.currentTagIndex;
    }

    incrementCurrentTagIndex(callback) {
        if (this.state.currentTagIndex < this.countTags()) {
            this.updateState({ currentTagIndex: this.state.currentTagIndex + 1, callback: callback });
            return true;
        }
        return false;
    }

    decrementCurrentTagIndex(callback) {
        if (this.state.currentTagIndex > 0) {
            this.updateState({ currentTagIndex: this.state.currentTagIndex - 1, callback: callback });
            return true;
        }
        return false;
    }

    tag(index) {
        return this.state.tags[index];
    }

    countTags() {
        return this.state.tags.length;
    }

    countValidTags() {
        let count = 0;
        for (const tag of this.state.tags) {
            count += tag.isValid() ? tag.countMatchedTags() : 0;
        }
        return count;
    }

    focusCurrentTag() {
        this.setFocusOnTagInput(this.state.currentTagIndex);
    }

    setCurrentTagState(state) {
        let tag = this.currentTag();
        if (tag.state === state) return;
        tag.state = state;
        this.updateState({ tags: this.state.tags.map((v, i) => i == this.currentTagIndex() ? tag : v) });
    }

    removeTag(e, index) {
        let newTags = [...this.state.tags];
        let newTagIndex = this.currentTagIndex() === index ? Math.max(this.countTags() - 2, 0) : this.currentTagIndex() - (index < this.currentTagIndex() ? 1 : 0);
        newTags.splice(index, 1);
        if (newTags.length == 0) {
            newTags = [this.createNewTag()];
        } else if (index === this.countTags() - 1) {
            if (!this.hasLastEmptyTag()) {
                newTags = [...newTags, this.createNewTag()];
            }
            newTagIndex = this.countTags() - 1;
        }
        this.updateState({ tags: newTags, currentTagIndex: newTagIndex, callback: this.setFocusOnTagInput(newTagIndex) });

        // Stop event propagation so the parent event handler does not take over.
        e.stopPropagation();
    }

    inputSelect(e, index) {
        if (this.noUserInputSelect) {
            this.noUserInputSelect = false;
            return;
        }
        const val = e.target.value;
        let tag = this.tag(index);
        if (!tag.isMetaData()) {
            tag.setActiveDataIndex(val.slice(0, e.target.selectionStart).split(this.props.delimiter).length - 1, false);
        }
        const selection = e.target.value.substring(e.target.selectionStart, e.target.selectionEnd);
        if (selection.includes(this.props.delimiter)) {
            if (e.target.selectionDirection === "backward") {
                e.target.setSelectionRange(e.target.selectionStart + selection.indexOf(this.props.delimiter) + 1, e.target.selectionEnd);
            }
            else {
                e.target.setSelectionRange(e.target.selectionStart, e.target.selectionStart + selection.indexOf(this.props.delimiter));
            }
        }
        this.state.tags.forEach(v => v.unselect());
        this.updateState({
            currentTagIndex: index,
            callback: () => this.maybeShowSuggestions()
        });
        e.stopPropagation();
    }

    inputKeyUp(e) {
        const val = e.target.value;
        if (e.key === "Enter" && val) {

            if (this.currentTagIndex() == this.countTags() - 1) {
                this.focusCurrentTag();
            } else {
                this.incrementCurrentTagIndex();
                this.setFocusOnTagInput(this.currentTagIndex() + 1);
            }

        }
        else if (e.key === "ArrowRight" && val) {
            if (e.target.selectionStart == e.target.value.length) {
                this.focusCurrentTag();
            }
            else if (val.slice(0, e.target.selectionStart).includes(this.props.delimiter)) {
                this.setCurrentTagState(StateEnums.Subgroup);
            }
            else {
                this.setCurrentTagState(StateEnums.Tag);
            }
        }
        else if (e.key === "ArrowLeft") {
            if (e.target.selectionStart == 0) {
                this.focusCurrentTag();
            }
            else if (val && val.slice(0, e.target.selectionStart).includes(this.props.delimiter)) {
                this.setCurrentTagState(StateEnums.Subgroup);
            }
            else if (val) {
                this.setCurrentTagState(StateEnums.Tag);
            }
        }
        else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
        }
        else if (e.key === this.props.delimiter && val) {
            if (this.currentTag().isMetaData()) {
                this.currentTag().setData(val.slice(0, -1));
                this.currentTag().incrementDataIndex();
                this.updateState({});
            }
            else if (!this.currentTag().isValid()) {
                this.currentTag().setData(val);
                this.currentTag().incrementDataIndex();
                this.updateState({});
            }
            else {
                e.preventDefault();
            }
        }
    }

    currentTag() {
        var tag = this.state.tags[this.state.currentTagIndex];
        return tag;
    }

    inputChange(e) {
        var tag = this.currentTag();
        const value = e.target.value;

        if (tag.isMetaData()) {
            tag.setData(value);
        }
        else {
            let i = tag.numMetaData();
            for (let d of value.split(this.props.delimiter)) {
                tag.setData(d, i++);
            }
        }

        this.updateState({});
        this.maybeShowSuggestions();
    }

    hasLastEmptyTag() {
        const lastTag = this.state.tags[this.state.tags.length - 1];
        return !lastTag.isTag();
    }

    selectTag(index) {
        this.hideSuggestions();
        if (document.activeElement) {
            document.activeElement.blur();
        }
        if (this.tag(index).isEmpty())
            index--;

        this.lastSelectedTagIndex = index;
        this.firstSelectedTagIndex = index;
        this.state.tags.map((tag, i) => {
            if (i == index) {
                tag.select();
            }
        });
    }

    inputKeyDown(e) {
        const val = e.target.value;
        if (e.key === "Enter" && val && !this.hasLastEmptyTag() && this.currentTagIndex() == this.countTags() - 1) {
            if (this.canAddTag()) {
                this.updateState({
                    tags: [...this.state.tags, this.createNewTag()], currentTagIndex: this.state.currentTagIndex + 1
                });
            }
            else {
                this.letMaxTagsBlink();
            }
        }
        else if ((e.key === "ArrowRight" && e.target.selectionEnd == e.target.value.length) && val) {
            if (e.shiftKey) {
                if (this.currentTagIndex() < this.countTags() - 1) {
                    this.selectTag(this.currentTagIndex());
                    this.currentSelectionDirection = DirectionEnums.Right;
                }

            } else {
                if (this.currentTagIndex() == this.countTags() - 1 && !this.hasLastEmptyTag() && this.canAddTag()) {
                    this.updateState({
                        tags: [...this.state.tags, this.createNewTag()], currentTagIndex: this.state.currentTagIndex + 1
                    });
                }
                else {
                    this.incrementCurrentTagIndex();
                }
            }
        }
        else if (e.key === "ArrowLeft" && e.target.selectionStart == 0 && this.state.currentTagIndex > 0) {
            if (e.shiftKey) {
                if (!this.currentTag().isTag()) {
                    this.selectTag(this.currentTagIndex() - 1);
                }
                else {
                    this.selectTag(this.currentTagIndex());
                }
                this.currentSelectionDirection = DirectionEnums.Left;
            }
            else {
                this.decrementCurrentTagIndex();
            }
        }
        else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
        }
        else if (e.key === "Backspace"
            && this.currentTag().activeDataIndex() > 0
            && (
                e.target.value == ""
                || (
                    !this.currentTag().isMetaData()
                    && val.slice(-1) == this.props.delimiter)
            )
        ) {
            this.currentTag().decrementDataIndex();
        }
        else if (e.key === "Delete") {

        }
        else if (e.key === "v" && e.ctrlKey && this.currentTagIndex() == this.countTags() - 1) {
            this.pasteTags(e);
        }
    }
}

TagTreeSelector.defaultProps = {
    maxTags: -1,
    delimiter: ":",
    numMetaData: 0,
    value: []
};

TagTreeSelector.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks.
     */
    id: PropTypes.string.isRequired,

    /**
     * The max number of tags that can be selected.
     */
    maxTags: PropTypes.number,

    /**
     * The delimiter used to separate input levels.
     */
    delimiter: PropTypes.string,

    /**
     * The number of meta data used. Meta data is not shown as text in the final tag but used
     * to set properties like border color or icons.
     */
    numMetaData: PropTypes.number,

    /**
     * A JSON object holding all tags.
     */
    data: PropTypes.object.isRequired,

    /**
     * A label that will be printed when this component is rendered.
     */
    label: PropTypes.string.isRequired,

    /**
     * Dash-assigned callback that should be called to report property changes
     * to Dash, to make them available for callbacks.
     */
    setProps: PropTypes.func,

    /**
     * Selected tags.
     */
    value: PropTypes.arrayOf(PropTypes.string),
};
