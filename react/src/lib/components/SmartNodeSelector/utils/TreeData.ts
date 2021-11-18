/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TreeDataNode, TreeDataNodeMetaData } from "./TreeDataNodeTypes";

export enum MatchType {
    openMatch = 0,
    fullMatch,
    partialMatch,
}

export default class TreeData {
    private treeData: TreeDataNode[];
    private delimiter: string;
    private stringifiedData: string;
    private nodeData: TreeDataNodeMetaData[];
    private allowOrOperator: boolean;

    constructor({
        treeData,
        delimiter,
        allowOrOperator,
    }: {
        treeData: TreeDataNode[];
        delimiter: string;
        allowOrOperator: boolean;
    }) {
        this.treeData = treeData;
        this.delimiter = delimiter;
        this.nodeData = [];
        this.stringifiedData = "";
        this.allowOrOperator = allowOrOperator;

        this.populateNodes();
    }

    private populateNodes(): void {
        let indexCount = 0;
        let stringifiedData = "";
        const nodeData: TreeDataNodeMetaData[] = [];
        const delimiter = this.delimiter;
        const populateNode = (
            indices: number[] = [],
            nodePath: string
        ): void => {
            if (indices.length == 0) {
                throw "Indices array must at least have one element";
            }
            let node: TreeDataNode = this.treeData[indices[0]];
            for (let i = 1; i < indices.length; i++) {
                if (node.children) node = node.children[indices[i]];
                else throw "Implementation error";
            }
            if (
                node.name === "" ||
                node.name === undefined ||
                node.name === null
            ) {
                const path =
                    nodePath.replace(/\{[0-9]+\}/g, "") +
                    (nodePath !== "" ? delimiter : "") +
                    node.name;
                throw `
                    Empty/invalid strings are not allowed as names of nodes:
                    "${path}"
                    ${Array(path.length + 2).join("\u00A0")}^`;
            }
            nodeData.push({
                id: node.id,
                description: node.description,
                color: node.color,
                icon: node.icon,
                numChildren: node.children ? node.children.length : 0,
            });
            const index = indexCount++;
            if (node.children && node.children.length > 0) {
                for (let i = 0; i < node.children.length; i++) {
                    populateNode(
                        [...indices, i],
                        `${nodePath}${
                            nodePath != "" ? delimiter : ""
                        }{${index}}${node.name}`
                    );
                }
            } else {
                stringifiedData += `"${nodePath}${
                    nodePath !== "" ? delimiter : ""
                }{${index}}${node.name}" `;
            }
        };
        for (let i = 0; i < this.treeData.length; i++) {
            populateNode([i], "");
        }
        this.stringifiedData = stringifiedData;
        this.nodeData = nodeData;
        if (nodeData.length != indexCount) {
            throw "implementation error";
        }
    }

    countMatchedNodes(nodePath: string[], exactMatch = false): number {
        let nodePathString = "";
        const lastNode = this.adjustNodeName(nodePath[nodePath.length - 1]);
        for (let i = 0; i < nodePath.length - 1; i++) {
            nodePathString += `\\{(\\d+)\\}${this.adjustNodeName(nodePath[i])}${
                this.delimiter
            }`;
        }

        const re = exactMatch
            ? RegExp(`"${nodePathString}\\{(\\d+)\\}${lastNode}"`, "g")
            : RegExp(
                  `"${nodePathString}\\{(\\d+)\\}${lastNode}([^${this.delimiter}"]*)"`,
                  "g"
              );
        let count = 0;

        // Can be replaced with matchAll as soon as ECMAScript 2021 is declared standard in this project.
        // see: https://tc39.es/ecma262/#sec-string.prototype.matchall
        while (re.exec(this.stringifiedData) !== null) {
            count++;
        }
        return count;
    }

