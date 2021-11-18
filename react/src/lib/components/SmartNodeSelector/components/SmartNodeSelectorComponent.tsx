/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component, MouseEvent } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import _ from "lodash";

import TreeNodeSelection from "../utils/TreeNodeSelection";
import TreeData from "../utils/TreeData";
import { TreeDataNode } from "../utils/TreeDataNodeTypes";
import Suggestions from "./Suggestions";
import Tag from "./Tag";

import "./SmartNodeSelector.css";

export enum Direction {
    Left = 0,
    Right,
}

export enum KeyEventType {
    KeyUp = 0,
    KeyDown,
}

export type ParentProps = {
    selectedTags: string[];
    selectedNodes: string[];
    selectedIds: string[];
};

export type SmartNodeSelectorPropsType = {
    id: string;
    maxNumSelectedNodes: number;
    delimiter: string;
    numMetaNodes: number;
    data: TreeDataNode[];
    label?: string;
    showSuggestions: boolean;
    setProps: (props: ParentProps) => void;
    selectedTags?: string[];
    placeholder?: string;
    numSecondsUntilSuggestionsAreShown: number;
    lineBreakAfterTag?: boolean;
    caseInsensitiveMatching?: boolean;
    useBetaFeatures?: boolean;
    persistence: boolean | string | number;
    persisted_props: "selectedTags"[];
    persistence_type: "local" | "session" | "memory";
};

type SmartNodeSelectorStateType = {
    nodeSelections: TreeNodeSelection[];
    currentTagIndex: number;
    suggestionsVisible: boolean;
    showAllSuggestions: boolean;
    hasError: boolean;
    error: string;
    currentTagShaking: boolean;
};

type SmartNodeSelectorSubStateType = {
    nodeSelections: TreeNodeSelection[];
    currentTagIndex: number;
    suggestionsVisible: boolean;
    showAllSuggestions: boolean;
    currentTagShaking: boolean;
};

type SmartNodeSelectorUpdateStateType = {
    nodeSelections?: TreeNodeSelection[];
    currentTagIndex?: number;
    suggestionsVisible?: boolean;
    showAllSuggestions?: boolean;
    currentTagShaking?: boolean;
    callback?: () => void;
    forceUpdate?: boolean;
};

/**
 * SmartNodeSelector is a component that allows to create tags by selecting data from a tree structure.
 * The tree structure can also provide meta data that is displayed as color or icon.
 */
export default class SmartNodeSelectorComponent extends Component<SmartNodeSelectorPropsType> {
    protected suggestionTimer: ReturnType<typeof setTimeout> | undefined;
    protected shakingTimer: ReturnType<typeof setTimeout> | undefined;
    protected ref: React.RefObject<HTMLDivElement>;
    protected suggestionsRef: React.RefObject<HTMLDivElement>;
    protected refNumberOfTags: React.RefObject<HTMLDivElement>;
    protected tagFieldRef: React.RefObject<HTMLUListElement>;
    protected mouseButtonDown: boolean;
    protected mouseDownPosition: [number, number];
    protected selectionHasStarted: boolean;
    protected firstSelectedTagIndex: number;
    protected lastSelectedTagIndex: number;
    protected currentSelectionDirection: Direction;
    protected clipboardData: TreeNodeSelection[] | null;
    protected noUserInputSelect: boolean;
    protected mouseDownElement: HTMLElement | null;
    protected componentIsMounted: boolean;
    protected treeData: TreeData | null;
    protected numValidSelections: number;
    protected caseInsensitiveMatching: boolean;
    protected keyPressed: boolean;
    protected justUpdated: boolean;
    protected selectedNodes: string[] | null;
    protected blurEnabled: boolean;
    protected updateFromWithin: boolean;

    public state: SmartNodeSelectorStateType;
    public static propTypes: Record<string, unknown>;
    public static defaultProps: Partial<SmartNodeSelectorPropsType> = {
        maxNumSelectedNodes: -1,
        delimiter: ":",
        numMetaNodes: 0,
        showSuggestions: true,
        selectedTags: undefined,
        placeholder: "Add new tag...",
        numSecondsUntilSuggestionsAreShown: 0.5,
        lineBreakAfterTag: false,
        caseInsensitiveMatching: false,
        useBetaFeatures: false,
        persisted_props: ["selectedTags"],
        persistence_type: "local",
    };

    constructor(props: SmartNodeSelectorPropsType) {
        super(props);

        this.suggestionTimer = undefined;
        this.shakingTimer = undefined;
        this.ref = React.createRef();
        this.suggestionsRef = React.createRef();
        this.refNumberOfTags = React.createRef();
        this.tagFieldRef = React.createRef();
        this.mouseButtonDown = false;
        this.mouseDownPosition = [0, 0];
        this.selectionHasStarted = false;
        this.firstSelectedTagIndex = -1;
        this.lastSelectedTagIndex = -1;
        this.currentSelectionDirection = 0;
        this.clipboardData = null;
        this.noUserInputSelect = false;
        this.mouseDownElement = null;
        this.componentIsMounted = false;
        this.caseInsensitiveMatching = props.caseInsensitiveMatching || false;
        this.keyPressed = false;
        this.justUpdated = false;
        this.selectedNodes = null;
        this.blurEnabled = true;
        this.updateFromWithin = false;

        let error: string | undefined = undefined;

        if (props.delimiter.length !== 1) {
            error = "The delimiter must be a single character.";
            this.treeData = null;
        }

        const prohibitedDelimiters = ["|"];
        if (prohibitedDelimiters.includes(props.delimiter)) {
            error =
                "The delimiter must not be any of the following characters:\n" +
                prohibitedDelimiters.join(", ");
            this.treeData = null;
        }

        try {
            this.treeData = new TreeData({
                treeData: props.data,
                delimiter: props.delimiter,
                allowOrOperator: props.useBetaFeatures || false,
            });
        } catch (e) {
            this.treeData = null;
            error = e as string;
        }

        const nodeSelections: TreeNodeSelection[] = [];
        if (props.selectedTags !== undefined) {
            for (const tag of props.selectedTags) {
                const nodePath = tag.split(this.props.delimiter);
                nodeSelections.push(this.createNewNodeSelection(nodePath));
            }
        }
        if (
            nodeSelections.length < props.maxNumSelectedNodes ||
            props.maxNumSelectedNodes === -1
        ) {
            nodeSelections.push(this.createNewNodeSelection());
        }

        this.state = {
            nodeSelections,
            currentTagIndex: -1,
            suggestionsVisible: false,
            showAllSuggestions: false,
            hasError: error !== undefined,
            error: error || "",
            currentTagShaking: false,
        };

        if (error === undefined) {
            this.numValidSelections = this.countValidSelections();
        } else {
            this.numValidSelections = 0;
        }
    }

    componentDidMount(): void {
        this.componentIsMounted = true;
        document.addEventListener(
            "click",
            (e) => this.handleClickOutside(e),
            true
        );
        document.addEventListener(
            "mouseup",
            (e) => this.handleMouseUp(e),
            true
        );
        document.addEventListener(
            "mousemove",
            (e) => this.handleMouseMove(e),
            true
        );
        document.addEventListener(
            "keydown",
            (e) => this.handleGlobalKeyDown(e),
            true
        );
        if (!this.state.hasError) {
            this.updateSelectedTagsAndNodes(true);
        }
    }

