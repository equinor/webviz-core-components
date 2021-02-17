import React from 'react';
import Tag from '../sub-components/Tag.react'

export default class TreeNodeSelectionObject {
    private focussedLevel: number;
    private nodePath: Array<string>;
    private ref: React.Ref<Tag>;
    private selected: boolean;
    private delimiter: string;
    private sourceDataTree: object;
    private numMatchedTags: number;
    private numMetaData: number;

    constructor({
        focussedLevel = 0,
        nodePath = [""],
        ref,
        selected = false,
        delimiter = ":",
        numMetaData = 0,
        sourceDataTree
    }: {
        focussedLevel: number,
        nodePath: Array<string>,
        ref: React.Ref<Tag>,
        selected: boolean,
        delimiter: string,
        numMetaData: number,
        sourceDataTree: object
    }) {
        this.focussedLevel = focussedLevel;
        this.nodePath = nodePath;
        this.ref = ref;
        this.selected = selected;
        this.ref = ref;
        this.sourceDataTree = sourceDataTree;
        this.delimiter = delimiter;
        this.numMatchedTags = 0;
        this.numMetaData = numMetaData;
    }

    getNodePath(index?: number): Array<string> | string {
        if (index === undefined) {
            return this.nodePath;
        }
        if (index >= 0 && index < this.level())
            return this.nodePath[index];
        else
            throw "The given index is out of bounds";
    }

    getFocussedNode(): string {
        return this.nodePath[this.focussedLevel];
    }

    setNode(data: string, index?: number): void {
        if (index !== undefined) {
            this.nodePath[index] = data;
        }
        else {
            this.nodePath[this.focussedLevel] = data;
        }
    }

    setNodePath(nodePath: Array<string>): void {
        this.nodePath = nodePath;
    }

    getRef(): React.Ref<Tag> {
        return this.ref;
    }

    setRef(reference: React.Ref<Tag>): void {
        this.ref = reference;
    }

    getFocussedLevel(): number {
        return this.focussedLevel;
    }

    setFocussedLevel(index: number, includeMetaData: boolean = true): void {
        if (!includeMetaData && this.focussedLevel >= this.numMetaData) {
            this.focussedLevel = index + this.numMetaData;
        }
        else {
            this.focussedLevel = index;
        }
        this.tidy();
    }

    incrementFocussedLevel(): void {
        if (this.focussedLevel < this.level() - 1) {
            this.focussedLevel++;
        }
        else if (!this.isValid()) {
            this.focussedLevel++;
            this.nodePath[this.focussedLevel] = "";
        }
    }

    decrementFocussedLevel(): void {
        this.focussedLevel--;
        this.tidy();
    }

    isSelected(): boolean {
        return this.selected;
    }

    setSelected(select: boolean): void {
        this.selected = select;
    }

    level(): number {
        return this.nodePath.length;
    }

    colors(): Array<string> {
        let colors = [];
        for (let i = 0; i < this.level(); i++) {
            if (i >= this.numMetaData)
                break;

            const availableData = this.availableSourceDataAtIndex(i, true, false);
            for (const data of availableData) {
                if (data["color"] !== undefined && !colors.some((el) => el === data["color"])) {
                    colors.push(data["color"]);
                }
            }
        }
        return colors;
    }

    icons(): Array<string> {
        let icons = [];
        for (let i = 0; i < this.level(); i++) {
            if (i >= this.numMetaData)
                break;

            const availableData = this.availableSourceDataAtIndex(i, true, false);
            for (const data of availableData) {
                if (data["icon"] !== undefined && !icons.some((el) => el === data["icon"])) {
                    icons.push(data["icon"]);
                }
            }
        }
        return icons;
    }

    equals(other: TreeNodeSelectionObject): boolean {
        return JSON.stringify(this.getNodePath()) == JSON.stringify(other.getNodePath());
    }

