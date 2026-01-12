import type { CompletionItem } from "../types/completion";
import type { Expectation } from "./caretContext";

type Ranked<T> = T & { __score: number; __tie: string };

function kindBase(
    itemKind: CompletionItem<any>["kind"],
    expectation: Expectation
): number {
    // Lower = better
    const isNode = itemKind === "node";
    const isSyntax = itemKind !== "node";

    switch (expectation) {
        case "unionFlag":
            return 60;
        case "term":
            return isNode ? 0 : 50;
        case "operator":
        case "comma":
        case "delimiterOrEnd":
            return isSyntax ? 0 : 50;
        default:
            return 0;
    }
}

function textPenalty(insertText: string): number {
    let p = 0;

    // shorter is better
    p += Math.min(insertText.length, 100);

    // whitespace penalties
    if (insertText.startsWith(" ")) p += 5;
    if (insertText.startsWith("\t")) p += 10;
    if (insertText.endsWith(" ")) p += 2;

    // optionally penalize internal whitespace a bit (comment out if you dislike it)
    const wsCount = (insertText.match(/\s/g) ?? []).length;
    p += Math.min(wsCount, 10);

    // tiny preference for "identifier-ish" inserts
    if (!/^[\w\s\-*?{}()|&,:]+$/.test(insertText)) p += 10;

    return p;
}

export function rankCompletions<Node>(
    items: CompletionItem<Node>[],
    expectation: Expectation
): CompletionItem<Node>[] {
    const ranked: Ranked<CompletionItem<Node>>[] = items.map((it) => {
        let base = kindBase(it.kind, expectation);
        const text = textPenalty(it.insertText);

        // Boost priority for union flag when expectation is "term"
        // This makes + appear first in the list when we have a full match
        if (expectation === "term" && it.kind === "unionFlag") {
            base = -10; // Very low score = highest priority
        }

        // Boost priority for delimiter when expectation is "term"
        if (expectation === "term" && it.kind === "delimiter") {
            base = -5; // High priority, but slightly lower than union flag
        }

        // Boost priority for pipe operator when expectation is "term"
        if (expectation === "term" && it.kind === "operator" && it.insertText === "|") {
            base = -3; // High priority, but lower than delimiter
        }

        // stable tie-breaker: kind + label + insertText
        const tie = `${it.kind}|${it.label}|${it.insertText}`;

        return { ...it, __score: base + text, __tie: tie };
    });

    ranked.sort((a, b) => {
        if (a.__score !== b.__score) return a.__score - b.__score;
        if (a.__tie < b.__tie) return -1;
        if (a.__tie > b.__tie) return 1;
        return 0;
    });

    // strip ranking fields
    return ranked.map(({ __score, __tie, ...rest }) => rest);
}
