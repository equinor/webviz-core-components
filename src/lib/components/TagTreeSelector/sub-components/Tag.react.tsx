import React, { Component, Fragment } from 'react'
import classNames from 'classnames';
import PropTypes from 'prop-types';
import TagDataObject from '../utils/TagDataObject';
import '../TagTreeSelector.css';

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

/**
 * A component for displaying and interacting with a tag.
 */
export default class Tag extends Component {
    constructor(props) {
        super();

        this.props = props;
    }

    tagClasses(tag, invalid = false, duplicate = false) {
        let ret = {
            "TagTreeSelector__InnerTag": true
        };
        const icons = tag.icons();
        if (tag.isTag()) {
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

    calculateTextWidth(text, padding = 10) {
        let span = document.createElement("span");
        span.classList.add("TagTreeSelector__Ruler");
        let textNode = document.createTextNode(text);
        span.appendChild(textNode);
        document.body.appendChild(span);
        const width = span.offsetWidth;
        document.body.removeChild(span);
        return Math.max(50, width + padding);
    }

    createMatchesCounter(tag, index) {
        if (tag.containsWildcard()) {
            let matches = tag.countMatchedTags();
            return (
                <span key={"TagMatchesCounter_" + index} className="TagTreeSelector__MatchCounter" title={"This expression matches " + matches + " options."}>{matches}</span>
            );
        }
        return "";
    }

    createBrowseButtons(tag, index) {
        if (tag.isValid() && !tag.containsWildcard() && tag.isTag()) {
            const subgroups = tag.availableData(false).map((data) => data["name"]);
            const position = subgroups.indexOf(tag.activeData());
            return (
                <Fragment key={"TagBrowseButton_" + index}>
                    <button
                        key={"TagPreviousButton_" + index}
                        className="TagTreeSelector__BrowseSubgroup"
                        disabled={position == 0}
                        title="Previous option"
                        onClick={(e) => this.previousSubgroup(e, tag, index)}
                    >
                        &lsaquo;
                    </button>
                    <button
                        key={"TagNextButton_" + index}
                        className="TagTreeSelector__BrowseSubgroup"
                        disabled={position == subgroups.length - 1}
                        title="Next option"
                        onClick={(e) => this.nextSubgroup(e, tag, index)}
                    >
                        &rsaquo;
                    </button>
                </Fragment>
            )
        }
    }

    previousSubgroup(e, tag, index) {
        const { hideSuggestions } = this.props;
        const subgroups = tag.availableData(false).map((el) => el["name"]);
        const newPosition = subgroups.indexOf(tag.activeData()) - 1;
        if (newPosition < 0) return;
        tag.setData(subgroups[newPosition]);
        hideSuggestions();
        e.stopPropagation();
    }

    nextSubgroup(e, tag, index) {
        const { hideSuggestions } = this.props;
        const subgroups = tag.availableData(false).map((el) => el["name"]);
        const newPosition = subgroups.indexOf(tag.activeData()) + 1;
        if (newPosition >= subgroups.length) return;
        tag.setData(subgroups[newPosition]);
        hideSuggestions();
        e.stopPropagation();
    }

    tagTitle(tag, index) {
        const { countTags, checkIfDuplicate } = this.props;
        if (index === countTags - 1 && !tag.isTag()) {
            return "Enter a new name";
        }
        else if (!tag.isValid()) {
            return "Invalid";
        }
        else if (checkIfDuplicate(tag, index)) {
            return "Duplicate";
        }
        else if (tag.isComplete()) {
            return "Incomplete";
        }
        else {
            return tag.matchedTags().join("\n");
        }
    }


    input(e) {
        const val = e.target.value;
        e.target.style.width = this.calculateTextWidth(val);
    }

    render() {

        const { index, tag, currentTag, checkIfDuplicate, inputKeyDown, inputKeyUp, inputChange, inputSelect, removeTag } = this.props;

        const colors = tag.colors();
        const style = colors.length >= 2 ? { background: `linear-gradient(to left, ${colors.join(", ")}) border-box`, border: "1px solid transparent" }
            : colors.length == 1 ? {
                borderColor: `${colors[0]}`
            } : {};

        return (
            <li key={"Tag_" + index} title={this.tagTitle(tag, index)} className={classNames({
                "TagTreeSelector__Tag": true,
                "TagTreeSelector__Border": tag.isTag()
            })} style={style}>
                <div key={"InnerTag_" + index} className={
                    classNames(
                        this.tagClasses(tag, (!tag.isValid() && !currentTag),
                            checkIfDuplicate(tag, index)
                        )
                    )}
                    style={{
                        backgroundImage: (tag.icons().length == 1 ? "url(" + tag.icons()[0] + ")" : "none")
                    }}
                >
                    {this.createMatchesCounter(tag, index)}
                    <input
                        key={"TagInput_" + index}
                        type="text"
                        value={tag.name()}
                        style={{ width: this.calculateTextWidth(tag.name()) + "px" }}
                        ref={e => tag.setRef(e)}
                        onInput={(e) => this.input(e)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => inputChange(e)}
                        onKeyUp={(e) => inputKeyUp(e)}
                        onKeyDown={(e) => inputKeyDown(e)}
                        onSelect={(e) => inputSelect(e, index)}
                    />
                    {this.createBrowseButtons(tag, index)}
                    {tag.isTag() && <button type="button" key={"TagRemoveButton_" + index} className="TagTreeSelector__RemoveButton" title="Remove" onClick={(e) => removeTag(e, index)}>+</button>}
                    {tag.selected() && <div key={"TagSelected_" + index} className="TagTreeSelector__TagSelected"></div>}
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
    tag: PropTypes.instanceOf(TagDataObject).isRequired,
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