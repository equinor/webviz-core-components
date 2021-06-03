/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { TreeDataNodeMetaData } from './TreeDataNodeTypes';
import TreeData from './TreeData';

export default class TreeNodeSelection {
    private focussedLevel: number;
    private nodePath: Array<string>;
    private ref: React.RefObject<HTMLInputElement>;
    private selected: boolean;
    private delimiter: string;
    private treeData: TreeData;
    private numMetaNodes: number;
    private objectIdentifier: number;

    constructor({
        focussedLevel = 0,
        nodePath = [""],
        selected = false,
        delimiter = ":",
        numMetaNodes = 0,
        treeData
    }: {
        focussedLevel: number;
        nodePath: Array<string>;
        selected: boolean;
        delimiter: string;
        numMetaNodes: number;
        treeData: TreeData;
    }) {
        this.focussedLevel = focussedLevel;
        this.nodePath = nodePath;
        this.selected = selected;
        this.ref = React.createRef<HTMLInputElement>();
        this.treeData = treeData;
        this.delimiter = delimiter;
        this.numMetaNodes = numMetaNodes;
        this.objectIdentifier = Date.now();
    }

    objectEquals(other: TreeNodeSelection): boolean {
        return other.objectIdentifier == this.objectIdentifier;
    }

    getDelimiter(): string {
        return this.delimiter;
    }

    getNodePath(untilLevel?: number): Array<string> {
        if (untilLevel === undefined) {
            return this.nodePath;
        }
        if (untilLevel >= 0 && untilLevel < this.countLevel()) {
            const nodePath: string[] = [];
            for (let i = 0; i <= untilLevel; i++) {
                nodePath.push(this.nodePath[i]);
            }
            return nodePath;
        }
        return [];
    }

    getFocussedNodeName(): string {
        return this.nodePath[this.focussedLevel];
    }

    getNodeName(level: number): string | null {
        if (level >= 0 && level < this.countLevel())
            return this.nodePath[level];
        else
            return null;
    }

    setNodeName(data: string, index?: number): void {
        if (data === undefined) {
            console.log(data);
        }
        if (index !== undefined) {
            this.nodePath[index] = data;
        }
        else {
            this.nodePath[this.focussedLevel] = data;
        }
    }

    getId(): string | undefined {
        const node = this.getNodeMetaData(this.getNodePath() as string[]);
        if (node) {
            return node.id;
        }
        return undefined;
    }

