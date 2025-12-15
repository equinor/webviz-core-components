import React from "react";
import type { IndexedNode, TreeDataNode } from "./core/types";
import { TreeIndexBuilder } from "./core/TreeIndexBuilder";
import { TagParser } from "./core/TagParser";
import { TreeMatcher } from "./core/TreeMatcher";

export type SmartNodeSelectorProps = {
    data: TreeDataNode[];
    delimiter?: string;
};

const DEFAULT_DELIMITER = ":";

export function SmartNodeSelector(props: SmartNodeSelectorProps) {
    const [matches, setMatches] = React.useState<IndexedNode[]>([]);

    const matcher = React.useMemo(() => {
        const builder = new TreeIndexBuilder(
            props.delimiter ?? DEFAULT_DELIMITER
        );
        const result = builder.build(props.data);
        return new TreeMatcher(result);
    }, [props.data, props.delimiter]);

    const tagParser = React.useMemo(() => {
        return new TagParser(props.delimiter ?? DEFAULT_DELIMITER);
    }, [props.delimiter]);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        const query = tagParser.parse(value);
        const matchedNodes = matcher.match(query);
        setMatches(matchedNodes);
    }

    return (
        <>
            <input type="text" onChange={handleChange} />
            <br />
            <ul>
                {matches.map((match) => (
                    <li>{match.path.join(" -> ")}</li>
                ))}
            </ul>
        </>
    );
}
