/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component, MouseEvent } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import "./SmartNodeSelector.css";
import TreeNodeSelection from "../utils/TreeNodeSelection";
import TreeData from "../utils/TreeData";
import { TreeDataNode } from "../utils/TreeDataNodeTypes";
import Suggestions from "./Suggestions";
import Tag from "./Tag";

enum Direction {
    Left = 0,
    Right,
}

type ParentProps = {
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
    persistence: boolean | string | number;
    persisted_props: "selectedTags"[];
    persistence_type: "local" | "session" | "memory";
};

type SmartNodeSelectorStateType = {
    nodeSelections: TreeNodeSelection[];
    currentTagIndex: number;
    suggestionsVisible: boolean;
    hasError: boolean;
    error: string;
};

type SmartNodeSelectorSubStateType = {
    nodeSelections: TreeNodeSelection[];
    currentTagIndex: number;
    suggestionsVisible: boolean;
};

type SmartNodeSelectorUpdateStateType = {
    nodeSelections?: TreeNodeSelection[];
    currentTagIndex?: number;
    suggestionsVisible?: boolean;
    callback?: () => void;
    forceUpdate?: boolean;
};

/**
 * SmartNodeSelector is a component that allows to create tags by selecting data from a tree structure.
 * The tree structure can also provide meta data that is displayed as color or icon.
 */