    componentWillUnmount(): void {
        this.componentIsMounted = false;
        if (this.suggestionTimer) clearTimeout(this.suggestionTimer);
        if (this.shakingTimer) clearTimeout(this.shakingTimer);
        document.removeEventListener(
            "click",
            (e) => this.handleClickOutside(e),
            true
        );
        document.removeEventListener(
            "mouseup",
            (e) => this.handleMouseUp(e),
            true
        );
        document.removeEventListener(
            "mousemove",
            (e) => this.handleMouseMove(e),
            true
        );
        document.removeEventListener(
            "keydown",
            (e) => this.handleGlobalKeyDown(e),
            true
        );
    }

    componentDidUpdate(prevProps: SmartNodeSelectorPropsType): void {
        if (this.updateFromWithin) {
            this.updateFromWithin = false;
            return;
        }
        if (
            (this.props.data &&
                JSON.stringify(this.props.data) !==
                    JSON.stringify(prevProps.data)) ||
            (this.props.delimiter &&
                this.props.delimiter !== prevProps.delimiter)
        ) {
            let error: string | undefined;
            try {
                this.treeData = new TreeData({
                    treeData: this.props.data,
                    delimiter: this.props.delimiter,
                    allowOrOperator: this.props.useBetaFeatures || false,
                });
            } catch (e) {
                this.treeData = null;
                error = e as string;
            }
            const nodeSelections: TreeNodeSelection[] = [];
            for (const node of this.state.nodeSelections) {
                nodeSelections.push(
                    this.createNewNodeSelection(node.getNodePath())
                );
            }

            this.setState(
                {
                    nodeSelections: nodeSelections,
                    currentTagIndex: this.state.currentTagIndex,
                    currentTagShaking: this.state.currentTagShaking,
                    suggestionsVisible: this.state.suggestionsVisible,
                    showAllSuggestions: this.state.showAllSuggestions,
                    hasError: error !== undefined,
                    error: error || "",
                },
                () => {
                    this.updateSelectedTagsAndNodes();
                }
            );
        }
        const selectedTags = this.state.nodeSelections
            .filter((nodeSelection) => nodeSelection.isValid())
            .map((nodeSelection) =>
                nodeSelection.getCompleteNodePathAsString()
            );
        if (
            this.props.selectedTags &&
            JSON.stringify(this.props.selectedTags) !==
                JSON.stringify(selectedTags) &&
            JSON.stringify(prevProps.selectedTags) !==
                JSON.stringify(this.props.selectedTags)
        ) {
            const nodeSelections: TreeNodeSelection[] = [];
            if (this.props.selectedTags !== undefined) {
                for (const tag of this.props.selectedTags) {
                    const nodePath = tag.split(this.props.delimiter);
                    nodeSelections.push(this.createNewNodeSelection(nodePath));
                }
            }
            if (
                nodeSelections.length < this.props.maxNumSelectedNodes ||
                this.props.maxNumSelectedNodes === -1
            ) {
                nodeSelections.push(this.createNewNodeSelection());
            }
            this.numValidSelections = this.countValidSelections();
            this.updateState({ nodeSelections: nodeSelections });
        }
        this.justUpdated = true;
    }

    createNewNodeSelection(nodePath: string[] = [""]): TreeNodeSelection {
        return new TreeNodeSelection({
            focussedLevel: nodePath.length - 1,
            nodePath: nodePath,
            selected: false,
            delimiter: this.props.delimiter,
            numMetaNodes: this.props.numMetaNodes,
            treeData: this.treeData as TreeData,
            caseInsensitiveMatching: this.caseInsensitiveMatching,
            allowOrOperator: this.props.useBetaFeatures || false,
        });
    }

    lastNodeSelection(): TreeNodeSelection {
        return this.state.nodeSelections[this.countTags() - 1];
    }

    currentNodeSelection(): TreeNodeSelection {
        return this.state.nodeSelections[this.currentTagIndex()];
    }

    selectLastInput(
        e: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>
    ): void {
        if (!this.selectionHasStarted && this.countSelectedTags() === 0) {
            this.setFocusOnTagInput(this.countTags() - 1);
            e.preventDefault();
        }
        this.selectionHasStarted = false;
    }

    setFocusOnTagInput(
        index: number,
        setSelection: Direction | undefined = undefined
    ): void {
        if (index >= 0 && index < this.countTags()) {
            if (this.state.nodeSelections.length > index && index >= 0) {
                const inputField = (this.state.nodeSelections[
                    index
                ]?.getRef() as React.RefObject<HTMLInputElement>).current;
                if (inputField) {
                    inputField.focus();
                    if (setSelection !== undefined) {
                        inputField.setSelectionRange(
                            setSelection === Direction.Left
                                ? 0
                                : inputField.value.length,
                            setSelection === Direction.Left
                                ? 0
                                : inputField.value.length
                        );
                    }
                }
            }
            this.maybeShowSuggestions();
        }
    }

    currentTagIndex(): number {
        return this.state.currentTagIndex;
    }

    hasLastEmptyTag(): boolean {
        const lastTag = this.state.nodeSelections[
            this.state.nodeSelections.length - 1
        ];
        return !(lastTag.displayAsTag() || lastTag.isValid());
    }

    incrementCurrentTagIndex(
        callback: () => void = () => {
            return undefined;
        }
    ): boolean {
        if (this.currentTagIndex() < this.countTags() - 1) {
            this.updateState({
                currentTagIndex: this.currentTagIndex() + 1,
                callback: callback,
            });
            return true;
        }
        return false;
    }

    decrementCurrentTagIndex(
        callback: () => void = () => {
            return undefined;
        }
    ): boolean {
        if (this.currentTagIndex() > 0) {
            this.updateState({
                currentTagIndex: this.currentTagIndex() - 1,
                callback: callback,
            });
            return true;
        }
        return false;
    }

    nodeSelection(index: number): TreeNodeSelection {
        return this.state.nodeSelections[index];
    }

    countTags(): number {
        return this.state.nodeSelections.length;
    }

    countValidSelections(): number {
        let count = 0;
        let i = 0;
        for (const nodeSelection of this.state.nodeSelections) {
            count +=
                nodeSelection.isValid() &&
                !this.checkIfSelectionIsDuplicate(nodeSelection, i++)
                    ? nodeSelection.countExactlyMatchedNodePaths()
                    : 0;
        }
        return count;
    }

    focusCurrentTag(setSelection: Direction | undefined = undefined): void {
        this.setFocusOnTagInput(this.currentTagIndex(), setSelection);
    }

    doesStateChange({
        nodeSelections,
        currentTagIndex,
        suggestionsVisible,
        showAllSuggestions,
        currentTagShaking,
    }: SmartNodeSelectorSubStateType): boolean {
        let check = nodeSelections.length !== this.state.nodeSelections.length;
        if (nodeSelections.length === this.state.nodeSelections.length) {
            check =
                check ||
                nodeSelections.some(
                    (v, i) => !v.trulyEquals(this.state.nodeSelections[i])
                );
        }
        check = check || currentTagIndex !== this.currentTagIndex();
        check = check || suggestionsVisible !== this.state.suggestionsVisible;
        check = check || showAllSuggestions !== this.state.showAllSuggestions;
        check = check || currentTagShaking !== this.state.currentTagShaking;
        return check;
    }

