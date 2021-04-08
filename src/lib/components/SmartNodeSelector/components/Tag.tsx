/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component, ReactFragment } from 'react'
import classNames from 'classnames';
import PropTypes from 'prop-types';
import TreeNodeSelection from '../utils/TreeNodeSelection';
import './SmartNodeSelector.css';

type TagProps = {
    key: string;
    index: number;
    placeholder: string,
    treeNodeSelection: TreeNodeSelection;
    countTags: number;
    currentTag: boolean;
    checkIfDuplicate: (nodeSelection: TreeNodeSelection, index: number) => boolean;
    inputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputSelect: (e: React.SyntheticEvent<HTMLInputElement, Event>, index: number) => void;
    hideSuggestions: (callback?: () => void) => void;
    removeTag: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, index: number) => void;
    updateSelectedTagsAndNodes: () => void;
};

/**
 * A component for displaying and interacting with a tag.
 */
export default class Tag extends Component<TagProps> {
    public props: TagProps;
    public static propTypes: Record<string, unknown>;
    public static defaultProps: Partial<TagProps> = {};
    public state: { hovered: boolean };

    constructor(props: TagProps) {
        super(props);

        this.props = props;
        this.state = { hovered: false };
    }

    private addAdditionalClasses(invalid: boolean): boolean {
        const { currentTag, treeNodeSelection } = this.props;
        return (
            treeNodeSelection.displayAsTag()
            || (!invalid && !currentTag)
            || (invalid && !currentTag && treeNodeSelection.getNodeName(0) != "")
        );
    }

    private innerTagClasses(invalid = false, duplicate = false): string {
        const { treeNodeSelection } = this.props;
        let ret = {
            "SmartNodeSelector__InnerTag": true
        };
        if (this.addAdditionalClasses(invalid)) {
            const icons = treeNodeSelection.icons();
            ret = Object.assign({}, ret, {
                "SmartNodeSelector__Icon": icons.length > 0 || invalid || duplicate,
                [
                    invalid ? "SmartNodeSelector__InnerInvalid"
                        : duplicate ? "SmartNodeSelector__InnerDuplicate"
                            : icons.length > 1 ? "SmartNodeSelector__Unknown"
                                : ""
                ]: true
            });
        }
        return classNames(ret);
    }

    private outerTagClasses(invalid: boolean, duplicate: boolean): string {
        return classNames({
            "SmartNodeSelector__Tag": true,
            "SmartNodeSelector__Border": this.displayAsTag(),
            [
                !(this.addAdditionalClasses(invalid)) ? ""
                    : invalid ? "SmartNodeSelector__Invalid"
                        : duplicate ? "SmartNodeSelector__Duplicate"
                            : ""
            ]: true
        });
    }

    private calculateTextWidth(text: string, padding = 10, minWidth = 50): number {
        const { treeNodeSelection } = this.props;
        const span = document.createElement("span");
        if (text === undefined) {
            text = "";
        }
        span.classList.add("SmartNodeSelector__Ruler");
        const input = (
            treeNodeSelection.getRef() as React.RefObject<HTMLInputElement>
        ).current as HTMLInputElement;
        if (input) {
            const fontSize = window.getComputedStyle(input).fontSize;
            span.style.fontSize = fontSize;
        }
        const textNode = document.createTextNode(text.replace(/ /g, "\u00A0"));
        span.appendChild(textNode);
        document.body.appendChild(span);
        const width = span.offsetWidth;
        document.body.removeChild(span);
        return Math.max(minWidth, width + padding);
    }

    private createMatchesCounter(nodeSelection: TreeNodeSelection, index: number): JSX.Element | null {
        if (nodeSelection.containsWildcard() && nodeSelection.countExactlyMatchedNodePaths() > 0) {
            const matches = nodeSelection.countExactlyMatchedNodePaths();
            return (
                <span
                    key={"TagMatchesCounter_" + index}
                    className="SmartNodeSelector__MatchCounter"
                    title={"This expression matches " + matches + " options."}
                >
                    {matches}
                </span>
            );
        }
        return null;
    }