    private escapeRegExp(string: string): string {
        const newString = string.replace(/[-[\]{}()+.,\\^$|#]/g, "\\$&");
        return newString;
    }

    private replaceAll(str: string, find: string, replace: string): string {
        return str.split(find).join(replace);
    }

    private activateOrStatements(nodeName: string): string {
        if (this.allowOrOperator) {
            const reg = RegExp(
                `^(([^${this.delimiter}\\|]+\\|)+([^${this.delimiter}\\|]+){1})$`
            );
            const match = nodeName.match(reg);
            if (match) {
                if (match[1] !== "") {
                    const orStatements = this.replaceAll(match[1], "\\|", "|");
                    return `(${orStatements})`;
                }
            }
        }
        return nodeName;
    }

    private adjustNodeName(nodeName: string): string {
        return this.activateOrStatements(
            this.replaceAll(
                this.replaceAll(
                    this.replaceAll(this.escapeRegExp(nodeName), ":", ""),
                    "*",
                    '[^:"]*'
                ),
                "?",
                "."
            )
        );
    }

    findFirstNode(
        nodePath: string[],
        completeNodePath = true
    ): TreeDataNodeMetaData[] | null {
        let nodePathString = "";
        for (let i = 0; i < nodePath.length; i++) {
            if (i > 0) {
                nodePathString += this.delimiter;
            }
            nodePathString += `\\{(\\d+)\\}${this.adjustNodeName(nodePath[i])}`;
        }
        const re = RegExp(`"${nodePathString}${completeNodePath ? `"` : ``}`);
        const match = this.stringifiedData.match(re);
        if (match === null) {
            return null;
        }
        const result: TreeDataNodeMetaData[] = [];
        for (let i = 1; i < match.length; i++) {
            result.push(this.nodeData[parseInt(match[i])]);
        }
        return result;
    }

    makeExpressionCaseInsensitive(expression: string): string {
        let modifiedExpression = "";
        for (let i = 0; i < expression.length; i++) {
            const char = expression.substr(i, 1);
            modifiedExpression += `[${char.toLowerCase()}${char.toUpperCase()}]`;
        }
        return modifiedExpression;
    }

    findSuggestions(
        nodePath: string[]
    ): { nodeName: string; metaData: TreeDataNodeMetaData }[] {
        const searchTerm = nodePath[nodePath.length - 1];
        let nodePathString = "";
        for (let i = 0; i < nodePath.length - 1; i++) {
            nodePathString += `\\{(\\d+)\\}${this.adjustNodeName(nodePath[i])}${
                this.delimiter
            }`;
        }

        const re = RegExp(
            `"${nodePathString}\\{(\\d+)\\}([^${this.delimiter}"]*)`,
            "g"
        );

        const suggestions: {
            nodeName: string;
            metaData: TreeDataNodeMetaData;
        }[] = [];
        const nodeNames: Set<string> = new Set();

        // Can be replaced with matchAll as soon as ECMAScript 2021 is declared standard in this project.
        // see: https://tc39.es/ecma262/#sec-string.prototype.matchall
        let match: RegExpExecArray | null;
        while ((match = re.exec(this.stringifiedData)) !== null) {
            const metaData = this.nodeData[parseInt(match[match.length - 2])];
            const searchTermRe = RegExp(
                `.*?(${this.adjustNodeName(searchTerm)}).*?`,
                "i"
            );
            if (
                searchTermRe.test(match[match.length - 1]) ||
                (metaData.description &&
                    searchTermRe.test(metaData.description))
            ) {
                const count = nodeNames.size;
                nodeNames.add(match[match.length - 1]);
                if (count == nodeNames.size) {
                    continue;
                }

                suggestions.push({
                    nodeName: match[match.length - 1],
                    metaData: this.nodeData[parseInt(match[match.length - 2])],
                });
            }
        }

        return suggestions;
    }

    findChildNodes(
        nodePath: string[]
    ): { nodeName: string; metaData: TreeDataNodeMetaData }[] {
        let nodePathString = "";
        for (let i = 0; i < nodePath.length; i++) {
            nodePathString += `\\{(\\d+)\\}${this.adjustNodeName(nodePath[i])}${
                this.delimiter
            }`;
        }

        const re = RegExp(
            `"${nodePathString}\\{(\\d+)\\}([^${this.delimiter}"]*)`,
            "g"
        );

        const childNodes: {
            nodeName: string;
            metaData: TreeDataNodeMetaData;
        }[] = [];
        const nodeNames: Set<string> = new Set();

        // Can be replaced with matchAll as soon as ECMAScript 2021 is declared standard in this project.
        // see: https://tc39.es/ecma262/#sec-string.prototype.matchall
        let match: RegExpExecArray | null;
        while ((match = re.exec(this.stringifiedData)) !== null) {
            const count = nodeNames.size;
            nodeNames.add(match[nodePath.length + 1]);
            if (count == nodeNames.size) {
                continue;
            }

            childNodes.push({
                nodeName: match[nodePath.length + 2],
                metaData: this.nodeData[parseInt(match[nodePath.length + 1])],
            });
        }
        return childNodes;
    }

    cleanNodeName(nodeName: string): string {
        return nodeName.replace(new RegExp(`\\{\\d+\\}`, "g"), "");
    }

    findNode(nodePath: string[]): string {
        const lastNode = this.adjustNodeName(nodePath[nodePath.length - 1]);
        let nodePathString = "";
        for (let i = 0; i < nodePath.length - 1; i++) {
            nodePathString += `\\{(\\d+)\\}${this.adjustNodeName(nodePath[i])}${
                this.delimiter
            }`;
        }

        const re = RegExp(
            `"${nodePathString}\\{(\\d+)\\}(${this.makeExpressionCaseInsensitive(
                lastNode
            )})("|${this.delimiter})`
        );

        // Can be replaced with matchAll as soon as ECMAScript 2021 is declared standard in this project.
        // see: https://tc39.es/ecma262/#sec-string.prototype.matchall
        const match = re.exec(this.stringifiedData);
        if (match) {
            return match[match.length - 2];
        }
        return nodePath[nodePath.length - 1];
    }

    findIdIndices(regEx: RegExp): number[] {
        const indices: number[] = [];
        const re = RegExp(`\\(([^\\(\\)]+)\\)`, "g");
        let match: RegExpExecArray | null;
        let index = 0;
        while ((match = re.exec(regEx.toString())) !== null) {
            if (match[1] === "\\d+") {
                indices.push(index);
            }
            index++;
        }
        return indices;
    }

    findNodes(
        nodePath: string[],
        matchType = MatchType.openMatch
    ): { nodePaths: string[]; metaData: TreeDataNodeMetaData[][] } {
        let nodePathString = "";
        for (let i = 0; i < nodePath.length; i++) {
            if (i > 0) {
                nodePathString += this.delimiter;
            }
            nodePathString += `\\{(\\d+)\\}${this.adjustNodeName(nodePath[i])}`;
        }
        const re =
            matchType === MatchType.fullMatch
                ? RegExp(`"(${nodePathString})"`, "g")
                : matchType === MatchType.partialMatch
                ? RegExp(
                      `"(${nodePathString})[^"${this.escapeRegExp(
                          this.delimiter
                      )}]*["${this.escapeRegExp(this.delimiter)}]{1}`,
                      "g"
                  )
                : RegExp(`"(${nodePathString})`, "g");

        const metaData: TreeDataNodeMetaData[][] = [];
        const nodePaths: string[] = [];
        const idGroupIndices = this.findIdIndices(re);

        // Can be replaced with matchAll as soon as ECMAScript 2021 is declared standard in this project.
        // see: https://tc39.es/ecma262/#sec-string.prototype.matchall
        let match: RegExpExecArray | null;
        while ((match = re.exec(this.stringifiedData)) !== null) {
            const nodesInPath: TreeDataNodeMetaData[] = [];
            for (let i = 0; i < idGroupIndices.length; i++) {
                const index = idGroupIndices[i] + 2;
                nodesInPath.push(this.nodeData[parseInt(match[index])]);
            }
            metaData.push(nodesInPath);
            nodePaths.push(this.cleanNodeName(match[1]));
        }
        return {
            nodePaths: nodePaths,
            metaData: metaData,
        };
    }
}