    updateState({
        nodeSelections = undefined,
        currentTagIndex = undefined,
        suggestionsVisible = undefined,
        showAllSuggestions = undefined,
        currentTagShaking = undefined,
        callback = () => {
            return undefined;
        },
        forceUpdate = false,
    }: SmartNodeSelectorUpdateStateType): void {
        if (!this.componentIsMounted) return;

        if (
            this.currentTagIndex() > 0 &&
            currentTagIndex !== undefined &&
            this.currentNodeSelection() !== undefined &&
            currentTagIndex !== this.currentTagIndex()
        ) {
            this.nodeSelection(this.currentTagIndex()).setFocussedLevel(
                this.nodeSelection(this.currentTagIndex()).countLevel() - 1
            );
        }
        const newNodeSelections =
            nodeSelections === undefined
                ? this.state.nodeSelections
                : nodeSelections;
        const newTagIndex =
            currentTagIndex === undefined
                ? this.currentTagIndex()
                : currentTagIndex;
        const newSuggestionsVisible =
            suggestionsVisible === undefined
                ? this.state.suggestionsVisible
                : suggestionsVisible;
        const newShowAllSuggestions =
            showAllSuggestions === undefined
                ? this.state.showAllSuggestions
                : showAllSuggestions;

        let newCurrentTagShaking =
            currentTagShaking === undefined
                ? this.state.currentTagShaking
                : currentTagShaking;

        if (newTagIndex !== this.currentTagIndex()) {
            newCurrentTagShaking = false;
        }

        if (
            forceUpdate ||
            this.doesStateChange({
                nodeSelections: newNodeSelections,
                currentTagIndex: newTagIndex,
                suggestionsVisible: newSuggestionsVisible,
                showAllSuggestions: newShowAllSuggestions,
                currentTagShaking: newCurrentTagShaking,
            })
        ) {
            this.setState(
                {
                    nodeSelections: newNodeSelections,
                    currentTagIndex: newTagIndex,
                    suggestionsVisible: newSuggestionsVisible,
                    showAllSuggestions: newShowAllSuggestions,
                    currentTagShaking: newCurrentTagShaking,
                    hasError: this.state.hasError,
                    error: this.state.error,
                },
                () => {
                    callback();
                    this.updateSelectedTagsAndNodes();
                }
            );
        } else {
            callback();
            this.updateSelectedTagsAndNodes();
        }
    }

    maybeShowSuggestions(showAll = false): void {
        const { numSecondsUntilSuggestionsAreShown } = this.props;
        if (this.suggestionTimer) clearTimeout(this.suggestionTimer);
        if (
            (this.currentNodeSelection() !== undefined &&
                !this.currentNodeSelection().isValid()) ||
            showAll
        ) {
            this.suggestionTimer = setTimeout(
                () => this.showSuggestions(showAll),
                numSecondsUntilSuggestionsAreShown * 1000
            );
        }
    }

    showSuggestions(showAll = false): void {
        if (!document.activeElement || this.currentTagIndex() < 0) return;
        if (this.state.suggestionsVisible && !showAll) {
            return;
        }
        if (
            (this.currentNodeSelection().getRef() as React.RefObject<HTMLInputElement>)
                .current === document.activeElement
        ) {
            this.updateState({
                suggestionsVisible: true,
                showAllSuggestions: showAll,
            });
        }
    }

    hideSuggestions({
        callback = undefined,
        forceUpdate = undefined,
    }: {
        callback?: () => void;
        forceUpdate?: boolean;
    }): void {
        if (this.suggestionTimer) clearTimeout(this.suggestionTimer);
        this.updateState({
            suggestionsVisible: false,
            showAllSuggestions: false,
            callback: callback,
            forceUpdate: forceUpdate,
        });
    }

    useSuggestion(
        e: globalThis.KeyboardEvent | MouseEvent<HTMLDivElement>,
        suggestion: string
    ): void {
        const nodeSelection = this.currentNodeSelection();
        this.noUserInputSelect = true;

        nodeSelection.setNodeName(suggestion);
        nodeSelection.incrementFocussedLevel();

        let struct: SmartNodeSelectorUpdateStateType = {};
        if (
            nodeSelection.isValid() &&
            this.currentTagIndex() === this.countTags() - 1 &&
            this.canAddSelection()
        ) {
            struct = {
                nodeSelections: [
                    ...this.state.nodeSelections,
                    this.createNewNodeSelection(),
                ],
                currentTagIndex: this.currentTagIndex() + 1,
                callback: () => {
                    this.focusCurrentTag();
                    this.maybeShowSuggestions();
                },
            };
        } else {
            this.focusCurrentTag();
            struct.callback = () => {
                this.maybeShowSuggestions();
            };
        }
        struct.suggestionsVisible = false;
        struct.showAllSuggestions = false;
        this.updateState(struct);
        e.stopPropagation();
    }

    letMaxNumValuesBlink(): void {
        if (this.props.maxNumSelectedNodes !== 1) {
            let numBlinks = 0;
            const numberOfTagsDiv = (this
                .refNumberOfTags as React.RefObject<HTMLDivElement>)
                .current as HTMLDivElement;
            const blinkTimer = setInterval(() => {
                numBlinks++;
                if (numBlinks % 2 === 0) {
                    numberOfTagsDiv.classList.add("SmartNodeSelector__Warning");
                } else {
                    numberOfTagsDiv.classList.remove(
                        "SmartNodeSelector__Warning"
                    );
                }
                if (numBlinks === 7) {
                    clearInterval(blinkTimer);
                }
            }, 200);
        }
    }

    checkIfSelectionIsDuplicate(
        nodeSelection: TreeNodeSelection,
        index: number
    ): boolean {
        const duplicateSelections = this.state.nodeSelections.filter(
            (entry, i) =>
                i < index && entry.containsOrIsContainedBy(nodeSelection)
        );
        return duplicateSelections.length > 0;
    }

    blurActiveElement(): void {
        if (
            document.activeElement &&
            document.activeElement instanceof HTMLElement
        ) {
            (document.activeElement as HTMLElement).blur();
        }
    }

    handleClickOutside(event: globalThis.MouseEvent): void {
        if (this.state.hasError) {
            return;
        }
        const domNode = (this.tagFieldRef as React.RefObject<HTMLUListElement>)
            .current as HTMLUListElement;
        const suggestions = (this
            .suggestionsRef as React.RefObject<HTMLDivElement>)
            .current as HTMLDivElement;
        const eventTarget = event.target as Element;
        if (
            (!domNode || !domNode.contains(eventTarget)) &&
            (!suggestions || !suggestions.contains(eventTarget))
        ) {
            this.hideSuggestions({
                callback: () => {
                    if (!this.selectionHasStarted) {
                        this.unselectAllTags({});

                        this.updateState({ currentTagIndex: -1 });
                    }
                    this.selectionHasStarted = false;
                },
            });
        } else if (this.countSelectedTags() > 0) {
            this.updateState({ forceUpdate: true });
        }
    }

    handleGlobalKeyDown(e: globalThis.KeyboardEvent): void {
        if (this.state.hasError) {
            return;
        }
        this.handleTagSelection(e);
        if (
            (e.key === "Backspace" || e.key === "Delete") &&
            this.countSelectedTags() > 0
        ) {
            this.removeSelectedTags();
            e.preventDefault();
            e.stopPropagation();
        } else if (e.key === "c" && e.ctrlKey) {
            this.copyAllSelectedTags();
        }
    }

    handleMouseUp(e: globalThis.MouseEvent): void {
        this.mouseButtonDown = false;
        document.body.classList.remove("SmartNodeSelector__unselectable");
        if (this.countSelectedTags() > 0) {
            this.hideSuggestions({});
            this.blurActiveElement();
            e.stopPropagation();
            e.preventDefault();
        }
    }