    // TODO: Make name clearer - maybe remove second check?
    containsOrIsContainedBy(other: TreeNodeSelectionObject): boolean {
        if (this.containsWildcard() && !other.containsWildcard()) {
            return this.exactlyMatchedNodes().includes(other.getCompleteSelectionAsString());
        }
        else if (!this.containsWildcard() && other.containsWildcard()) {
            return other.exactlyMatchedNodes().includes(this.getCompleteSelectionAsString());
        }
        else if (this.containsWildcard() && other.containsWildcard()) {
            const otherMatchedTags = other.exactlyMatchedNodes();
            return this.exactlyMatchedNodes().some((el) => otherMatchedTags.includes(el));
        }
        else {
            return this.equals(other);
        }
    }

    isFocusOnMetaData(): boolean {
        return this.focussedLevel < this.numMetaData;
    }

    displayText(): string {
        if (this.getFocussedLevel() < this.numMetaData) {
            return this.getFocussedNode();
        } else {
            let text = "";
            for (let i = 0; i < this.level(); i++) {
                const el = this.getNodePath(i);
                if (this.getFocussedLevel() == i && i < this.numMetaData && typeof el === "string") {
                    text = el
                    break;
                }
                else if (i >= this.numMetaData) {
                    if (el === "" && this.getFocussedLevel() < i) break;
                    text += text == "" ? el : this.delimiter + el;
                }
            }
            return text;
        }
    }

    getCompleteSelectionAsString(): string {
        return (this.getNodePath() as Array<string>).join(this.delimiter);
    }

    isComplete(): boolean {
        return this.numberOfPossiblyMatchedValues() > 0;
    }

    private escapeRegExp(string: string): string {
        return string.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }

    private replaceAll(str: string, find: string, replace: string): string {
        return str.replace(new RegExp(find, 'g'), replace);
    }

    testExpression(expression: string, testString: string, startsWith: boolean = false, strict: boolean = false): boolean {
        if (strict) {
            if (startsWith) {
                return testString.startsWith(expression);
            } else {
                return testString === expression;
            }
        }
        let re = new RegExp("^" + this.replaceAll(this.replaceAll(this.escapeRegExp(expression), "*", ".*"), "?", ".") + (startsWith ? "" : "$"));
        return re.test(testString);
    }

    displayAsTag(): boolean {
        return this.getFocussedLevel() > 0 || (this.numMetaData == 0 && this.level() > 1);
    }

    isEmpty(): boolean {
        return !this.displayAsTag() && this.getFocussedNode() == "";
    }

    checkIfValid(data: object, index: number): boolean {
        if (index >= this.level()) {
            if (Object.keys(data).length === 0) {
                return true;
            }
            else {
                return false;
            }
        }

        const el = this.getNodePath()[index];
        var result = false;
        if (index >= this.level() && Object.keys(data).length === 0) {
            result || true;
        }
        else if (el.includes("?") || el.includes("*")) {
            const keys = Object.keys(data);
            const filteredkeys = keys.filter((e) => this.testExpression(el, e));
            for (let k of filteredkeys) {
                result || this.checkIfValid(data[k].data, index + 1);
            }
        }
        else if (el in data) {
            result || this.checkIfValid(data[el].data, index + 1);
        }
        return result;
    }

    tidy(): void {
        let newData = [];
        for (let i = 0; i < this.level(); i++) {
            if (i > this.getFocussedLevel() && this.getNodePath(i) == "") {
                break;
            }
            newData[i] = this.getNodePath(i);
        }
        this.setNodePath(newData);
    }

    isValid(): boolean {
        return this.checkIfValid(this.sourceDataTree, 0);
    }

    numberOfPossiblyMatchedValues(): number {
        var numMatches = 0;
        let searchForMatches = (data, index) => {
            const keys = Object.keys(data);
            const el = this.getNodePath(index) as string;
            const filteredkeys = keys.filter((e) => this.testExpression(el, e));
            if (index == this.getFocussedLevel()) {
                numMatches += filteredkeys.length;
            }
            else {
                for (const k of filteredkeys) {
                    searchForMatches(data[k].data, index + 1);
                }
            }
        }

        searchForMatches(this.sourceDataTree, 0);
        return numMatches;
    }

