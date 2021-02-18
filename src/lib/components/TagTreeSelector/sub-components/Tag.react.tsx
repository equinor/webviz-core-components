import React, { ChangeEvent, Component, Fragment, ReactFragment } from 'react'
import classNames from 'classnames';
import PropTypes from 'prop-types';
import TreeNodeSelection from '../utils/TreeNodeSelection';
import '../TagTreeSelector.css';
import TagTreeSelector from '..';

type TagProps = {
    key: string,
    index: number,
    treeNodeSelection: TreeNodeSelection,
    countTags: number,
    currentTag: boolean,
    checkIfDuplicate: (tag: TreeNodeSelection, index: number) => boolean,
    inputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void,
    inputKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void,
    inputChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    inputSelect: (e: React.SyntheticEvent<HTMLInputElement, Event>, index: number) => void,
    hideSuggestions: () => void,
    removeTag: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, index: number) => void
};

/**
 * A component for displaying and interacting with a tag.
 */
export default class Tag extends Component {
    public props: TagProps;
    public static propTypes: object;
    public static defaultProps: object;

    constructor(props: TagProps) {
        super(props);

        this.props = props;
    }

    private tagClasses(nodeSelection: TreeNodeSelection, invalid: boolean = false, duplicate: boolean = false): object {
        let ret = {
            "TagTreeSelector__InnerTag": true
        };
        const icons = nodeSelection.icons();
        if (nodeSelection.displayAsTag()) {
            ret = Object.assign({}, ret, {
                "TagTreeSelector__Icon": icons.length > 0 || invalid || duplicate,
                [
                    invalid ? "TagTreeSelector__Invalid"
                        : duplicate ? "TagTreeSelector__Duplicate"
                            : icons.length > 1 ? "TagTreeSelector_Unknown"
                                : ""
                ]: true
            });
        }
        return ret;
    }

    private calculateTextWidth(text: string, padding: number = 10): number {
        let span = document.createElement("span");
        span.classList.add("TagTreeSelector__Ruler");
        let textNode = document.createTextNode(text);
        span.appendChild(textNode);
        document.body.appendChild(span);
        const width = span.offsetWidth;
        document.body.removeChild(span);
        return Math.max(50, width + padding);
    }

    private createMatchesCounter(nodeSelection: TreeNodeSelection, index: number): JSX.Element | null {
        if (nodeSelection.containsWildcard()) {
            let matches = nodeSelection.numberOfPossiblyMatchedNodes();
            return (
                <span key={"TagMatchesCounter_" + index} className="TagTreeSelector__MatchCounter" title={"This expression matches " + matches + " options."}>{matches}</span>
            );
        }
        return null;
    }

    createBrowseButtons(nodeSelection: TreeNodeSelection, index: number): ReactFragment {
        if (nodeSelection.isValid() && !nodeSelection.containsWildcard() && nodeSelection.displayAsTag()) {
            const subgroups = nodeSelection.availableChildNodes({
                filtered: false
            }).map((data) => data["name"]);
            const position = subgroups.indexOf(nodeSelection.getFocussedNodeName());
            return (
                <Fragment key={"TagBrowseButton_" + index}>
                    <button
                        key={"TagPreviousButton_" + index}
                        className="TagTreeSelector__BrowseSubgroup"
                        disabled={position == 0}
                        title="Previous option"
                        onClick={(e) => this.previousSubgroup(e, nodeSelection, index)}
                    >
                        &lsaquo;
                    </button>
                    <button
                        key={"TagNextButton_" + index}
                        className="TagTreeSelector__BrowseSubgroup"
                        disabled={position == subgroups.length - 1}
                        title="Next option"
                        onClick={(e) => this.nextSubgroup(e, nodeSelection, index)}
                    >
                        &rsaquo;
                    </button>
                </Fragment>
            )
        }
    }

