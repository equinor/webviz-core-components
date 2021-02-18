import React from 'react';
import { I } from 'ts-toolbelt';
import { TreeDataNode } from './TreeDataNodeTypes';

export default class TreeNodeSelection {
    private focussedLevel: number;
    private nodePath: Array<string>;
    private ref: React.RefObject<HTMLInputElement>;
    private selected: boolean;
    private delimiter: string;
    private dataTreeRootNodes: Array<TreeDataNode>;
    private numMatchedNodes: number;
    private numMetaNodes: number;

    constructor({
        focussedLevel = 0,
        nodePath = [""],
        selected = false,
        delimiter = ":",
        numMetaNodes = 0,
        dataTreeRootNodes
    }: {
        focussedLevel: number,
        nodePath: Array<string>,
        selected: boolean,
        delimiter: string,
        numMetaNodes: number,
        dataTreeRootNodes: Array<TreeDataNode>
    }) {
        this.focussedLevel = focussedLevel;
        this.nodePath = nodePath;
        this.selected = selected;
        this.ref = React.createRef<HTMLInputElement>();
        this.dataTreeRootNodes = dataTreeRootNodes;
        this.delimiter = delimiter;
        this.numMatchedNodes = 0;
        this.numMetaNodes = numMetaNodes;
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

    getFocussedNodeName(): string {
        return this.nodePath[this.focussedLevel];
    }

    setNodeName(data: string, index?: number): void {
        if (index !== undefined) {
            this.nodePath[index] = data;
        }
        else {
            this.nodePath[this.focussedLevel] = data;
        }
    }

    getNode(nodePath: Array<string>): TreeDataNode | undefined {
        let pathNode = undefined;
        let nodes = this.dataTreeRootNodes;
        for (const el in this.nodePath) {
            pathNode = nodes.filter((node) => node.name === el)[0];
            if (pathNode) {
                if ("children" in pathNode)
                    nodes = pathNode.children;
            }
            else {
                return undefined;
            }
        }
        return pathNode;
    }

    setNodePath(nodePath: Array<string>): void {
        this.nodePath = nodePath;
    }

    getRef(): React.Ref<HTMLInputElement> {
        return this.ref;
    }

    getFocussedLevel(): number {
        return this.focussedLevel;
    }

    setFocussedLevel(index: number, includeMetaData: boolean = true): void {
        if (!includeMetaData && this.focussedLevel >= this.numMetaNodes) {
            this.focussedLevel = index + this.numMetaNodes;
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
            if (i >= this.numMetaNodes)
                break;

            const availableData = this.availableNodesAtIndex({
                index: i,
                filtered: true,
                openEnd: false
            });
            for (const data of availableData) {
                if (data.color !== undefined && !colors.some((el) => el === data.color)) {
                    colors.push(data.color);
                }
            }
        }
        return colors;
    }

    icons(): Array<string> {
        let icons = [];
        for (let i = 0; i < this.level(); i++) {
            if (i >= this.numMetaNodes)
                break;

            const availableData = this.availableNodesAtIndex({
                index: i,
                filtered: true,
                openEnd: false
            });
            for (const data of availableData) {
                if (data.icon !== undefined && !icons.some((el) => el === data.icon)) {
                    icons.push(data.icon);
                }
            }
        }
        return icons;
    }

    equals(other: TreeNodeSelection): boolean {
        return JSON.stringify(this.getNodePath()) == JSON.stringify(other.getNodePath());
    }

    // TODO: Make name clearer - maybe remove second check?
    containsOrIsContainedBy(other: TreeNodeSelection): boolean {
        if (this.containsWildcard() && !other.containsWildcard()) {
            return this.exactlyMatchedNodePaths().includes(other.getCompleteSelectionAsString());
        }
        else if (!this.containsWildcard() && other.containsWildcard()) {
            return other.exactlyMatchedNodePaths().includes(this.getCompleteSelectionAsString());
        }
        else if (this.containsWildcard() && other.containsWildcard()) {
            const otherMatchedTags = other.exactlyMatchedNodePaths();
            return this.exactlyMatchedNodePaths().some((el) => otherMatchedTags.includes(el));
        }
        else {
            return this.equals(other);
        }
    }

    isFocusOnMetaData(): boolean {
        return this.focussedLevel < this.numMetaNodes;
    }

    displayText(): string {
        if (this.getFocussedLevel() < this.numMetaNodes) {
            return this.getFocussedNodeName();
        } else {
            let text = "";
            for (let i = 0; i < this.level(); i++) {
                const el = this.getNodePath(i);
                if (this.getFocussedLevel() == i && i < this.numMetaNodes && typeof el === "string") {
                    text = el
                    break;
                }
                else if (i >= this.numMetaNodes) {
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
        return this.numberOfPossiblyMatchedNodes() > 0;
    }

    private escapeRegExp(string: string): string {
        return string.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }

    private replaceAll(str: string, find: string, replace: string): string {
        return str.replace(new RegExp(find, 'g'), replace);
    }

    private testExpression(expression: string, testString: string, startsWith: boolean = false, strict: boolean = false): boolean {
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
        return this.getFocussedLevel() > 0 || (this.numMetaNodes == 0 && this.level() > 1);
    }

    isEmpty(): boolean {
        return !this.displayAsTag() && this.getFocussedNodeName() == "";
    }

    private checkIfValid(nodes: Array<TreeDataNode>, index: number): boolean {
        if (index >= this.level()) {
            if (nodes.length === 0) {
                return true;
            }
            else {
                return false;
            }
        }

        const el = this.getNodePath()[index];
        var result = false;
        if (index >= this.level() && nodes.length === 0) {
            result || true;
        }
        else if (el.includes("?") || el.includes("*")) {
            const filteredNodes = nodes.filter((node) => this.testExpression(el, node.name));
            for (const node of filteredNodes) {
                if ("children" in node) {
                    result || this.checkIfValid(node.children, index + 1);
                } else {
                    result || true;
                }
            }
        }
        else if (nodes.some((node) => node.name === el)) {
            const matchingNode = nodes.filter((node) => node.name === el)[0];
            if (matchingNode && "children" in matchingNode) {
                result || this.checkIfValid(matchingNode.children, index + 1);
            }
        }
        return result;
    }

    private tidy(): void {
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
        return this.checkIfValid(this.dataTreeRootNodes, 0);
    }

    numberOfPossiblyMatchedNodes(): number {
        var numMatchedNodes = 0;
        let searchForMatches = (nodes: Array<TreeDataNode>, index: number): void => {
            const el = this.getNodePath(index) as string;
            const filteredNodes = nodes.filter((node) => this.testExpression(el, node.name));
            if (index == this.getFocussedLevel()) {
                numMatchedNodes += filteredNodes.length;
            }
            else {
                for (const node of filteredNodes) {
                    if ("children" in node)
                        searchForMatches(node.children, index + 1);
                }
            }
        }

        searchForMatches(this.dataTreeRootNodes, 0);
        return numMatchedNodes;
    }

    exactlyMatchedNodePaths(): Array<string> {
        var matchedNodes = [];

        let searchForMatchedNodes = (nodes: Array<TreeDataNode>, index: number, name: string): void => {
            const el = this.getNodePath(index) as string;
            const filteredNodes = nodes.filter((node) => this.testExpression(el, node.name, false));
            if (index == this.getFocussedLevel()) {
                matchedNodes.push(...filteredNodes.map((node) => name + node.name));
            }
            else {
                for (const node of filteredNodes) {
                    if ("children" in node)
                        searchForMatchedNodes(node.children, index + 1, name + node.name + this.delimiter);
                }
            }
        }

        searchForMatchedNodes(this.dataTreeRootNodes, 0, "");
        this.numMatchedNodes = matchedNodes.length;
        return matchedNodes;
    }

    availableChildNodes({
        filtered = true,
        openEnd = true,
        countAll = false
    }: {
        filtered?: boolean,
        openEnd?: boolean,
        countAll?: boolean
    }): Array<TreeDataNode> {
        var availableNodes = [];

        let searchForAvailableData = (nodes: Array<TreeDataNode>, index: number): void => {
            const el = this.getNodePath(index) as string;
            const filteredNodes = nodes.filter((node) => (!filtered && index == this.getFocussedLevel()) ? true : this.testExpression(el, node.name, openEnd));
            if (index == this.getFocussedLevel()) {
                availableNodes.push(...filteredNodes.map((node) => {
                    if (!countAll && availableNodes.some((n) => n.name === node.name))
                        return {};

                    return filteredNodes;

                }));
            }
            else {
                for (const node of filteredNodes) {
                    if ("children" in node)
                        searchForAvailableData(node.children, index + 1);
                }
            }
        }

        searchForAvailableData(this.dataTreeRootNodes, 0);
        return availableNodes;
    }

    availableNodesAtIndex({
        index,
        filtered = true,
        openEnd = true
    }: {
        index: number,
        filtered?: boolean,
        openEnd?: boolean
    }): Array<TreeDataNode> {
        var availableNodes = [];

        let searchForAvailableNodes = (nodes: Array<TreeDataNode>, i: number): void => {
            const el = this.getNodePath(i) as string;
            const filteredNodes = nodes.filter((node) => (!filtered && i == index) ? true : this.testExpression(el, node.name, openEnd));
            if (index == i) {
                availableNodes.push(...filteredNodes.map((node) => {
                    return node;
                }));
            }
            else {
                for (const node of filteredNodes) {
                    if ("children" in node)
                        searchForAvailableNodes(node.children, i + 1);
                }
            }
        }

        searchForAvailableNodes(this.dataTreeRootNodes, 0);
        return availableNodes;
    }

    countExactlyMatchedNodePaths(): number {
        return this.exactlyMatchedNodePaths().length;
    }

    hasAvailableChildNodes(): boolean {
        const node = this.getNode(this.getNodePath() as string[]);
        return ("children" in node && node.children.length > 0);
    }

    containsWildcard(): boolean {
        for (let el of this.getNodePath()) {
            if (el.includes("?") || el.includes("*")) {
                return true;
            }
        }
        return false;
    }

    focussedNodeNameContainsWildcard(): boolean {
        return (this.getFocussedNodeName().includes("?") || this.getFocussedNodeName().includes("*"));
    }

    clone(): TreeNodeSelection {
        return new TreeNodeSelection({
            focussedLevel: this.getFocussedLevel(),
            nodePath: this.getNodePath() as Array<string>,
            selected: false,
            delimiter: this.delimiter,
            numMetaNodes: this.numMetaNodes,
            dataTreeRootNodes: this.dataTreeRootNodes
        });
    }
}