    getNodeMetaData(nodePath: Array<string>): TreeDataNodeMetaData | null {
        const nodes = this.treeData.findFirstNode(nodePath);
        if (nodes === null) {
            return null;
        }
        return nodes[nodes.length - 1];
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

    getNumMetaNodes(): number {
        return this.numMetaNodes;
    }

    setFocussedLevel(index: number, includeMetaData = true): void {
        if (!includeMetaData && this.focussedLevel >= this.numMetaNodes) {
            this.focussedLevel = index + this.numMetaNodes;
        }
        else {
            this.focussedLevel = index;
        }
        this.tidy();
    }

    incrementFocussedLevel(): void {
        if (this.focussedLevel < this.countLevel() - 1) {
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

    countLevel(): number {
        return this.nodePath.length;
    }

    colors(): Array<string> {
        const colors: string[] = [];
        if (this.focussedLevel == 0) {
            return [];
        }
        const level = this.isComplete()
            ? this.countLevel() - 1
            : Math.min(this.focussedLevel - 1, this.numMetaNodes - 1);
        const allMetaData = this.treeData.findNodes(this.getNodePath(level)).metaData;
        loop1:
        for (const metaData of allMetaData) {
            for (let i = 0; i < metaData.length; i++) {
                if (i >= this.numMetaNodes) {
                    break loop1;
                }
                const color = metaData[i].color;
                if (color && !colors.some((el) => el === color)) {
                    colors.push(color);
                }
            }
        }
        return colors;
    }

    icons(): Array<string> {
        const icons: string[] = [];
        if (this.focussedLevel == 0) {
            return [];
        }
        const level = this.isComplete()
            ? this.countLevel() - 1
            : Math.min(this.focussedLevel - 1, this.numMetaNodes - 1);
        const allMetaData = this.treeData.findNodes(this.getNodePath(level)).metaData;
        loop1:
        for (const metaData of allMetaData) {
            for (let i = 0; i < metaData.length; i++) {
                if (i >= this.numMetaNodes) {
                    break loop1;
                }
                const icon = metaData[i].icon;
                if (icon && !icons.some((el) => el === icon)) {
                    icons.push(icon);
                }
            }
        }
        return icons;
    }

    equals(other: TreeNodeSelection): boolean {
        return JSON.stringify(this.getNodePath()) == JSON.stringify(other.getNodePath());
    }

    trulyEquals(other: TreeNodeSelection): boolean {
        let check = this.equals(other);
        check = check && this.selected == other.isSelected();
        check = check && this.focussedLevel == other.getFocussedLevel();
        return check;
    }

    containsOrIsContainedBy(other: TreeNodeSelection): boolean {
        if (this.containsWildcard() && !other.containsWildcard()) {
            return this.exactlyMatchedNodePaths().includes(other.getCompleteNodePathAsString());
        }
        else if (!this.containsWildcard() && other.containsWildcard()) {
            return other.exactlyMatchedNodePaths().includes(this.getCompleteNodePathAsString());
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
            for (let i = 0; i < this.countLevel(); i++) {
                const el = this.getNodeName(i);
                if (this.getFocussedLevel() === i && i < this.numMetaNodes && typeof el === "string") {
                    text = el
                    break;
                }
                else if (i >= this.numMetaNodes) {
                    if (el === "" && this.getFocussedLevel() < i) break;
                    text += text === "" ? el : this.delimiter + el;
                }
            }
            return text;
        }
    }

    getCompleteNodePathAsString(): string {
        return (this.getNodePath() as Array<string>).join(this.delimiter);
    }

    isComplete(): boolean {
        return this.numberOfPossiblyMatchedNodes() > 0;
    }

    displayAsTag(): boolean {
        return this.getFocussedLevel() > 0 || (this.numMetaNodes == 0 && this.countLevel() > 1);
    }

    isEmpty(): boolean {
        return !this.displayAsTag() && this.getFocussedNodeName() == "";
    }

    isValidUpToFocussedNode(): boolean {
        return (
            this.getNodeName(this.focussedLevel) !== ""
            && this.treeData.findFirstNode(this.getNodePath(this.focussedLevel), false) !== null
        );
    }

    private tidy(): void {
        const newData: string[] = [];
        for (let i = 0; i < this.countLevel(); i++) {
            if (i > this.getFocussedLevel() && this.getNodeName(i) == "") {
                break;
            }
            newData[i] = this.getNodeName(i) as string;
        }
        this.setNodePath(newData);
    }

    isValid(): boolean {
        if (this.nodePath.length === 0) {
            return false;
        }
        return this.treeData.findFirstNode(this.nodePath) !== null;
    }

    numberOfPossiblyMatchedNodes(): number {
        return this.treeData.countMatchedNodes(this.nodePath);
    }

    exactlyMatchedNodePaths(): Array<string> {
        return this.treeData.findNodes(this.nodePath, true).nodePaths;
    }

    countExactlyMatchedNodePaths(): number {
        return this.exactlyMatchedNodePaths().length;
    }

    hasAvailableChildNodes(): boolean {
        return this.treeData.findSuggestions(this.getNodePath(this.focussedLevel)).length > 0;
    }

    countAvailableChildNodes(level?: number): number {
        let nodePath: string[];
        if (level !== undefined) {
            nodePath = level >= 0 ? [...this.getNodePath(level), ''] : [''];
        }
        else {
            nodePath = [...this.getNodePath(this.focussedLevel), ''];
        }
        return this.treeData.findSuggestions(nodePath).length;
    }

    getSuggestions(): { nodeName: string; metaData: TreeDataNodeMetaData }[] {
        return this.treeData.findSuggestions(this.getNodePath(this.focussedLevel));
    }

    containsWildcard(): boolean {
        for (const el of this.getNodePath()) {
            if (el.includes("?") || el.includes("*")) {
                return true;
            }
        }
        return false;
    }

    availableChildNodes(level: number): { nodeName: string; metaData: TreeDataNodeMetaData }[] {
        let nodePath: string[];
        if (level !== undefined) {
            nodePath = level >= 0 ? this.getNodePath(level) : [];
        }
        else {
            nodePath = this.getNodePath(this.focussedLevel);
        }
        return this.treeData.findChildNodes(nodePath);
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
            treeData: this.treeData
        });
    }
}