    handleMouseDown(
        e: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>
    ): void {
        if (this.state.hasError) {
            return;
        }
        if (e.target instanceof HTMLElement)
            this.mouseDownElement = e.target as HTMLElement;
        else this.mouseDownElement = null;
        this.mouseDownPosition = [e.clientX, e.clientY];
        if (this.countSelectedTags() > 0) {
            this.unselectAllTags({});
            e.stopPropagation();
        } else {
            this.mouseButtonDown = true;
        }
    }

    handleMouseMove(e: globalThis.MouseEvent): void {
        if (!this.mouseButtonDown) return;

        const manhattanLength =
            Math.abs(this.mouseDownPosition[0] - e.clientX) +
            Math.abs(this.mouseDownPosition[1] - e.clientY);

        if (manhattanLength <= 3) return;

        const currentTarget = document.elementFromPoint(e.clientX, e.clientY);
        if (
            currentTarget &&
            currentTarget === this.mouseDownElement &&
            currentTarget.nodeName === "INPUT"
        ) {
            return;
        }

        this.hideSuggestions({});
        this.blurActiveElement();

        const domNode = this.tagFieldRef.current;
        if (!domNode) return;

        this.selectionHasStarted = true;

        document.body.classList.add("SmartNodeSelector__unselectable");
        const inputFieldBoundingRect = domNode.getBoundingClientRect();

        const top = Math.min(this.mouseDownPosition[1], e.clientY);
        const bottom = Math.max(this.mouseDownPosition[1], e.clientY);
        let left =
            this.mouseDownPosition[1] === top
                ? this.mouseDownPosition[0]
                : e.clientX;
        let right =
            this.mouseDownPosition[1] === top
                ? e.clientX
                : this.mouseDownPosition[0];
        if (Math.abs(top - bottom) < 30) {
            left = Math.min(this.mouseDownPosition[0], e.clientX);
            right = Math.max(this.mouseDownPosition[0], e.clientX);
        }

        let firstSelectedIndex = 99999999999;
        let lastSelectedIndex = -1;

        const tags = domNode.getElementsByClassName(
            "SmartNodeSelector__Border"
        );

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

    selectedTags(): TreeNodeSelection[] {
        return this.state.nodeSelections.filter((el) => el.isSelected());
    }

    countSelectedTags(): number {
        return this.selectedTags().length;
    }

    selectTag(index: number): void {
        this.blurActiveElement();
        if (this.nodeSelection(index).isEmpty()) index--;

        this.lastSelectedTagIndex = index;
        this.firstSelectedTagIndex = index;
        this.state.nodeSelections.map((nodeSelection, i) => {
            if (i === index) {
                nodeSelection.setSelected(true);
            }
        });
        this.hideSuggestions({ forceUpdate: true });
    }

    markTagsAsSelected(startIndex: number, endIndex: number): void {
        if (this.props.maxNumSelectedNodes !== 1) {
            this.state.nodeSelections.map((nodeSelection, index) => {
                if (index >= startIndex && index <= endIndex) {
                    nodeSelection.setSelected(true);
                } else {
                    nodeSelection.setSelected(false);
                }
            });
            this.updateState({ forceUpdate: true });
        }
    }

    unselectAllTags({
        newCurrentTagIndex = undefined,
        showSuggestions = false,
        focusInput = false,
    }: {
        newCurrentTagIndex?: number;
        showSuggestions?: boolean;
        focusInput?: boolean;
    }): void {
        this.state.nodeSelections.forEach((selection) =>
            selection.setSelected(false)
        );
        this.updateState({
            currentTagIndex:
                newCurrentTagIndex === undefined
                    ? this.countTags() - 1
                    : newCurrentTagIndex,
            callback: () => {
                if (showSuggestions) this.maybeShowSuggestions();
                if (focusInput) this.focusCurrentTag();
            },
        });
    }

    removeSelectedTags(): void {
        let newSelections = this.state.nodeSelections.filter(
            (tag) => !tag.isSelected()
        );
        const numRemovedTags = this.countTags() - newSelections.length;
        let newTagIndex = this.currentTagIndex();
        if (newTagIndex >= this.firstSelectedTagIndex) {
            newTagIndex = Math.max(0, newTagIndex - numRemovedTags);
        }
        if (
            newTagIndex === this.countTags() - this.selectedTags().length - 2 &&
            this.hasLastEmptyTag()
        ) {
            newTagIndex = this.countTags() - this.selectedTags().length - 1;
        }
        if (newSelections.length === 0 || !this.hasLastEmptyTag()) {
            newTagIndex = 0;
            newSelections = [...newSelections, this.createNewNodeSelection()];
        }
        this.updateState({
            nodeSelections: newSelections,
            currentTagIndex: newTagIndex,
            suggestionsVisible: false,
            showAllSuggestions: false,
            callback: () => this.focusCurrentTag(),
        });
    }

    removeTag(
        index: number,
        setNewFocus: boolean,
        e?: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
    ): void {
        let newSelections = [...this.state.nodeSelections];
        let newTagIndex =
            this.currentTagIndex() === index
                ? Math.max(this.countTags() - 2, 0)
                : this.currentTagIndex() -
                  (index < this.currentTagIndex() ? 1 : 0);
        newSelections.splice(index, 1);
        if (newSelections.length === 0) {
            newSelections = [this.createNewNodeSelection()];
        } else if (index === this.countTags() - 1) {
            if (!this.hasLastEmptyTag()) {
                newSelections = [
                    ...newSelections,
                    this.createNewNodeSelection(),
                ];
            }
            newTagIndex = this.countTags() - 1;
        }
        this.updateState({
            nodeSelections: newSelections,
            currentTagIndex: newTagIndex,
            callback: setNewFocus
                ? () => this.setFocusOnTagInput(newTagIndex)
                : undefined,
        });

        if (e) {
            e.stopPropagation();
        }
    }

    clearAllTags(
        e: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
    ): void {
        this.updateState({
            nodeSelections: [this.createNewNodeSelection()],
            currentTagIndex: 0,
            suggestionsVisible: false,
            showAllSuggestions: false,
            callback: () => {
                ((this.state.nodeSelections[0].getRef() as React.RefObject<HTMLInputElement>)
                    .current as HTMLInputElement).focus();
            },
        });
        e.stopPropagation();
        e.preventDefault();
    }

    handleTagSelection(e: globalThis.KeyboardEvent): void {
        if (e.shiftKey) {
            if (this.countSelectedTags() > 0) {
                let selectionChanged = false;
                if (e.key === "ArrowLeft") {
                    if (this.currentSelectionDirection === Direction.Left) {
                        this.firstSelectedTagIndex = Math.max(
                            0,
                            this.firstSelectedTagIndex - 1
                        );
                    } else {
                        this.lastSelectedTagIndex =
                            this.lastSelectedTagIndex - 1;
                    }
                    selectionChanged = true;
                } else if (e.key === "ArrowRight") {
                    if (this.currentSelectionDirection === Direction.Left) {
                        this.firstSelectedTagIndex =
                            this.firstSelectedTagIndex + 1;
                    } else {
                        this.lastSelectedTagIndex = Math.min(
                            this.countTags() - 1,
                            this.lastSelectedTagIndex + 1
                        );
                    }
                    selectionChanged = true;
                }
                if (selectionChanged) {
                    this.markTagsAsSelected(
                        this.firstSelectedTagIndex,
                        this.lastSelectedTagIndex
                    );
                }
                if (this.firstSelectedTagIndex > this.lastSelectedTagIndex) {
                    this.focusCurrentTag();
                }
            }
        } else if (this.countSelectedTags() > 0) {
            if (e.key === "ArrowRight") {
                const firstNotSelectedTagIndex = Math.min(
                    this.lastSelectedTagIndex + 1,
                    this.props.maxNumSelectedNodes - 1
                );
                if (
                    firstNotSelectedTagIndex > this.countTags() - 1 &&
                    this.canAddSelection()
                ) {
                    this.updateState({
                        nodeSelections: [
                            ...this.state.nodeSelections,
                            this.createNewNodeSelection(),
                        ],
                        currentTagIndex: this.currentTagIndex() + 1,
                    });
                } else {
                    this.updateState({
                        currentTagIndex: firstNotSelectedTagIndex,
                        callback: () => this.focusCurrentTag(),
                    });
                }
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    copyAllSelectedTags(): void {
        const selectedTags = this.selectedTags();
        this.clipboardData = selectedTags;
    }

    pasteTags(e: React.KeyboardEvent<HTMLInputElement>): void {
        if (this.clipboardData === null) return;
        const selections = this.clipboardData;
        if (selections && selections.length > 0) {
            const newSelections = _.cloneDeep(this.state.nodeSelections);
            if (this.lastNodeSelection().isEmpty()) {
                newSelections.pop();
            }
            for (const selection of selections) {
                if (
                    newSelections.length < this.props.maxNumSelectedNodes ||
                    this.props.maxNumSelectedNodes === -1
                ) {
                    newSelections.push(selection.clone());
                }
            }
            if (
                newSelections.length < this.props.maxNumSelectedNodes ||
                this.props.maxNumSelectedNodes === -1
            ) {
                newSelections.push(this.createNewNodeSelection());
            }
            this.updateState({
                nodeSelections: newSelections,
                currentTagIndex: newSelections.length - 1,
                suggestionsVisible: false,
                showAllSuggestions: false,
                callback: () => {
                    this.unselectAllTags({ focusInput: true });
                },
            });
        }
        e.preventDefault();
    }

    canAddSelection(): boolean {
        return (
            ((this.countValidSelections() < this.props.maxNumSelectedNodes &&
                this.countTags() < this.props.maxNumSelectedNodes) ||
                this.props.maxNumSelectedNodes === -1) &&
            this.props.maxNumSelectedNodes !== 1
        );
    }

    updateSelectedTagsAndNodes(initialUpdate = false): void {
        const { setProps, maxNumSelectedNodes } = this.props;
        const selectedTags: string[] = [];
        const selectedNodes: string[] = [];
        const selectedIds: string[] = [];
        loop1: for (let i = 0; i < this.countTags(); i++) {
            const nodeSelection = this.nodeSelection(i);
            if (nodeSelection.getCompleteNodePathAsString() !== "") {
                selectedTags.push(nodeSelection.getCompleteNodePathAsString());
            }
            if (
                nodeSelection.isValid() &&
                !this.checkIfSelectionIsDuplicate(nodeSelection, i)
            ) {
                const matchedNodePaths = nodeSelection.exactlyMatchedNodePaths();
                for (let j = 0; j < matchedNodePaths.length; j++) {
                    if (
                        selectedNodes.length >= maxNumSelectedNodes &&
                        maxNumSelectedNodes > 0
                    ) {
                        break loop1;
                    }
                    selectedNodes.push(matchedNodePaths[j]);
                    selectedIds.push(nodeSelection.getId() || "");
                }
            }
        }
        if (
            !this.selectedNodes ||
            selectedNodes.length !== this.selectedNodes.length ||
            JSON.stringify(this.selectedNodes) !== JSON.stringify(selectedNodes)
        ) {
            if (!initialUpdate) {
                this.updateFromWithin = true;
            }
            setProps({
                selectedTags: selectedTags,
                selectedNodes: selectedNodes,
                selectedIds: selectedIds,
            });
            this.selectedNodes = selectedNodes;
        }
        this.numValidSelections = this.countValidSelections();
    }

    debugOutput(): React.ReactNode | null {
        if (this.currentNodeSelection()) {
            return (
                <div>
                    <label>
                        Current Tag Index: {this.currentTagIndex()}
                        <br />
                    </label>
                    <label>
                        Current Node Selection:{" "}
                        {this.currentNodeSelection().getNodePath()}
                        <br />
                    </label>
                    <label>
                        Currently Focussed Level:{" "}
                        {this.currentNodeSelection().getFocussedLevel()}
                    </label>
                </div>
            );
        } else {
            return null;
        }
    }

    handleInputSelect(
        e: React.SyntheticEvent<HTMLInputElement, Event>,
        index: number
    ): void {
        if (this.noUserInputSelect) {
            this.noUserInputSelect = false;
            return;
        }
        const eventTarget = e.target as HTMLInputElement;
        if (!eventTarget) {
            return;
        }
        this.hideSuggestions({});
        const val = eventTarget.value;
        const tag = this.nodeSelection(index);
        const previouslyFocussedLevel = tag.getFocussedLevel();
        if (
            eventTarget.selectionStart !== null &&
            eventTarget.selectionEnd !== null
        ) {
            if (!tag.isFocusOnMetaData()) {
                tag.setFocussedLevel(
                    val
                        .slice(0, eventTarget.selectionStart)
                        .split(this.props.delimiter).length - 1,
                    false
                );
            }
            const selection = eventTarget.value.substring(
                eventTarget.selectionStart,
                eventTarget.selectionEnd
            );
            if (selection.includes(this.props.delimiter)) {
                if (eventTarget.selectionDirection === "backward") {
                    eventTarget.setSelectionRange(
                        eventTarget.selectionStart +
                            selection.indexOf(this.props.delimiter) +
                            1,
                        eventTarget.selectionEnd
                    );
                } else {
                    eventTarget.setSelectionRange(
                        eventTarget.selectionStart,
                        eventTarget.selectionStart +
                            selection.indexOf(this.props.delimiter)
                    );
                }
            }
            this.state.nodeSelections.forEach((v) => v.setSelected(false));
            const showAllSuggestions =
                previouslyFocussedLevel !== tag.getFocussedLevel();
            this.updateState({
                currentTagIndex: index,
                callback: () => {
                    this.maybeShowSuggestions(showAllSuggestions);
                },
                forceUpdate: tag.getFocussedLevel() !== previouslyFocussedLevel,
            });
        }
        e.stopPropagation();
    }

    handleEnterKeyEvent(
        e: React.KeyboardEvent<HTMLInputElement>,
        eventType: KeyEventType
    ): void {
        const eventTarget = e.target as HTMLInputElement;
        if (!eventTarget) {
            return;
        }
        const val = eventTarget.value;
        if (
            eventType === KeyEventType.KeyDown &&
            val &&
            !this.hasLastEmptyTag() &&
            this.currentTagIndex() === this.countTags() - 1 &&
            this.currentNodeSelection().isComplete()
        ) {
            if (this.canAddSelection()) {
                this.updateState({
                    nodeSelections: [
                        ...this.state.nodeSelections,
                        this.createNewNodeSelection(),
                    ],
                });
            } else {
                this.letMaxNumValuesBlink();
            }
        } else if (eventType === KeyEventType.KeyUp) {
            if (this.currentNodeSelection().isComplete()) {
                if (this.currentTagIndex() === this.countTags() - 1) {
                    this.focusCurrentTag();
                } else {
                    this.incrementCurrentTagIndex(() =>
                        this.setFocusOnTagInput(this.currentTagIndex())
                    );
                }
            }
        }
    }

    handleArrowRightKeyEvent(
        e: React.KeyboardEvent<HTMLInputElement>,
        eventType: KeyEventType
    ): void {
        const eventTarget = e.target as HTMLInputElement;
        if (!eventTarget) {
            return;
        }
        const val = eventTarget.value;
        if (
            eventType === KeyEventType.KeyDown &&
            eventTarget.selectionEnd === eventTarget.value.length &&
            !e.repeat &&
            val
        ) {
            if (e.shiftKey) {
                if (this.currentTagIndex() < this.countTags() - 1) {
                    this.selectTag(this.currentTagIndex());
                    this.currentSelectionDirection = Direction.Right;
                }
                e.preventDefault();
            } else {
                if (
                    this.currentNodeSelection().getFocussedLevel() ===
                    this.currentNodeSelection().countLevel() - 1
                ) {
                    if (
                        this.currentTagIndex() === this.countTags() - 1 &&
                        !this.hasLastEmptyTag() &&
                        this.canAddSelection() &&
                        this.currentNodeSelection().isComplete()
                    ) {
                        this.updateState({
                            nodeSelections: [
                                ...this.state.nodeSelections,
                                this.createNewNodeSelection(),
                            ],
                            currentTagIndex: this.currentTagIndex() + 1,
                        });
                    } else if (
                        this.currentTagIndex() !==
                        this.countTags() - 1
                    ) {
                        this.incrementCurrentTagIndex(() =>
                            this.focusCurrentTag(Direction.Left)
                        );
                        e.preventDefault();
                    }
                } else if (
                    this.currentNodeSelection().getFocussedLevel() <
                    this.currentNodeSelection().countLevel() - 1
                ) {
                    this.currentNodeSelection().incrementFocussedLevel();
                    this.updateState({
                        showAllSuggestions: true,
                        forceUpdate: true,
                        callback: () => {
                            const input = (this.currentNodeSelection()?.getRef() as React.RefObject<HTMLInputElement>)
                                ?.current;
                            if (input) {
                                input.setSelectionRange(0, 0);
                            }
                        },
                    });
                    e.preventDefault();
                }
            }
        } else if (eventType === KeyEventType.KeyUp) {
            if (eventTarget.selectionStart === eventTarget.value.length) {
                this.focusCurrentTag();
            }
        }
    }

    handleArrowLeftKeyEvent(
        e: React.KeyboardEvent<HTMLInputElement>,
        eventType: KeyEventType
    ): void {
        const eventTarget = e.target as HTMLInputElement;
        if (!eventTarget) {
            return;
        }
        if (eventType === KeyEventType.KeyDown && !e.repeat) {
            if (
                e.shiftKey &&
                eventTarget.selectionStart === 0 &&
                eventTarget.selectionEnd === 0
            ) {
                if (this.currentTagIndex() > 0) {
                    if (!this.currentNodeSelection().displayAsTag()) {
                        this.selectTag(this.currentTagIndex() - 1);
                    } else {
                        this.selectTag(this.currentTagIndex());
                    }
                    this.currentSelectionDirection = Direction.Left;
                } else {
                    if (this.currentNodeSelection().displayAsTag()) {
                        this.selectTag(this.currentTagIndex());
                    }
                }
                e.preventDefault();
            } else {
                if (
                    eventTarget.selectionStart === 0 &&
                    eventTarget.selectionEnd === 0
                ) {
                    if (
                        this.currentNodeSelection() &&
                        this.currentNodeSelection().getFocussedLevel() === 0
                    ) {
                        if (this.currentTagIndex() > 0) {
                            this.decrementCurrentTagIndex(() => {
                                this.focusCurrentTag(Direction.Right);
                            });
                        }
                        e.preventDefault();
                    } else {
                        this.currentNodeSelection().decrementFocussedLevel();
                        this.updateState({
                            showAllSuggestions: true,
                            forceUpdate: true,
                        });
                        e.preventDefault();
                    }
                }
            }
        } else if (eventType === KeyEventType.KeyUp) {
            if (eventTarget.selectionStart === 0) {
                this.focusCurrentTag();
            }
        }
    }

    handleBackspaceKeyEvent(
        e: React.KeyboardEvent<HTMLInputElement>,
        eventType: KeyEventType
    ): void {
        const eventTarget = e.target as HTMLInputElement;
        if (!eventTarget) {
            return;
        }
        if (this.countSelectedTags() > 0) {
            e.preventDefault();
            return;
        }
        const val = eventTarget.value;
        if (eventType === KeyEventType.KeyDown) {
            if (
                this.currentNodeSelection().getFocussedLevel() > 0 &&
                (val === "" ||
                    (!this.currentNodeSelection().isFocusOnMetaData() &&
                        val.slice(-1) === this.props.delimiter))
            ) {
                if (e.repeat) {
                    e.preventDefault();
                    return;
                }
                this.currentNodeSelection().decrementFocussedLevel();
                this.updateState({
                    showAllSuggestions: true,
                    forceUpdate: true,
                });
                e.preventDefault();
            } else if (
                this.currentNodeSelection().getFocussedLevel() === 0 &&
                val === "" &&
                !e.repeat &&
                this.currentTagIndex() > 0
            ) {
                this.decrementCurrentTagIndex(() => this.focusCurrentTag());
            }
        }
    }

    handleDeleteKeyEvent(
        e: React.KeyboardEvent<HTMLInputElement>,
        eventType: KeyEventType
    ): void {
        const eventTarget = e.target as HTMLInputElement;
        if (!eventTarget) {
            return;
        }
        if (this.countSelectedTags() > 0) {
            e.preventDefault();
            return;
        }
        const val = eventTarget.value;
        if (eventType === KeyEventType.KeyDown) {
            if (
                eventTarget.selectionStart !== null &&
                eventTarget.selectionEnd !== null &&
                eventTarget.selectionStart === eventTarget.selectionEnd &&
                Math.max(
                    eventTarget.selectionStart,
                    eventTarget.selectionEnd
                ) !== val.length &&
                val.charAt(
                    Math.max(
                        eventTarget.selectionStart,
                        eventTarget.selectionEnd
                    )
                ) === this.props.delimiter
            ) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
    }

    handleVKeyEvent(
        e: React.KeyboardEvent<HTMLInputElement>,
        eventType: KeyEventType
    ): void {
        if (
            eventType === KeyEventType.KeyDown &&
            e.ctrlKey &&
            this.currentTagIndex() === this.countTags() - 1
        ) {
            this.pasteTags(e);
        }
    }

    letCurrentTagShake(): void {
        this.updateState({
            currentTagShaking: true,
            callback: () => {
                if (this.shakingTimer) clearTimeout(this.shakingTimer);
                this.shakingTimer = setTimeout(
                    () =>
                        this.updateState({
                            currentTagShaking: false,
                        }),
                    300
                );
            },
        });
    }

    handleDelimiterKeyEvent(
        e: React.KeyboardEvent<HTMLInputElement>,
        eventType: KeyEventType
    ): void {
        const eventTarget = e.target as HTMLInputElement;
        if (!eventTarget) {
            return;
        }
        const val = eventTarget.value;
        if (eventType === KeyEventType.KeyDown) {
            if (e.repeat) {
                e.preventDefault();
            } else if (val) {
                if (this.currentNodeSelection().isFocusOnMetaData()) {
                    this.currentNodeSelection().setNodeName(val);
                    if (this.currentNodeSelection().incrementFocussedLevel()) {
                        this.updateState({ forceUpdate: true });
                    } else {
                        this.letCurrentTagShake();
                    }
                    e.preventDefault();
                } else if (
                    !this.currentNodeSelection().isValid() ||
                    this.currentNodeSelection().containsWildcard()
                ) {
                    const modifiedVal = val + this.props.delimiter;
                    this.currentNodeSelection().setNodeName(
                        modifiedVal.split(this.props.delimiter)[
                            this.currentNodeSelection().getFocussedLevel() -
                                this.currentNodeSelection().getNumMetaNodes()
                        ]
                    );
                    if (this.currentNodeSelection().incrementFocussedLevel()) {
                        this.updateState({ forceUpdate: true });
                    } else {
                        this.letCurrentTagShake();
                    }
                    e.preventDefault();
                } else {
                    this.letCurrentTagShake();
                    e.preventDefault();
                }
            }
        }
    }

    handleTabKeyEvent(
        e: React.KeyboardEvent<HTMLInputElement>,
        eventType: KeyEventType
    ): void {
        if (eventType === KeyEventType.KeyDown) {
            if (e.shiftKey) {
                this.decrementCurrentTagIndex(() => this.focusCurrentTag());
            } else {
                this.incrementCurrentTagIndex(() => this.focusCurrentTag());
            }
        }
        e.preventDefault();
    }

    handleHomeKeyEvent(
        e: React.KeyboardEvent<HTMLInputElement>,
        eventType: KeyEventType
    ): void {
        const eventTarget = e.target as HTMLInputElement;
        if (!eventTarget) {
            return;
        }
        const val = eventTarget.value;
        if (eventType === KeyEventType.KeyDown) {
            if (e.shiftKey && eventTarget.selectionStart === 0) {
                this.firstSelectedTagIndex = 0;
                if (
                    this.currentNodeSelection().getCompleteNodePathAsString() ===
                        "" ||
                    this.currentNodeSelection().getFocussedLevel() === 0
                ) {
                    this.lastSelectedTagIndex = this.currentTagIndex() - 1;
                } else {
                    this.lastSelectedTagIndex = this.currentTagIndex();
                }
                this.markTagsAsSelected(
                    this.firstSelectedTagIndex,
                    this.lastSelectedTagIndex
                );
                this.blurActiveElement();
                this.hideSuggestions({});
                e.preventDefault();
            } else if (!e.shiftKey) {
                let cursorPosition = eventTarget.selectionStart;
                if (cursorPosition !== null) {
                    cursorPosition = Math.max(0, cursorPosition - 1);
                    while (cursorPosition > 0) {
                        if (
                            val.substr(cursorPosition, 1) ===
                            this.props.delimiter
                        ) {
                            cursorPosition++;
                            break;
                        }
                        cursorPosition--;
                    }
                    eventTarget.setSelectionRange(
                        cursorPosition,
                        cursorPosition
                    );
                    e.preventDefault();
                }
            }
        }
    }

    handleEndKeyEvent(
        e: React.KeyboardEvent<HTMLInputElement>,
        eventType: KeyEventType
    ): void {
        const eventTarget = e.target as HTMLInputElement;
        if (!eventTarget) {
            return;
        }
        const val = eventTarget.value;
        if (eventType === KeyEventType.KeyDown) {
            if (
                e.shiftKey &&
                eventTarget.selectionEnd === val.length &&
                this.currentNodeSelection().getFocussedLevel() ===
                    this.currentNodeSelection().countLevel() - 1
            ) {
                this.firstSelectedTagIndex = this.currentTagIndex() + 1;
                this.lastSelectedTagIndex =
                    this.countTags() - (this.hasLastEmptyTag() ? 2 : 1);
                this.markTagsAsSelected(
                    this.firstSelectedTagIndex,
                    this.lastSelectedTagIndex
                );
                this.blurActiveElement();
                this.hideSuggestions({});
                e.preventDefault();
            } else if (!e.shiftKey) {
                let cursorPosition = eventTarget.selectionStart;
                if (cursorPosition !== null) {
                    while (cursorPosition < val.length) {
                        if (
                            val.substr(cursorPosition, 1) ===
                            this.props.delimiter
                        ) {
                            break;
                        }
                        cursorPosition++;
                    }
                    eventTarget.setSelectionRange(
                        cursorPosition,
                        cursorPosition
                    );
                    e.preventDefault();
                }
            }
        }
    }

    handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
        this.keyPressed = true;
        switch (e.key) {
            case "Enter":
                this.handleEnterKeyEvent(e, KeyEventType.KeyDown);
                break;
            case "ArrowRight":
                this.handleArrowRightKeyEvent(e, KeyEventType.KeyDown);
                break;
            case "ArrowLeft":
                this.handleArrowLeftKeyEvent(e, KeyEventType.KeyDown);
                break;
            case "ArrowUp":
            case "ArrowDown":
                e.preventDefault();
                break;
            case "Backspace":
                this.handleBackspaceKeyEvent(e, KeyEventType.KeyDown);
                break;
            case "Delete":
                this.handleDeleteKeyEvent(e, KeyEventType.KeyDown);
                break;
            case "v":
                this.handleVKeyEvent(e, KeyEventType.KeyDown);
                break;
            case this.props.delimiter:
                this.handleDelimiterKeyEvent(e, KeyEventType.KeyDown);
                break;
            case "Tab":
                this.handleTabKeyEvent(e, KeyEventType.KeyDown);
                break;
            case "Home":
                this.handleHomeKeyEvent(e, KeyEventType.KeyDown);
                break;
            case "End":
                this.handleEndKeyEvent(e, KeyEventType.KeyDown);
                break;
            case "z":
            case "y":
                if (e.ctrlKey) e.preventDefault();
                break;
        }
    }

    handleInputKeyUp(e: React.KeyboardEvent<HTMLInputElement>): void {
        if (e.key === this.props.delimiter && this.justUpdated) {
            this.justUpdated = false;
            e.preventDefault();
            return;
        }
        switch (e.key) {
            case "Enter":
                this.handleEnterKeyEvent(e, KeyEventType.KeyUp);
                break;
            case "ArrowRight":
                this.handleArrowRightKeyEvent(e, KeyEventType.KeyUp);
                break;
            case "ArrowLeft":
                this.handleArrowLeftKeyEvent(e, KeyEventType.KeyUp);
                break;
            case "ArrowUp":
            case "ArrowDown":
                e.preventDefault();
                break;
            case "Tab":
                this.handleTabKeyEvent(e, KeyEventType.KeyUp);
                break;
            case "Home":
                this.handleHomeKeyEvent(e, KeyEventType.KeyUp);
                break;
            case "End":
                this.handleEndKeyEvent(e, KeyEventType.KeyUp);
                break;
            case " ":
                if (e.ctrlKey) {
                    this.showSuggestions(true);
                }
                break;
        }
    }

    getSelectedInputNode(value: string, selectionStart: number | null): string {
        const split = value.split(this.props.delimiter);
        if (selectionStart !== null) {
            let index = 0;
            let charCount = 0;
            while (index < split.length) {
                if (charCount + split[index].length >= selectionStart) {
                    return split[index];
                }
                charCount += split[index].length + 1;
                index++;
            }
            return value;
        } else {
            return split[split.length - 1];
        }
    }

    handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
        if (!e.target) {
            return;
        }
        const value = e.target.value;
        const focussedValue = this.getSelectedInputNode(
            e.target.value,
            e.target.selectionStart
        );
        const tag = this.currentNodeSelection();
        if (!tag) {
            return;
        }
        const oldValue = tag.getFocussedNodeName();

        if (tag.isFocusOnMetaData()) {
            tag.setNodeName(value);
        } else {
            let i = tag.getNumMetaNodes();
            for (const d of value.split(this.props.delimiter)) {
                tag.setNodeName(d, i++);
            }
        }

        if (
            tag.getCompleteNodePathAsString() === "" &&
            this.currentTagIndex() === this.countTags() - 2 &&
            this.lastNodeSelection().getCompleteNodePathAsString() === ""
        ) {
            this.removeTag(this.currentTagIndex(), true);
        }

        this.updateState({ showAllSuggestions: false, forceUpdate: true });

        if (
            !tag.hasAvailableChildNodes() &&
            !tag.isValid() &&
            oldValue.length < focussedValue.length
        ) {
            this.letCurrentTagShake();
        }

        this.maybeShowSuggestions();
    }

    handleInputBlur(index: number): void {
        if (!this.blurEnabled) {
            return;
        }
        const nodeSelection = this.state.nodeSelections[index];
        nodeSelection.setFocussedLevel(nodeSelection.countLevel() - 1);
        if (nodeSelection.isEmpty() && index < this.countTags() - 1) {
            this.removeTag(index, false);
        }
    }

    render(): React.ReactNode {
        const {
            id,
            label,
            maxNumSelectedNodes,
            placeholder,
            showSuggestions,
            lineBreakAfterTag,
        } = this.props;
        const {
            nodeSelections,
            suggestionsVisible,
            showAllSuggestions,
            hasError,
            error,
        } = this.state;

        if (hasError) {
            return (
                <div
                    id={id}
                    ref={this.ref}
                    className="SmartNodeSelector--Error"
                >
                    <strong>SmartNodeSelector</strong>
                    <br />
                    {error.split("\n").map((item) => (
                        <>
                            {item}
                            <br />
                        </>
                    ))}
                </div>
            );
        }

        const frameless = maxNumSelectedNodes === 1;

        return (
            <div id={id} ref={this.ref}>
                {label && <label>{label}</label>}
                <div
                    className={classNames({
                        SmartNodeSelector: true,
                        "SmartNodeSelector--frameless": frameless,
                        "SmartNodeSelector--SuggestionsActive": suggestionsVisible,
                        "SmartNodeSelector--Invalid":
                            maxNumSelectedNodes > 0 &&
                            this.countValidSelections() > maxNumSelectedNodes,
                    })}
                    onClick={(e) => this.selectLastInput(e)}
                    onMouseDown={(e) => this.handleMouseDown(e)}
                >
                    <ul
                        className={
                            !lineBreakAfterTag
                                ? "SmartNodeSelector__Tags--nolinebreak"
                                : ""
                        }
                        ref={this.tagFieldRef}
                        style={frameless ? { width: "100%" } : {}}
                    >
                        {nodeSelections.map((selection, index) => (
                            <Tag
                                key={`${index}`}
                                index={index}
                                frameless={frameless}
                                active={index === this.currentTagIndex()}
                                placeholder={
                                    placeholder ? placeholder : "Add new tag"
                                }
                                treeNodeSelection={selection}
                                countTags={this.countTags()}
                                currentTag={index === this.currentTagIndex()}
                                checkIfDuplicate={(nodeSelection, index) =>
                                    this.checkIfSelectionIsDuplicate(
                                        nodeSelection,
                                        index
                                    )
                                }
                                inputKeyDown={(e) => this.handleInputKeyDown(e)}
                                inputKeyUp={(e) => this.handleInputKeyUp(e)}
                                inputChange={(e) => this.handleInputChange(e)}
                                inputSelect={(e, index) =>
                                    this.handleInputSelect(e, index)
                                }
                                inputBlur={(index) =>
                                    this.handleInputBlur(index)
                                }
                                hideSuggestions={(cb) =>
                                    this.hideSuggestions({ callback: cb })
                                }
                                removeTag={(e, index) =>
                                    this.removeTag(index, true, e)
                                }
                                updateSelectedTagsAndNodes={() =>
                                    this.updateSelectedTagsAndNodes()
                                }
                                shake={
                                    this.state.currentTagShaking &&
                                    index === this.currentTagIndex()
                                }
                                enableInputBlur={() =>
                                    (this.blurEnabled = true)
                                }
                                disableInputBlur={() =>
                                    (this.blurEnabled = false)
                                }
                            />
                        ))}
                    </ul>
                    <div className="SmartNodeSelector__ClearAll">
                        <button
                            type="button"
                            title="Clear all"
                            onClick={(e) => this.clearAllTags(e)}
                            disabled={
                                this.countTags() <= 1 && this.hasLastEmptyTag()
                            }
                        />
                    </div>
                    {showSuggestions && (
                        <Suggestions
                            suggestionsRef={this.suggestionsRef}
                            tagInputFieldRef={this.tagFieldRef}
                            visible={
                                suggestionsVisible &&
                                this.currentTagIndex() >= 0
                            }
                            useSuggestion={(e, suggestion) =>
                                this.useSuggestion(e, suggestion)
                            }
                            treeNodeSelection={this.currentNodeSelection()}
                            showAllSuggestions={showAllSuggestions}
                            enableInputBlur={() => (this.blurEnabled = true)}
                            disableInputBlur={() => (this.blurEnabled = false)}
                        />
                    )}
                </div>
                {maxNumSelectedNodes > 1 && (
                    <div
                        className={classNames({
                            SmartNodeSelector__NumberOfTags: true,
                            SmartNodeSelector__Error:
                                this.countValidSelections() >
                                maxNumSelectedNodes,
                        })}
                        ref={this.refNumberOfTags}
                    >
                        Selected {this.countValidSelections()} of{" "}
                        {maxNumSelectedNodes}
                    </div>
                )}
            </div>
        );
    }
}

SmartNodeSelectorComponent.propTypes = {
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
    label: PropTypes.string,

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
     * Selected tags.
     */
    selectedTags: PropTypes.arrayOf(PropTypes.string),

    /**
     * Placeholder text for input field.
     */
    placeholder: PropTypes.string,

    /**
     * Number of seconds until suggestions are shown.
     */
    numSecondsUntilSuggestionsAreShown: PropTypes.number,

    /**
     * If set to true, tags will be separated by a line break.
     */
    lineBreakAfterTag: PropTypes.bool,

    /**
     * Set to true if case-wise incorrect values should be accepted anyways.
     */
    caseInsensitiveMatching: PropTypes.bool,

    /**
     * Set to true to enable beta features.
     */
    useBetaFeatures: PropTypes.bool,

    /**
     * Used to allow user interactions in this component to be persisted when
     * the component - or the page - is refreshed. If `persisted` is truthy and
     * hasn't changed from its previous value, a `value` that the user has
     * changed while using the app will keep that change, as long as
     * the new `value` also matches what was given originally.
     * Used in conjunction with `persistence_type`.
     */
    persistence: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.string,
        PropTypes.number,
    ]),

    /**
     * Properties whose user interactions will persist after refreshing the
     * component or the page. Since only `value` is allowed this prop can
     * normally be ignored.
     */
    persisted_props: PropTypes.arrayOf(PropTypes.oneOf(["selectedTags"])),

    /**
     * Where persisted user changes will be stored:
     * memory: only kept in memory, reset on page refresh.
     * local: window.localStorage, data is kept after the browser quit.
     * session: window.sessionStorage, data is cleared once the browser quit.
     */
    persistence_type: PropTypes.oneOf(["local", "session", "memory"]),
};
