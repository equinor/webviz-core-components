/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './SmartNodeSelector.css';
import TreeNodeSelection from './utils/TreeNodeSelection';
import TreeData from './utils/TreeData';
import Suggestions from './sub-components/Suggestions'
import Tag from './sub-components/Tag'

var DirectionEnums = Object.freeze({
    "Left": 0,
    "Right": 1
});

/**
 * SmartNodeSelector is a component that allows to create tags by selecting data from a tree structure.
 * The tree structure can also provide meta data that is displayed as color or icon.
 */
export default class SmartNodeSelector extends Component {
    constructor(props) {
        super();

        this.__suggestionTimer = undefined;
        this.__ref = React.createRef();
        this.__suggestions = React.createRef();
        this.__refNumberOfTags = React.createRef();
        this.__tagFieldRef = React.createRef();
        this.__mouseButtonDown = false;
        this.__mouseDownPosition = [0, 0];
        this.__selectionHasStarted = false;
        this.__firstSelectedTagIndex = -1;
        this.__lastSelectedTagIndex = -1;
        this.__currentSelectionDirection = 0;
        this.__mouseMoved = false;
        this.__clipboardData = undefined;
        this.__noUserInputSelect = false;
        this.__mouseDownElement = undefined;
        this.__isMounted = false;
        this.props = props;

        this.treeData = new TreeData({
            treeData: props.data,
            delimiter: props.delimiter
        });

        let nodeSelections = [];
        if (props.selectedTags !== undefined) {
            for (const tag of props.selectedTags) {
                const nodePath = tag.split(this.props.delimiter);
                nodeSelections.push(this.createNewNodeSelection(nodePath));
            }
        }
        if (nodeSelections.length < props.maxNumSelectedNodes || props.maxNumSelectedNodes === -1) {
            nodeSelections.push(this.createNewNodeSelection());
        }

        this.state = {
            nodeSelections,
            currentTagIndex: 0,
            suggestionsVisible: false
        };
    }