export default class SmartNodeSelectorComponent extends Component<SmartNodeSelectorPropsType> {
    protected suggestionTimer: ReturnType<typeof setTimeout> | undefined;
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
        persisted_props: ["selectedTags"],
        persistence_type: "local",
    };

    constructor(props: SmartNodeSelectorPropsType) {
        super(props);

        this.suggestionTimer = undefined;
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

        let error: string | undefined;
        try {
            this.treeData = new TreeData({
                treeData: props.data,
                delimiter: props.delimiter,
            });
        } catch (e) {
            this.treeData = null;
            error = e;
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
            currentTagIndex: 0,
            suggestionsVisible: false,
            hasError: error !== undefined,
            error: error || "",
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
    }

    componentWillUnmount(): void {
        this.componentIsMounted = false;
        if (this.suggestionTimer) clearTimeout(this.suggestionTimer);
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
                });
            } catch (e) {
                this.treeData = null;
                error = e;
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
                    suggestionsVisible: this.state.suggestionsVisible,
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
    }

    createNewNodeSelection(nodePath: string[] = [""]): TreeNodeSelection {
        return new TreeNodeSelection({
            focussedLevel: nodePath.length - 1,
            nodePath: nodePath,
            selected: false,
            delimiter: this.props.delimiter,
            numMetaNodes: this.props.numMetaNodes,
            treeData: this.treeData as TreeData,
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
        if (!this.selectionHasStarted && this.countSelectedTags() == 0) {
            this.setFocusOnTagInput(this.countTags() - 1);
            e.preventDefault();
        }
        this.selectionHasStarted = false;
    }

    setFocusOnTagInput(index: number): void {
        if (index >= 0 && index < this.countTags()) {
            if (this.state.nodeSelections.length > index && index >= 0) {
                ((this.state.nodeSelections[
                    index
                ].getRef() as React.RefObject<HTMLInputElement>)
                    .current as HTMLInputElement).focus();
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
        for (const nodeSelection of this.state.nodeSelections) {
            count += nodeSelection.isValid()
                ? nodeSelection.countExactlyMatchedNodePaths()
                : 0;
        }
        return count;
    }

    focusCurrentTag(): void {
        this.setFocusOnTagInput(this.currentTagIndex());
    }

    doesStateChange({
        nodeSelections,
        currentTagIndex,
        suggestionsVisible,
    }: SmartNodeSelectorSubStateType): boolean {
        let check = nodeSelections.length !== this.state.nodeSelections.length;
        if (nodeSelections.length === this.state.nodeSelections.length) {
            check =
                check ||
                nodeSelections.some(
                    (v, i) => !v.trulyEquals(this.state.nodeSelections[i])
                );
        }
        check = check || currentTagIndex != this.currentTagIndex();
        check = check || suggestionsVisible != this.state.suggestionsVisible;
        return check;
    }

    updateState({
        nodeSelections = undefined,
        currentTagIndex = undefined,
        suggestionsVisible = undefined,
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
            currentTagIndex != this.currentTagIndex()
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

        if (
            forceUpdate ||
            this.doesStateChange({
                nodeSelections: newNodeSelections,
                currentTagIndex: newTagIndex,
                suggestionsVisible: newSuggestionsVisible,
            })
        ) {
            this.setState(
                {
                    nodeSelections: newNodeSelections,
                    currentTagIndex: newTagIndex,
                    suggestionsVisible: newSuggestionsVisible,
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

    maybeShowSuggestions(): void {
        const { numSecondsUntilSuggestionsAreShown } = this.props;
        if (this.suggestionTimer) clearTimeout(this.suggestionTimer);
        if (
            this.currentNodeSelection() !== undefined &&
            !this.currentNodeSelection().isValid()
        ) {
            this.suggestionTimer = setTimeout(
                () => this.showSuggestions(),
                numSecondsUntilSuggestionsAreShown * 1000
            );
        }
    }

    showSuggestions(): void {
        if (!document.activeElement || this.currentTagIndex() < 0) return;
        if (
            (this.currentNodeSelection().getRef() as React.RefObject<HTMLInputElement>)
                .current === document.activeElement
        ) {
            this.updateState({ suggestionsVisible: true });
        }
    }

    hideSuggestions(callback?: () => void): void {
        if (this.suggestionTimer) clearTimeout(this.suggestionTimer);
        this.updateState({ suggestionsVisible: false, callback: callback });
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
            this.currentTagIndex() == this.countTags() - 1 &&
            this.canAddSelection()
        ) {
            struct = {
                nodeSelections: [
                    ...this.state.nodeSelections,
                    this.createNewNodeSelection(),
                ],
                currentTagIndex: this.currentTagIndex() + 1,
                callback: () => this.focusCurrentTag(),
            };
        } else {
            this.focusCurrentTag();
        }
        struct.suggestionsVisible = false;
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
                if (numBlinks % 2 == 0) {
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
            this.hideSuggestions();
            if (!this.selectionHasStarted) {
                this.unselectAllTags({});

                this.updateState({ currentTagIndex: -1 });
            }
            this.selectionHasStarted = false;
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
        } else if (e.key === "c" && e.ctrlKey) {
            this.copyAllSelectedTags();
        }
    }

    handleMouseUp(e: globalThis.MouseEvent): void {
        this.mouseButtonDown = false;
        document.body.classList.remove("SmartNodeSelector__unselectable");
        if (this.countSelectedTags() > 0) {
            this.hideSuggestions();
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
            currentTarget == this.mouseDownElement &&
            currentTarget.nodeName === "INPUT"
        ) {
            return;
        }

        this.hideSuggestions();
        this.blurActiveElement();

        const domNode = this.tagFieldRef.current;
        if (!domNode) return;

        this.selectionHasStarted = true;

        document.body.classList.add("SmartNodeSelector__unselectable");
        const inputFieldBoundingRect = domNode.getBoundingClientRect();

        const top = Math.min(this.mouseDownPosition[1], e.clientY);
        const bottom = Math.max(this.mouseDownPosition[1], e.clientY);
        let left =
            this.mouseDownPosition[1] == top
                ? this.mouseDownPosition[0]
                : e.clientX;
        let right =
            this.mouseDownPosition[1] == top
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
            if (i == index) {
                nodeSelection.setSelected(true);
            }
        });
        this.updateState({
            suggestionsVisible: false,
            forceUpdate: true,
        });
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
        if (newSelections.length == 0 || !this.hasLastEmptyTag()) {
            newSelections = [...newSelections, this.createNewNodeSelection()];
        }
        this.updateState({
            nodeSelections: newSelections,
            currentTagIndex: newTagIndex,
            suggestionsVisible: false,
            callback: () => this.focusCurrentTag(),
        });
    }

    removeTag(
        e: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>,
        index: number
    ): void {
        let newSelections = [...this.state.nodeSelections];
        let newTagIndex =
            this.currentTagIndex() === index
                ? Math.max(this.countTags() - 2, 0)
                : this.currentTagIndex() -
                  (index < this.currentTagIndex() ? 1 : 0);
        newSelections.splice(index, 1);
        if (newSelections.length == 0) {
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
            callback: () => this.setFocusOnTagInput(newTagIndex),
        });

        e.stopPropagation();
    }

    clearAllTags(
        e: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
    ): void {
        this.updateState({
            nodeSelections: [this.createNewNodeSelection()],
            currentTagIndex: 0,
            suggestionsVisible: false,
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
                    if (this.currentSelectionDirection == Direction.Left) {
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
                    if (this.currentSelectionDirection == Direction.Left) {
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
            const newSelections = this.state.nodeSelections;
            if (this.lastNodeSelection().isEmpty()) {
                newSelections.pop();
            }
            for (const selection of selections) {
                if (
                    newSelections.length < this.props.maxNumSelectedNodes ||
                    this.props.maxNumSelectedNodes == -1
                ) {
                    newSelections.push(selection.clone());
                }
            }
            if (
                newSelections.length < this.props.maxNumSelectedNodes ||
                this.props.maxNumSelectedNodes == -1
            ) {
                newSelections.push(this.createNewNodeSelection());
            }
            this.updateState({
                nodeSelections: newSelections,
                currentTagIndex: newSelections.length - 1,
                suggestionsVisible: false,
                callback: () => {
                    this.unselectAllTags({ focusInput: true });
                },
            });
        }
        e.preventDefault();
    }

    canAddSelection(): boolean {
        return (
            (this.countValidSelections() < this.props.maxNumSelectedNodes ||
                this.props.maxNumSelectedNodes == -1) &&
            this.props.maxNumSelectedNodes !== 1
        );
    }

    updateSelectedTagsAndNodes(): void {
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
        setProps({
            selectedTags: selectedTags,
            selectedNodes: selectedNodes,
            selectedIds: selectedIds,
        });
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
        const val = eventTarget.value;
        const tag = this.nodeSelection(index);
        const previouslyFocussedLevel = tag.getFocussedLevel();
        if (
            eventTarget.selectionStart != null &&
            eventTarget.selectionEnd != null
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
            this.updateState({
                currentTagIndex: index,
                callback: () => {
                    this.maybeShowSuggestions();
                },
                forceUpdate: tag.getFocussedLevel() !== previouslyFocussedLevel,
            });
        }
        e.stopPropagation();
    }

    handleInputKeyUp(e: React.KeyboardEvent<HTMLInputElement>): void {
        const eventTarget = e.target as HTMLInputElement;
        const val = eventTarget.value;
        if (e.key === "Enter" && val) {
            if (this.currentTagIndex() == this.countTags() - 1) {
                this.focusCurrentTag();
            } else {
                this.incrementCurrentTagIndex();
                this.setFocusOnTagInput(this.currentTagIndex() + 1);
            }
        } else if (e.key === "ArrowRight" && val) {
            if (eventTarget.selectionStart == eventTarget.value.length) {
                this.focusCurrentTag();
            }
        } else if (e.key === "ArrowLeft") {
            if (eventTarget.selectionStart == 0) {
                this.focusCurrentTag();
            }
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
        } else if (e.key === this.props.delimiter && val) {
            if (this.currentNodeSelection().isFocusOnMetaData()) {
                this.currentNodeSelection().setNodeName(val.slice(0, -1));
                this.currentNodeSelection().incrementFocussedLevel();
                this.updateState({ forceUpdate: true });
            } else if (!this.currentNodeSelection().isValid()) {
                this.currentNodeSelection().setNodeName(
                    val.split(this.props.delimiter)[
                        this.currentNodeSelection().getFocussedLevel() -
                            this.currentNodeSelection().getNumMetaNodes()
                    ]
                );
                this.currentNodeSelection().incrementFocussedLevel();
                this.updateState({ forceUpdate: true });
            } else {
                e.preventDefault();
            }
        }
    }

    handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
        const eventTarget = e.target as HTMLInputElement;
        const val = eventTarget.value;
        if (
            e.key === "Enter" &&
            val &&
            !this.hasLastEmptyTag() &&
            this.currentTagIndex() == this.countTags() - 1
        ) {
            if (this.canAddSelection()) {
                this.updateState({
                    nodeSelections: [
                        ...this.state.nodeSelections,
                        this.createNewNodeSelection(),
                    ],
                    currentTagIndex: this.currentTagIndex() + 1,
                });
            } else {
                this.letMaxNumValuesBlink();
            }
        } else if (
            e.key === "ArrowRight" &&
            eventTarget.selectionEnd == eventTarget.value.length &&
            !e.repeat &&
            val
        ) {
            if (e.shiftKey) {
                if (this.currentTagIndex() < this.countTags() - 1) {
                    this.selectTag(this.currentTagIndex());
                    this.currentSelectionDirection = Direction.Right;
                }
            } else {
                if (
                    this.currentTagIndex() == this.countTags() - 1 &&
                    !this.hasLastEmptyTag() &&
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
                    this.incrementCurrentTagIndex(() => this.focusCurrentTag());
                    e.preventDefault();
                }
            }
        } else if (
            e.key === "ArrowLeft" &&
            eventTarget.selectionStart == 0 &&
            eventTarget.selectionEnd == 0 &&
            this.currentTagIndex() > 0 &&
            !e.repeat
        ) {
            if (e.shiftKey) {
                if (!this.currentNodeSelection().displayAsTag()) {
                    this.selectTag(this.currentTagIndex() - 1);
                } else {
                    this.selectTag(this.currentTagIndex());
                }
                this.currentSelectionDirection = Direction.Left;
            } else {
                this.decrementCurrentTagIndex(() => {
                    this.focusCurrentTag();
                });
                e.preventDefault();
            }
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
        } else if (
            e.key === "Backspace" &&
            this.currentNodeSelection().getFocussedLevel() > 0 &&
            (eventTarget.value === "" ||
                (!this.currentNodeSelection().isFocusOnMetaData() &&
                    val.slice(-1) === this.props.delimiter))
        ) {
            if (e.repeat) {
                e.preventDefault();
                return;
            }
            this.currentNodeSelection().decrementFocussedLevel();
            this.updateState({ forceUpdate: true });
            e.preventDefault();
        } else if (
            e.key === "v" &&
            e.ctrlKey &&
            this.currentTagIndex() == this.countTags() - 1
        ) {
            this.pasteTags(e);
        }
    }

    handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
        const tag = this.currentNodeSelection();
        const value = e.target.value;

        if (tag.isFocusOnMetaData()) {
            tag.setNodeName(value);
        } else {
            let i = tag.getNumMetaNodes();
            for (const d of value.split(this.props.delimiter)) {
                tag.setNodeName(d, i++);
            }
        }

        this.updateState({ forceUpdate: true });
        this.maybeShowSuggestions();
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
                                hideSuggestions={(cb) =>
                                    this.hideSuggestions(cb)
                                }
                                removeTag={(e, index) =>
                                    this.removeTag(e, index)
                                }
                                updateSelectedTagsAndNodes={() =>
                                    this.updateSelectedTagsAndNodes()
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