    previousSubgroup(e: React.MouseEvent<HTMLButtonElement>, nodeSelection: TreeNodeSelection, index: number): void {
        const { hideSuggestions } = this.props;
        const subgroups = nodeSelection.availableChildNodes({ filtered: false }).map((el) => el["name"]);
        const newPosition = subgroups.indexOf(nodeSelection.getFocussedNodeName()) - 1;
        if (newPosition < 0) return;
        nodeSelection.setNodeName(subgroups[newPosition]);
        hideSuggestions();
        e.stopPropagation();
    }

    nextSubgroup(e: React.MouseEvent<HTMLButtonElement>, nodeSelection: TreeNodeSelection, index: number): void {
        const { hideSuggestions } = this.props;
        const subgroups = nodeSelection.availableChildNodes({ filtered: false }).map((el) => el["name"]);
        const newPosition = subgroups.indexOf(nodeSelection.getFocussedNodeName()) + 1;
        if (newPosition >= subgroups.length) return;
        nodeSelection.setNodeName(subgroups[newPosition]);
        hideSuggestions();
        e.stopPropagation();
    }

    tagTitle(nodeSelection: TreeNodeSelection, index: number): string {
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
        else if (nodeSelection.isComplete()) {
            return "Incomplete";
        }
        else {
            return nodeSelection.exactlyMatchedNodePaths().join("\n");
        }
    }


    input(e: React.FormEvent<HTMLInputElement>): void {
        const val = (e.target as HTMLInputElement).value;
        (e.target as HTMLInputElement).style.width = this.calculateTextWidth(val) + "px";
    }

    render(): React.ReactNode {

        const { index, treeNodeSelection, currentTag, checkIfDuplicate, inputKeyDown, inputKeyUp, inputChange, inputSelect, removeTag } = this.props;

        const displayText = treeNodeSelection.displayText();

        const colors = treeNodeSelection.colors();
        const style = colors.length >= 2 ? { background: `linear-gradient(to left, ${colors.join(", ")}) border-box`, border: "1px solid transparent" }
            : colors.length == 1 ? {
                borderColor: `${colors[0]}`
            } : {};

        return (
            <li key={"Tag_" + index} title={this.tagTitle(treeNodeSelection, index)} className={classNames({
                "TagTreeSelector__Tag": true,
                "TagTreeSelector__Border": treeNodeSelection.displayAsTag()
            })} style={style}>
                <div key={"InnerTag_" + index} className={
                    classNames(
                        this.tagClasses(treeNodeSelection, (!treeNodeSelection.isValid() && !currentTag),
                            checkIfDuplicate(treeNodeSelection, index)
                        )
                    )}
                    style={{
                        backgroundImage: (treeNodeSelection.icons().length == 1 ? "url(" + treeNodeSelection.icons()[0] + ")" : "none")
                    }}
                >
                    {this.createMatchesCounter(treeNodeSelection, index)}
                    <input
                        key={"TagInput_" + index}
                        type="text"
                        value={displayText}
                        style={{ width: this.calculateTextWidth(displayText) + "px" }}
                        ref={treeNodeSelection.getRef()}
                        onInput={(e) => this.input(e)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => inputChange(e)}
                        onKeyUp={(e) => inputKeyUp(e)}
                        onKeyDown={(e) => inputKeyDown(e)}
                        onSelect={(e) => inputSelect(e, index)}
                    />
                    {this.createBrowseButtons(treeNodeSelection, index)}
                    {treeNodeSelection.displayAsTag() && <button type="button" key={"TagRemoveButton_" + index} className="TagTreeSelector__RemoveButton" title="Remove" onClick={(e) => removeTag(e, index)}>+</button>}
                    {treeNodeSelection.isSelected() && <div key={"TagSelected_" + index} className="TagTreeSelector__TagSelected"></div>}
                </div>
            </li>
        );
    }
}

Tag.defaultProps = {};

Tag.propTypes = {
    /**
     * Index of the tag in its context.
     */
    index: PropTypes.number.isRequired,
    /**
     * Tag data object storing information.
     */
    tag: PropTypes.instanceOf(TreeNodeSelection).isRequired,
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
    removeTag: PropTypes.func.isRequired
};