    private createBrowseButtons(nodeSelection: TreeNodeSelection, index: number): ReactFragment | null {
        const { currentTag } = this.props;
        if (
            ((nodeSelection.isValidUpToFocussedNode() && currentTag) || nodeSelection.isValid())
            && !nodeSelection.containsWildcard()
            && this.displayAsTag()
            && nodeSelection.countAvailableChildNodes(nodeSelection.getFocussedLevel() - 1) > 1
        ) {
            const subgroups = nodeSelection.availableChildNodes(
                nodeSelection.getFocussedLevel() - 1
            ).map((data) => data.nodeName);
            let position = subgroups.indexOf(nodeSelection.getFocussedNodeName());
            if (position === -1) {
                position = 0;
            }
            return (
                <div key={"TagBrowseButton_" + index} className="SmartNodeSelector__BrowseButtons">
                    <button
                        key={"TagPreviousButton_" + index}
                        className="SmartNodeSelector__ShiftNode SmartNodeSelector__ShiftUp"
                        disabled={position == 0}
                        title="Previous option"
                        onMouseDown={(e): void => this.shiftOption(e, nodeSelection, false)}
                        onMouseUp={(e): void => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onClick={(e): void => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    />
                    <button
                        key={"TagNextButton_" + index}
                        className="SmartNodeSelector__ShiftNode SmartNodeSelector__ShiftDown"
                        disabled={position == subgroups.length - 1}
                        title="Next option"
                        onMouseDown={(e): void => this.shiftOption(e, nodeSelection, true)}
                        onMouseUp={(e): void => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onClick={(e): void => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    />
                </div>
            )
        }
        return null;
    }

    private shiftOption(e: React.MouseEvent<HTMLButtonElement>, nodeSelection: TreeNodeSelection, up: boolean): void {
        const { hideSuggestions, updateSelectedTagsAndNodes } = this.props;
        const inputElement = (nodeSelection.getRef() as React.RefObject<HTMLInputElement>).current as HTMLInputElement;
        const currentSelection = [inputElement.selectionStart, inputElement.selectionEnd];
        const subgroups = nodeSelection.availableChildNodes(
            nodeSelection.getFocussedLevel() - 1
        ).map((el) => el.nodeName);
        const newPosition = subgroups.indexOf(nodeSelection.getFocussedNodeName()) + (up ? 1 : -1);
        if (!up && newPosition < 0) return;
        if (up && newPosition >= subgroups.length) return;
        nodeSelection.setNodeName(subgroups[newPosition]);
        hideSuggestions(() => {
            if (currentSelection[0] !== null && currentSelection[1] !== null) {
                inputElement.setSelectionRange(currentSelection[0], currentSelection[1]);
            }
        });
        e.preventDefault();
        e.stopPropagation();
        updateSelectedTagsAndNodes();
    }

    private tagTitle(nodeSelection: TreeNodeSelection, index: number): string {
        const { countTags, checkIfDuplicate } = this.props;
        if (index === countTags - 1 && !nodeSelection.displayAsTag()) {
            return "Enter a new name";
        }
        else if (!nodeSelection.isValid()) {
            return "Invalid";
        }
        else if (checkIfDuplicate(nodeSelection, index)) {
            return "Duplicate";
        }
        else if (!nodeSelection.isComplete()) {
            return "Incomplete";
        }
        else {
            return nodeSelection.exactlyMatchedNodePaths().join("\n");
        }
    }


    private handleInput(e: React.FormEvent<HTMLInputElement>): void {
        const val = (e.target as HTMLInputElement).value;
        if (val) {
            (e.target as HTMLInputElement).style.width = this.calculateTextWidth(val) + "px";
        }
    }

    private displayAsTag(): boolean {
        const {
            treeNodeSelection,
            currentTag,
        } = this.props;

        return (
            treeNodeSelection.displayAsTag()
            || (treeNodeSelection.isValid() && currentTag)
            || (treeNodeSelection.getNodeName(0) != "" && !currentTag)
        );
    }

    private createFocusOverlay(treeNodeSelection: TreeNodeSelection): React.ReactNode | null {
        const inputElement = (
            treeNodeSelection.getRef() as React.RefObject<HTMLInputElement>
        ).current as HTMLInputElement;
        if (inputElement) {
            const inputContainerBoundingRect = (inputElement.parentElement as HTMLElement).getBoundingClientRect();
            const inputBoundingRect = inputElement.getBoundingClientRect();
            let left = inputBoundingRect.left - inputContainerBoundingRect.left;

            const value = treeNodeSelection.displayText();

            let width = this.calculateTextWidth(value, 0, 0);
            let distanceLeft = 0;
            const splitByDelimiter = value.split(treeNodeSelection.getDelimiter());
            if (splitByDelimiter.length > 1) {
                const currentText = splitByDelimiter[
                    treeNodeSelection.getFocussedLevel() - treeNodeSelection.getNumMetaNodes()
                ];
                width = this.calculateTextWidth(currentText, 0, 0);
                const splitByCurrentText = value.split(currentText);

                if (splitByCurrentText[0] !== undefined) {
                    distanceLeft = this.calculateTextWidth(splitByCurrentText[0], 0, 0);
                }
            }

            left += distanceLeft;

            return (
                <div className="SmartNodeSelector__FocusOverlay" style={{
                    left: left + "px",
                    width: width + "px"
                }}></div>
            );
        }
        else {
            return null;
        }
    }

    render(): React.ReactNode {
        const {
            index,
            treeNodeSelection,
            currentTag,
            checkIfDuplicate,
            inputKeyDown,
            inputKeyUp,
            inputChange,
            inputSelect,
            removeTag
        } = this.props;

        const displayText = treeNodeSelection.displayText();

        const valid = treeNodeSelection.isValid();
        const duplicate = checkIfDuplicate(treeNodeSelection, index);

        const colors = treeNodeSelection.colors();
        const style = colors.length >= 2 ? {
            background: `linear-gradient(to left, ${colors.join(", ")}) border-box`,
            border: "1px solid transparent"
        }
            : colors.length == 1 ? {
                borderColor: `${colors[0]}`
            } : {};

        return (
            <li
                key={"Tag_" + index}
                title={this.tagTitle(treeNodeSelection, index)}
                className={this.outerTagClasses((!valid && !currentTag), duplicate)}
                style={style}
                onMouseEnter={(): void => this.setState({ hovered: true })}
                onMouseLeave={(): void => this.setState({ hovered: false })}
            >
                {
                    this.displayAsTag() &&
                    <button
                        type="button"
                        key={"TagRemoveButton_" + index}
                        className="SmartNodeSelector__RemoveButton"
                        title="Remove"
                        onClick={(e): void => removeTag(e, index)}
                    />
                }
                {this.createBrowseButtons(treeNodeSelection, index)}
                <div key={"InnerTag_" + index} className={
                    this.innerTagClasses((!valid && !currentTag), duplicate)
                }
                    style={(treeNodeSelection.icons().length == 1 && !duplicate && (valid || currentTag) ? {
                        backgroundImage: "url(" + treeNodeSelection.icons()[0] + ")"
                    } : {})
                    }
                >
                    {this.createMatchesCounter(treeNodeSelection, index)}
                    <div className="SmartNodeSelector__InputContainer">
                        <input
                            spellCheck="false"
                            key={"TagInput_" + index}
                            type="text"
                            placeholder={
                                (
                                    treeNodeSelection.getFocussedNodeName() === ""
                                        && treeNodeSelection.getFocussedLevel() == 0
                                        ? "Add new tag..." : ""
                                )
                            }
                            value={displayText}
                            style={{
                                width: (treeNodeSelection.getFocussedNodeName() === ""
                                    && treeNodeSelection.getFocussedLevel() == 0 ? 100
                                    : this.calculateTextWidth(displayText)
                                ) + "px"
                            }}
                            ref={treeNodeSelection.getRef()}
                            onInput={(e): void => this.handleInput(e)}
                            onClick={(e): void => e.stopPropagation()}
                            onChange={(e): void => inputChange(e)}
                            onKeyUp={(e): void => inputKeyUp(e)}
                            onKeyDown={(e): void => inputKeyDown(e)}
                            onSelect={(e): void => inputSelect(e, index)}
                            onBlur={(): void => treeNodeSelection.setFocussedLevel(treeNodeSelection.countLevel() - 1)}
                        />
                        {
                            ((currentTag || this.state.hovered) && !treeNodeSelection.isSelected()) &&
                            this.createFocusOverlay(treeNodeSelection)
                        }
                    </div>
                    {
                        treeNodeSelection.isSelected() &&
                        <div
                            key={"TagSelected_" + index}
                            className="SmartNodeSelector__TagSelected">
                        </div>
                    }
                </div>
            </li >
        );
    }
}

Tag.propTypes = {
    /**
     * Index of the tag in its context.
     */
    index: PropTypes.number.isRequired,
    /**
     * Tag data object storing information.
     */
    treeNodeSelection: PropTypes.instanceOf(TreeNodeSelection).isRequired,
    /**
     * Total number of tags.
     */
    countTags: PropTypes.number.isRequired,
    /**
     * Boolean stating if this is the currently active tag.
     */
    currentTag: PropTypes.bool.isRequired,
    /**
     * Function to check if this tag is a duplicate.
     */
    checkIfDuplicate: PropTypes.func.isRequired,
    /**
     * Function to call on input key down event.
     */
    inputKeyDown: PropTypes.func.isRequired,
    /**
     * Function to call on input key upevent.
     */
    inputKeyUp: PropTypes.func.isRequired,
    /**
     * Function to call on input change event.
     */
    inputChange: PropTypes.func.isRequired,
    /**
     * Function to call on input select event.
     */
    inputSelect: PropTypes.func.isRequired,
    /**
     * Function for hiding suggestions list.
     */
    hideSuggestions: PropTypes.func.isRequired,
    /**
     * Function for removing tag.
     */
    removeTag: PropTypes.func.isRequired,
    /**
     * Function for updating selected tags, nodes and ids.
     */
    updateSelectedTagsAndNodes: PropTypes.func.isRequired
};