    exactlyMatchedNodes(): Array<string> {
        var matchedTags = [];

        let searchForMatchedTags = (data, index, name) => {
            const keys = Object.keys(data);
            const el = this.getNodePath(index) as string;
            const filteredkeys = keys.filter((e) => this.testExpression(el, e, false));
            if (index == this.getFocussedLevel()) {
                matchedTags.push(...filteredkeys.map((key, i) => name + key));
            }
            else {
                for (const k of filteredkeys) {
                    searchForMatchedTags(data[k].data, index + 1, name + k + this.delimiter);
                }
            }
        }

        searchForMatchedTags(this.sourceDataTree, 0, "");
        this.numMatchedTags = matchedTags.length;
        return matchedTags;
    }

    availableDataPoints(filtered = true, openEnd = true, countAll = false) {
        var availableData = [];

        let searchForAvailableData = (data, index) => {
            const keys = Object.keys(data);
            const el = this.getNodePath(index) as string;
            const filteredkeys = keys.filter((e) => (!filtered && index == this.getFocussedLevel()) ? true : this.testExpression(el, e, openEnd));
            if (index == this.getFocussedLevel()) {
                availableData.push(...filteredkeys.map((key, i) => {
                    if (!countAll && availableData.some((k) => k["name"] === key))
                        return {};

                    let ret = {
                        name: key,
                        description: data[key]["description"]
                    };
                    if (data[key]["color"] !== undefined) {
                        Object.assign(ret, { color: data[key]["color"] });
                    }
                    if (data[key]["icon"] !== undefined) {
                        Object.assign(ret, { icon: data[key]["icon"] });
                    }
                    return ret;

                }).filter((el: object) => el.name !== undefined));
            }
            else {
                for (const k of filteredkeys) {
                    searchForAvailableData(data[k].data, index + 1);
                }
            }
        }

        searchForAvailableData(this.sourceDataTree, 0);
        return availableData;
    }

    availableSourceDataAtIndex(requestedIndex, filtered = true, openEnd = true) {
        var availableData = [];

        let searchForAvailableData = (data, index) => {
            const keys = Object.keys(data);
            const el = this.getNodePath(index) as string;
            const filteredkeys = keys.filter((e) => (!filtered && index == requestedIndex) ? true : this.testExpression(el, e, openEnd));
            if (index == requestedIndex) {
                availableData.push(...filteredkeys.map((key, i) => {
                    let ret = {
                        name: key,
                        description: data[key]["description"]
                    };
                    if (data[key]["color"] !== undefined) {
                        Object.assign(ret, { color: data[key]["color"] });
                    }
                    if (data[key]["icon"] !== undefined) {
                        Object.assign(ret, { icon: data[key]["icon"] });
                    }
                    return ret;
                }));
            }
            else {
                for (const k of filteredkeys) {
                    searchForAvailableData(data[k].data, index + 1);
                }
            }
        }

        searchForAvailableData(this.sourceDataTree, 0);
        return availableData;
    }

    countExactlyMatchedNodes(tag) {
        return this.exactlyMatchedNodes().length;
    }

    hasAvailableData(index) {
        var data = this.sourceDataTree;
        for (let el of this.getNodePath()) {
            data = data[el].data;
        }
        return (typeof data == 'object' && data.length > 0);
    }

    containsWildcard() {
        for (let el of this.getNodePath()) {
            if (el.includes("?") || el.includes("*")) {
                return true;
            }
        }
        return false;
    }

    currentValueContainsWildcard() {
        return (this.getFocussedNode().includes("?") || this.getFocussedNode().includes("*"));
    }

    clone() {
        return new TreeNodeSelectionObject({
            focussedLevel: this.getFocussedLevel(),
            nodePath: this.getNodePath() as Array<string>,
            ref: undefined,
            selected: false,
            delimiter: this.delimiter,
            numMetaData: this.numMetaData,
            sourceDataTree: this.sourceDataTree
        });
    }
}