    componentDidMount() {
        this.__isMounted = true;
        document.addEventListener('click', (e) => this.handleClickOutside(e), true);
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e), true);
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e), true);
        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e), true);
    }

    componentWillUnmount() {
        this.__isMounted = false;
        clearTimeout(this.__suggestionTimer);
        document.removeEventListener('click', (e) => this.handleClickOutside(e), true);
        document.removeEventListener('mouseup', (e) => this.handleMouseUp(e), true);
        document.removeEventListener('mousemove', (e) => this.handleMouseMove(e), true);
        document.removeEventListener('keydown', (e) => this.handleGlobalKeyDown(e), true);
    }

    createNewNodeSelection(nodePath = [""]) {
        return new TreeNodeSelection({
            focussedLevel: nodePath.length - 1,
            nodePath: nodePath,
            selected: false,
            delimiter: this.props.delimiter,
            numMetaNodes: this.props.numMetaNodes,
            treeData: this.treeData
        });
    }

    lastNodeSelection() {
        return this.state.nodeSelections[this.countTags() - 1];
    }

    currentNodeSelection() {
        return this.state.nodeSelections[this.currentTagIndex()];
    }

    selectLastInput(e) {
        if (!this.__selectionHasStarted && this.countSelectedTags() == 0) {
            this.setFocusOnTagInput(this.countTags() - 1);
            e.preventDefault();
        }
        this.__selectionHasStarted = false;
    }

    setFocusOnTagInput(index) {
        if (index >= 0 && index < this.countTags()) {
            this.state.nodeSelections[index].getRef().current.focus();
            this.maybeShowSuggestions();
        }
    }

    currentTagIndex() {
        return this.state.currentTagIndex;
    }

    hasLastEmptyTag() {
        const lastTag = this.state.nodeSelections[this.state.nodeSelections.length - 1];
        return !(lastTag.displayAsTag() || lastTag.isValid());
    }

    incrementCurrentTagIndex(callback) {
        if (this.currentTagIndex() < this.countTags() - 1) {
            this.updateState({ currentTagIndex: this.currentTagIndex() + 1, callback: callback });
            return true;
        }
        return false;
    }

    decrementCurrentTagIndex(callback) {
        if (this.currentTagIndex() > 0) {
            this.updateState({ currentTagIndex: this.currentTagIndex() - 1, callback: callback });
            return true;
        }
        return false;
    }

    nodeSelection(index) {
        return this.state.nodeSelections[index];
    }

    countTags() {
        return this.state.nodeSelections.length;
    }

    countValidSelections() {
        let count = 0;
        for (const nodeSelection of this.state.nodeSelections) {
            count += nodeSelection.isValid() ? nodeSelection.countExactlyMatchedNodePaths() : 0;
        }
        return count;
    }

    focusCurrentTag() {
        this.setFocusOnTagInput(this.currentTagIndex());
    }

    doesStateChange({
        nodeSelections,
        currentTagIndex,
        suggestionsVisible
    }) {
        let check = !nodeSelections.length !== this.state.nodeSelections.length;
        if (!nodeSelections.length == this.state.nodeSelections.length) {
            check = check || !nodeSelections.some((v, i) => !v.trulyEquals(this.state.nodeSelections[i]));
        }
        check = check || currentTagIndex !== this.currentTagIndex();
        check = check || suggestionsVisible !== this.state.suggestionsVisible;
        return check;
    }

    updateState({
        nodeSelections = undefined,
        currentTagIndex = undefined,
        suggestionsVisible = undefined,
        callback = () => { },
        forceUpdate = false
    }) {
        if (!this.__isMounted) return;

        if (
            this.currentTagIndex() > 0
            && currentTagIndex !== undefined
            && this.currentNodeSelection() !== undefined
            && currentTagIndex != this.currentTagIndex()
        ) {
            this.nodeSelection(this.currentTagIndex())
                .setFocussedLevel(this.nodeSelection(this.currentTagIndex()).countLevel() - 1);
        }
        const newNodeSelections = nodeSelections === undefined ? this.state.nodeSelections : nodeSelections;
        const currentNodeSelections = this.state.nodeSelections;
        const newTagIndex = currentTagIndex === undefined ? this.currentTagIndex() : currentTagIndex;
        const newSuggestionsVisible = (
            suggestionsVisible === undefined ?
                this.state.suggestionsVisible
                : suggestionsVisible
        );

        if (forceUpdate || this.doesStateChange({
            nodeSelections: newNodeSelections,
            currentTagIndex: newTagIndex,
            suggestionsVisible: newSuggestionsVisible
        })) {
            this.setState({
                nodeSelections: newNodeSelections,
                currentTagIndex: newTagIndex,
                suggestionsVisible: newSuggestionsVisible
            }, () => {
                callback();
                if (newNodeSelections != currentNodeSelections) {
                    this.updateSelectedTagsAndNodes();
                }
            });
        }
        else {
            callback();
            if (newNodeSelections != currentNodeSelections) {
                this.updateSelectedTagsAndNodes();
            }
        }
    }

    maybeShowSuggestions() {
        const { numSecondsUntilSuggestionsAreShown } = this.props;
        if (this.__suggestionTimer)
            clearTimeout(this.__suggestionTimer);
        if (this.currentNodeSelection() !== undefined && !this.currentNodeSelection().isValid()) {
            this.__suggestionTimer = setTimeout(() =>
                this.showSuggestions(), numSecondsUntilSuggestionsAreShown * 1000
            );
        }
    }

    showSuggestions() {
        if (!document.activeElement || this.currentTagIndex() < 0) return;
        if (this.currentNodeSelection().getRef().current === document.activeElement) {

            this.updateState({ suggestionsVisible: true });
        }
    }

    hideSuggestions(cb) {
        clearTimeout(this.__suggestionTimer);
        this.updateState({ suggestionsVisible: false, callback: cb });
    }

    useSuggestion(e, suggestion) {
        var nodeSelection = this.currentNodeSelection();
        this.__noUserInputSelect = true;

        nodeSelection.setNodeName(suggestion);
        nodeSelection.incrementFocussedLevel();

        let struct = {};
        if (nodeSelection.isValid() && this.currentTagIndex() == this.countTags() - 1 && this.canAddSelection()) {
            struct = {
                nodeSelections: [...this.state.nodeSelections, this.createNewNodeSelection()],
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

    letMaxNumValuesBlink() {
        var numBlinks = 0;
        var blinkTimer = setInterval(() => {
            numBlinks++;
            if (numBlinks % 2 == 0) {
                this.__refNumberOfTags.current.classList.add("SmartNodeSelector__Warning");
            } else {
                this.__refNumberOfTags.current.classList.remove("SmartNodeSelector__Warning");
            }
            if (numBlinks === 7) {
                clearInterval(blinkTimer);
            }
        }, 200);
    }

    checkIfSelectionIsDuplicate(nodeSelection, index) {
        const duplicateSelections = this.state.nodeSelections.filter((entry, i) =>
            (i < index && entry.containsOrIsContainedBy(nodeSelection))
        );
        return duplicateSelections.length > 0;
    }

    handleClickOutside(event) {
        const domNode = this.__tagFieldRef.current;
        const suggestions = this.__suggestions.current;
        if (
            (!domNode || !domNode.contains(event.target))
            && (!suggestions || !suggestions.contains(event.target))
        ) {
            this.hideSuggestions();
            if (!this.__selectionHasStarted) {
                this.unselectAllTags({});

                this.updateState({ currentTagIndex: -1 });
            }
            this.__selectionHasStarted = false;
        }
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

    handleMouseUp(e) {
        this.__mouseButtonDown = false;
        document.body.classList.remove("SmartNodeSelector__unselectable");
        if (this.countSelectedTags() > 0) {
            this.hideSuggestions();
            if (document.activeElement) {
                document.activeElement.blur();
            }
            e.stopPropagation();
            e.preventDefault();
        }
    }

    handleMouseDown(e) {
        this.__mouseDownElement = e.target;
        this.__mouseDownPosition = [e.clientX, e.clientY];
        if (this.countSelectedTags() > 0) {
            this.unselectAllTags({});
            e.stopPropagation();
        }
        else {
            this.__mouseButtonDown = true;
        }
    }

    handleMouseMove(e) {
        this.__mouseMoved = true;

        if (!this.__mouseButtonDown) return;

        const manhattanLength = Math.abs(
            this.__mouseDownPosition[0] - e.clientX)
            + Math.abs(this.__mouseDownPosition[1] - e.clientY
            );

        if (manhattanLength <= 3) return;

        const currentTarget = document.elementFromPoint(e.clientX, e.clientY);
        if (currentTarget == this.__mouseDownElement && currentTarget.nodeName === "INPUT") return;

        this.hideSuggestions();
        if (document.activeElement) {
            document.activeElement.blur();
        }

        const domNode = this.__tagFieldRef.current;
        if (!domNode)
            return;

        this.__selectionHasStarted = true;

        document.body.classList.add("SmartNodeSelector__unselectable");
        const inputFieldBoundingRect = domNode.getBoundingClientRect();

        const top = Math.min(this.__mouseDownPosition[1], e.clientY);
        const bottom = Math.max(this.__mouseDownPosition[1], e.clientY);
        let left = (this.__mouseDownPosition[1] == top ? this.__mouseDownPosition[0] : e.clientX);
        let right = (this.__mouseDownPosition[1] == top ? e.clientX : this.__mouseDownPosition[0]);
        if (Math.abs(top - bottom) < 30) {
            left = Math.min(this.__mouseDownPosition[0], e.clientX);
            right = Math.max(this.__mouseDownPosition[0], e.clientX);
        }

        let firstSelectedIndex = 99999999999;
        let lastSelectedIndex = -1;

        const tags = domNode.getElementsByClassName("SmartNodeSelector__Border");

        if (top <= inputFieldBoundingRect.top) {
            firstSelectedIndex = 0;
        } else {
            let currentIndex = 0;
            while (currentIndex < tags.length) {
                const boundingRect = tags[currentIndex].getBoundingClientRect();
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
                const boundingRect = tags[currentIndex].getBoundingClientRect();
                if (boundingRect.top <= bottom && boundingRect.left <= right) {
                    lastSelectedIndex = currentIndex;
                    break;
                }
                currentIndex--;
            }
        }
        this.markTagsAsSelected(firstSelectedIndex, lastSelectedIndex);
    }

    selectedTags() {
        return this.state.nodeSelections.filter((el) => el.isSelected());
    }

    countSelectedTags() {
        return this.selectedTags().length;
    }

    selectTag(index) {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        if (this.nodeSelection(index).isEmpty())
            index--;

        this.__lastSelectedTagIndex = index;
        this.__firstSelectedTagIndex = index;
        this.state.nodeSelections.map((nodeSelection, i) => {
            if (i == index) {
                nodeSelection.setSelected(true);
            }
        });
        this.updateState({
            showSuggestions: false,
            forceUpdate: true
        });
    }

    markTagsAsSelected(startIndex, endIndex) {
        this.state.nodeSelections.map((nodeSelection, index) => {
            if (index >= startIndex && index <= endIndex) {
                nodeSelection.setSelected(true);
            }
            else {
                nodeSelection.setSelected(false);
            }
        });
        this.updateState({ forceUpdate: true });
    }

    unselectAllTags({
        newCurrentTagIndex = undefined,
        showSuggestions = false,
        focusInput = false
    }) {
        this.state.nodeSelections.forEach((selection) => selection.setSelected(false));
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

    removeSelectedTags() {
        let newSelections = this.state.nodeSelections.filter((tag) => !tag.isSelected());
        const numRemovedTags = this.countTags() - newSelections.length;
        let newTagIndex = this.currentTagIndex();
        if (newTagIndex >= this.__firstSelectedTagIndex) {
            newTagIndex = Math.max(0, newTagIndex - numRemovedTags);
        }
        if (newSelections.length == 0 || !this.hasLastEmptyTag()) {
            newSelections = [...newSelections, this.createNewNodeSelection()];
        }
        this.updateState({
            nodeSelections: newSelections,
            currentTagIndex: newTagIndex,
            suggestionsVisible: false,
            callback: () => this.focusCurrentTag()
        });
    }

    removeTag(e, index) {
        let newSelections = [...this.state.nodeSelections];
        let newTagIndex =
            this.currentTagIndex() === index ?
                Math.max(this.countTags() - 2, 0)
                : this.currentTagIndex() - (index < this.currentTagIndex() ? 1 : 0);
        newSelections.splice(index, 1);
        if (newSelections.length == 0) {
            newSelections = [this.createNewNodeSelection()];
        } else if (index === this.countTags() - 1) {
            if (!this.hasLastEmptyTag()) {
                newSelections = [...newSelections, this.createNewNodeSelection()];
            }
            newTagIndex = this.countTags() - 1;
        }
        this.updateState({
            nodeSelections: newSelections,
            currentTagIndex: newTagIndex,
            callback: this.setFocusOnTagInput(newTagIndex)
        });

        e.stopPropagation();
    }

    clearAllTags(e) {
        this.updateState({
            nodeSelections: [
                this.createNewNodeSelection(),
            ],
            currentTagIndex: 0,
            suggestionsVisible: false,
            callback: () => {
                this.state.nodeSelections[0].getRef().current.focus();
            }
        });
        e.stopPropagation();
        e.preventDefault();
    }

    handleTagSelection(e) {
        if (e.shiftKey) {
            if (this.countSelectedTags() > 0) {
                let selectionChanged = false;
                if (e.key === "ArrowLeft") {
                    if (this.__currentSelectionDirection == DirectionEnums.Left) {
                        this.__firstSelectedTagIndex = Math.max(0, this.__firstSelectedTagIndex - 1);
                    } else {
                        this.__lastSelectedTagIndex = this.__lastSelectedTagIndex - 1;
                    }
                    selectionChanged = true;
                }
                else if (e.key === "ArrowRight") {
                    if (this.__currentSelectionDirection == DirectionEnums.Left) {
                        this.__firstSelectedTagIndex = this.__firstSelectedTagIndex + 1;
                    } else {
                        this.__lastSelectedTagIndex = Math.min(this.countTags() - 1, this.__lastSelectedTagIndex + 1);
                    }
                    selectionChanged = true;
                }
                if (selectionChanged) {
                    this.markTagsAsSelected(this.__firstSelectedTagIndex, this.__lastSelectedTagIndex);
                }
                if (this.__firstSelectedTagIndex > this.__lastSelectedTagIndex) {
                    this.focusCurrentTag();
                }
            }
        }
    }

    copyAllSelectedTags() {
        const selectedTags = this.selectedTags();
        this.__clipboardData = selectedTags;
    }

    pasteTags(e) {
        if (this.__clipboardData === undefined) return;
        const selections = this.__clipboardData;
        if (selections && selections.length > 0) {
            let newSelections = this.state.nodeSelections;
            if (this.lastNodeSelection().isEmpty()) {
                newSelections.pop();
            }
            for (let selection of selections) {
                if (newSelections.length < this.props.maxNumSelectedNodes || this.props.maxNumSelectedNodes == -1) {
                    newSelections.push(selection.clone());
                }
            }
            if (newSelections.length < this.props.maxNumSelectedNodes || this.props.maxNumSelectedNodes == -1) {
                newSelections.push(this.createNewNodeSelection());
            }
            this.updateState({
                nodeSelections: newSelections,
                currentTagIndex: newSelections.length - 1,
                suggestionsVisible: false,
                callback: () => {
                    this.unselectAllTags({ focusInput: true });
                }
            });
        }
        e.preventDefault();
    }

    canAddSelection() {
        return this.countValidSelections() < this.props.maxNumSelectedNodes || this.props.maxNumSelectedNodes == -1;
    }

    updateSelectedTagsAndNodes() {
        const { setProps } = this.props;
        let selectedTags = [];
        let selectedNodes = [];
        let selectedIds = [];
        loop1:
        for (let i = 0; i < this.countTags(); i++) {
            const nodeSelection = this.nodeSelection(i);
            if (nodeSelection.isValid() && !this.checkIfSelectionIsDuplicate(nodeSelection, i)) {
                const matchedNodePaths = nodeSelection.exactlyMatchedNodePaths();
                selectedTags.push(nodeSelection.getCompleteNodePathAsString());
                for (let j = 0; j < matchedNodePaths.length; j++) {
                    if (selectedNodes.length >= this.maxNumSelectedNodes) {
                        break loop1;
                    }
                    selectedNodes.push(matchedNodePaths[j]);
                    selectedIds.push(nodeSelection.getId(matchedNodePaths[j]) || "");
                }
            }
        }
        setProps({
            selectedTags: selectedTags,
            selectedNodes: selectedNodes,
            selectedIds: selectedIds
        });
    }

    debugOutput() {
        if (this.currentNodeSelection()) {
            return (
                <div>
                    <label>Current Tag Index: {this.currentTagIndex()}<br /></label>
                    <label>Current Node Selection: {this.currentNodeSelection().getNodePath()}<br /></label>
                    <label>Currently Focussed Level: {this.currentNodeSelection().getFocussedLevel()}</label>
                </div>
            );
        } else {
            return null;
        }
    }

    handleInputSelect(e, index) {
        if (this.__noUserInputSelect) {
            this.__noUserInputSelect = false;
            return;
        }
        const val = e.target.value;
        const tag = this.nodeSelection(index);
        if (!tag.isFocusOnMetaData()) {
            tag.setFocussedLevel(val.slice(0, e.target.selectionStart).split(this.props.delimiter).length - 1, false);
        }
        const selection = e.target.value.substring(e.target.selectionStart, e.target.selectionEnd);
        if (selection.includes(this.props.delimiter)) {
            if (e.target.selectionDirection === "backward") {
                e.target.setSelectionRange(
                    e.target.selectionStart + selection.indexOf(this.props.delimiter) + 1,
                    e.target.selectionEnd
                );
            }
            else {
                e.target.setSelectionRange(
                    e.target.selectionStart,
                    e.target.selectionStart + selection.indexOf(this.props.delimiter)
                );
            }
        }
        this.state.nodeSelections.forEach(v => v.setSelected(false));
        this.updateState({
            currentTagIndex: index,
            callback: () => {
                this.maybeShowSuggestions();
            }
        });
        e.stopPropagation();
    }

    handleInputKeyUp(e) {
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
        }
        else if (e.key === "ArrowLeft") {
            if (e.target.selectionStart == 0) {
                this.focusCurrentTag();
            }
        }
        else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
        }
        else if (e.key === this.props.delimiter && val) {
            if (this.currentNodeSelection().isFocusOnMetaData()) {
                this.currentNodeSelection().setNodeName(val.slice(0, -1));
                this.currentNodeSelection().incrementFocussedLevel();
                this.updateState({ forceUpdate: true });
            }
            else if (!this.currentNodeSelection().isValid()) {
                this.currentNodeSelection().setNodeName(val);
                this.currentNodeSelection().incrementFocussedLevel();
                this.updateState({ forceUpdate: true });
            }
            else {
                e.preventDefault();
            }
        }
    }

    handleInputKeyDown(e) {
        const val = e.target.value;
        if (e.key === "Enter" && val && !this.hasLastEmptyTag() && this.currentTagIndex() == this.countTags() - 1) {
            if (this.canAddSelection()) {
                this.updateState({
                    nodeSelections: [...this.state.nodeSelections, this.createNewNodeSelection()],
                    currentTagIndex: this.currentTagIndex() + 1
                });
            }
            else {
                this.letMaxNumValuesBlink();
            }
        }
        else if ((e.key === "ArrowRight" && e.target.selectionEnd == e.target.value.length && !e.repeat) && val) {
            if (e.shiftKey) {
                if (this.currentTagIndex() < this.countTags() - 1) {
                    this.selectTag(this.currentTagIndex());
                    this.__currentSelectionDirection = DirectionEnums.Right;
                }

            } else {
                if (this.currentTagIndex() == this.countTags() - 1
                    && !this.hasLastEmptyTag()
                    && this.canAddSelection()) {
                    this.updateState({
                        nodeSelections: [...this.state.nodeSelections, this.createNewNodeSelection()],
                        currentTagIndex: this.currentTagIndex() + 1
                    });
                }
                else {
                    this.incrementCurrentTagIndex(() =>
                        this.focusCurrentTag()
                    );
                    e.preventDefault();
                }
            }
        }
        else if (
            e.key === "ArrowLeft"
            && e.target.selectionStart == 0
            && e.target.selectionEnd == 0
            && this.currentTagIndex() > 0
            && !e.repeat
        ) {
            if (e.shiftKey) {
                if (!this.currentNodeSelection().displayAsTag()) {
                    this.selectTag(this.currentTagIndex() - 1);
                }
                else {
                    this.selectTag(this.currentTagIndex());
                }
                this.__currentSelectionDirection = DirectionEnums.Left;
            }
            else {
                this.decrementCurrentTagIndex(() => {
                    this.focusCurrentTag();
                });
                e.preventDefault();
            }
        }
        else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
        }
        else if (e.key === "Backspace"
            && this.currentNodeSelection().getFocussedLevel() > 0
            && (
                e.target.value == ""
                || (
                    !this.currentNodeSelection().isFocusOnMetaData()
                    && val.slice(-1) == this.props.delimiter)
            )
        ) {
            this.currentNodeSelection().decrementFocussedLevel();
        }
        else if (e.key === "v" && e.ctrlKey && this.currentTagIndex() == this.countTags() - 1) {
            this.pasteTags(e);
        }
    }

    handleInputChange(e) {
        var tag = this.currentNodeSelection();
        const value = e.target.value;

        if (tag.isFocusOnMetaData()) {
            tag.setNodeName(value);
        }
        else {
            let i = tag.getNumMetaNodes();
            for (const d of value.split(this.props.delimiter)) {
                tag.setNodeName(d, i++);
            }
        }

        this.updateState({ forceUpdate: true });
        this.maybeShowSuggestions();
    }

    render() {
        const { id, label, maxNumSelectedNodes, placeholder, showSuggestions } = this.props;
        const { nodeSelections, suggestionsVisible } = this.state;

        return (
            <div id={id} ref={this.__ref}>
                <label>{label}</label>
                <div className={classNames({
                    "SmartNodeSelector": true,
                    "SmartNodeSelector--SuggestionsActive": suggestionsVisible,
                    "SmartNodeSelector--Invalid":
                        (maxNumSelectedNodes > 0 && this.countValidSelections() > maxNumSelectedNodes)
                })}
                    onClick={(e) => this.selectLastInput(e)}
                    onMouseDown={(e) => this.handleMouseDown(e)}
                >
                    <ul className="SmartNodeSelector__Tags" ref={this.__tagFieldRef}>
                        {nodeSelections.map((selection, index) => (
                            <Tag
                                placeholder={placeholder}
                                key={index}
                                index={index}
                                treeNodeSelection={selection}
                                countTags={this.countTags()}
                                currentTag={index === this.currentTagIndex()}
                                checkIfDuplicate={
                                    (nodeSelection, index) => this.checkIfSelectionIsDuplicate(nodeSelection, index)
                                }
                                inputKeyDown={(e) => this.handleInputKeyDown(e)}
                                inputKeyUp={(e) => this.handleInputKeyUp(e)}
                                inputChange={(e) => this.handleInputChange(e)}
                                inputSelect={(e, index) => this.handleInputSelect(e, index)}
                                hideSuggestions={(cb) => this.hideSuggestions(cb)}
                                removeTag={(e, index) => this.removeTag(e, index)}
                                updateSelectedTagsAndNodes={() => this.updateSelectedTagsAndNodes()}
                            />
                        ))}
                    </ul>
                    <div className="SmartNodeSelector__ClearAll">
                        <button
                            type="button"
                            title="Clear all"
                            onClick={(e) => this.clearAllTags(e)}
                            disabled={(this.countTags() <= 1 && this.hasLastEmptyTag())}
                        />
                    </div>
                    {showSuggestions &&
                        <Suggestions
                            suggestionsRef={this.__suggestions}
                            tagInputFieldRef={this.__tagFieldRef}
                            visible={suggestionsVisible && this.currentTagIndex() >= 0}
                            useSuggestion={(e, suggestion) => this.useSuggestion(e, suggestion)}
                            treeNodeSelection={this.currentNodeSelection()}
                        />
                    }
                </div>
                {maxNumSelectedNodes > 0 && <div className={classNames({
                    "SmartNodeSelector__NumberOfTags": true,
                    "SmartNodeSelector__Error": this.countValidSelections() > maxNumSelectedNodes
                })} ref={this.__refNumberOfTags}>Selected {this.countValidSelections()} of {maxNumSelectedNodes}</div>}
            </div >
        );
    }
}

SmartNodeSelector.defaultProps = {
    maxNumSelectedNodes: -1,
    delimiter: ":",
    numMetaNodes: 0,
    showSuggestions: true,
    selectedNodes: [],
    selectedTags: [],
    selectedIds: [],
    placeholder: "Add new tag...",
    numSecondsUntilSuggestionsAreShown: 1.5,
    persisted_props: ['selectedNodes', 'selectedTags', 'selectedIds'],
    persistence_type: 'local',
};

SmartNodeSelector.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks.
     */
    id: PropTypes.string.isRequired,

    /**
     * The max number of tags that can be selected.
     */
    maxNumSelectedNodes: PropTypes.number,

    /**
     * The delimiter used to separate input levels.
     */
    delimiter: PropTypes.string,

    /**
     * The number of meta data used. Meta data is not shown as text in the final tag but used
     * to set properties like border color or icons.
     */
    numMetaNodes: PropTypes.number,

    /**
     * A JSON object holding all tags.
     */
    data: PropTypes.array.isRequired,

    /**
     * A label that will be printed when this component is rendered.
     */
    label: PropTypes.string.isRequired,

    /**
     * Stating of suggestions should be shown or not.
     */
    showSuggestions: PropTypes.bool,

    /**
     * Dash-assigned callback that should be called to report property changes
     * to Dash, to make them available for callbacks.
     */
    setProps: PropTypes.func,

    /**
     * Selected nodes - readonly.
     */
    selectedNodes: PropTypes.arrayOf(PropTypes.string),

    /**
     * Selected tags.
     */
    selectedTags: PropTypes.arrayOf(PropTypes.string),

    /**
     * Selected ids.
     */
    selectedIds: PropTypes.arrayOf(PropTypes.string),

    /**
     * Placeholder text for input field.
     */
    placeholder: PropTypes.string,

    /**
     * Number of seconds until suggestions are shown.
     */
    numSecondsUntilSuggestionsAreShown: PropTypes.number,

    /**
     * Used to allow user interactions in this component to be persisted when
     * the component - or the page - is refreshed. If `persisted` is truthy and
     * hasn't changed from its previous value, a `value` that the user has
     * changed while using the app will keep that change, as long as
     * the new `value` also matches what was given originally.
     * Used in conjunction with `persistence_type`.
     */
    persistence: PropTypes.oneOfType(
        [PropTypes.bool, PropTypes.string, PropTypes.number]
    ),

    /**
     * Properties whose user interactions will persist after refreshing the
     * component or the page. Since only `value` is allowed this prop can
     * normally be ignored.
     */
    persisted_props: PropTypes.arrayOf(PropTypes.oneOf(['selectedNodes', 'selectedTags', 'selectedIds'])),

    /**
     * Where persisted user changes will be stored:
     * memory: only kept in memory, reset on page refresh.
     * local: window.localStorage, data is kept after the browser quit.
     * session: window.sessionStorage, data is cleared once the browser quit.
     */
    persistence_type: PropTypes.oneOf(['local', 'session', 'memory']),
};
