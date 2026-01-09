import type { Range } from "../../utils/range";
import type { Atom, ConcatExpr, Expr, PatternExpr } from "../ast/ast";

export function matchesName(expr: Expr, name: string): boolean {
    const ends = matchFrom(expr, name, 0);
    return ends.has(name.length);
}

export function matchWithHole(
    expr: Expr,
    caretOffset: number,
    name: string
): Range | null {
    const { prefix, suffix } = splitExprAtCaret(expr, caretOffset);

    const n = name.length;
    const memo = new Map<string, Set<number>>();

    const prefixEnds = matchFrom(prefix, name, 0, memo);
    if (prefixEnds.size === 0) {
        return null;
    }

    // Compute suffix feasability for each start position in name
    const suffixOK = new Array<boolean>(n + 1).fill(false);
    for (let start = 0; start <= n; start++) {
        if (matchFrom(suffix, name, start, memo).has(n)) {
            suffixOK[start] = true;
        }
    }

    let bestHoleSpan: Range | null = null;

    for (const i of prefixEnds) {
        for (let j = i; j <= n; j++) {
            if (!suffixOK[j]) {
                continue;
            }

            const candidate: Range = { start: i, end: j };
            if (!bestHoleSpan) {
                bestHoleSpan = candidate;
            } else {
                const bestLength = bestHoleSpan.end - bestHoleSpan.start;
                const candidateLength = candidate.end - candidate.start;

                if (
                    candidateLength < bestLength ||
                    (candidateLength === bestLength &&
                        candidate.start < bestHoleSpan.start)
                ) {
                    bestHoleSpan = candidate;
                }
            }

            // First working j for this i is the best; no need to check larger j
            break;
        }
    }

    return bestHoleSpan;
}

function makeKey(expr: AnyExpr, pos: number): string {
    return `${expr.kind}:${expr.charRange.start}:${expr.charRange.end}:${pos}`;
}

type EpsilonExpr = {
    kind: "epsilon";
    charRange: { start: number; end: number };
};
type AnyExpr = Expr | EpsilonExpr;

function epsilon(): EpsilonExpr {
    return { kind: "epsilon", charRange: { start: 0, end: 0 } };
}

function isEpsilon(e: AnyExpr): e is EpsilonExpr {
    return e.kind === "epsilon";
}

function containsRange(
    range: { start: number; end: number },
    caret: number
): boolean {
    return caret >= range.start && caret <= range.end;
}

function mergeCharRange(
    a: { start: number; end: number },
    b: { start: number; end: number }
) {
    return { start: Math.min(a.start, b.start), end: Math.max(a.end, b.end) };
}

function makePattern(atoms: Atom[]): AnyExpr {
    if (atoms.length === 0) return epsilon();
    return {
        kind: "pattern",
        atoms,
        charRange: mergeCharRange(
            atoms[0].charRange,
            atoms[atoms.length - 1].charRange
        ),
    } satisfies PatternExpr;
}

function makeConcat(parts: AnyExpr[]): AnyExpr {
    const flat: AnyExpr[] = [];
    for (const p of parts) {
        if (!p) continue;
        if (!isEpsilon(p)) {
            if (p.kind === "concat") flat.push(...p.parts);
            else flat.push(p);
        }
    }
    if (flat.length === 0) return epsilon();
    if (flat.length === 1) return flat[0];
    return {
        kind: "concat",
        parts: flat as Expr[], // safe: epsilon removed
        charRange: mergeCharRange(
            flat[0].charRange,
            flat[flat.length - 1].charRange
        ),
    } satisfies ConcatExpr;
}

/**
 * Split a PatternExpr into (prefixAtoms, suffixAtoms) at caret.
 * If caret is inside a literal atom, split the literal text.
 */
function splitPatternAtomsAtCaret(
    p: PatternExpr,
    caret: number
): { prefix: AnyExpr; suffix: AnyExpr } {
    const prefixAtoms: Atom[] = [];
    const suffixAtoms: Atom[] = [];

    for (const atom of p.atoms) {
        if (caret <= atom.charRange.start) {
            suffixAtoms.push(atom);
            continue;
        }
        if (caret >= atom.charRange.end) {
            prefixAtoms.push(atom);
            continue;
        }

        // caret is inside this atom's charRange
        if (atom.kind === "literal") {
            const rel = Math.max(
                0,
                Math.min(caret - atom.charRange.start, atom.text.length)
            );
            const leftText = atom.text.slice(0, rel);
            const rightText = atom.text.slice(rel);

            if (leftText.length > 0) {
                prefixAtoms.push({
                    kind: "literal",
                    text: leftText,
                    charRange: {
                        start: atom.charRange.start,
                        end: atom.charRange.start + leftText.length,
                    },
                });
            }
            if (rightText.length > 0) {
                suffixAtoms.push({
                    kind: "literal",
                    text: rightText,
                    charRange: {
                        start: atom.charRange.start + leftText.length,
                        end: atom.charRange.end,
                    },
                });
            }
        } else {
            // star/qmark: caret inside its range -> treat as boundary around it
            // Put it on the suffix side (conservative)
            suffixAtoms.push(atom);
        }
    }

    return {
        prefix: makePattern(prefixAtoms),
        suffix: makePattern(suffixAtoms),
    };
}

/**
 * Split expr at caret ALONG THE CARET-CONTAINING PATH.
 * For OR: follow the side that contains the caret (other side irrelevant for the current editing location).
 */
function splitExprAtCaret(
    expr: Expr,
    caret: number
): { prefix: AnyExpr; suffix: AnyExpr } {
    switch (expr.kind) {
        case "pattern":
            return splitPatternAtomsAtCaret(expr, caret);

        case "group":
            return splitExprAtCaret(expr.expr, caret);

        case "set": {
            // follow the item containing caret; if none contains caret, treat hole at end of set item list
            for (const item of expr.items) {
                if (containsRange(item.charRange, caret))
                    return splitExprAtCaret(item, caret);
            }
            // fallback: hole doesn't lie in any item; treat as empty insertion at end
            return { prefix: epsilon(), suffix: epsilon() };
        }

        case "concat": {
            // Find part index. If caret is between parts, we split between them.
            const parts = expr.parts;

            // boundary before first part
            if (caret <= parts[0].charRange.start) {
                return { prefix: epsilon(), suffix: makeConcat(parts) };
            }

            for (let i = 0; i < parts.length; i++) {
                const p = parts[i];

                // boundary between previous and this part
                if (caret <= p.charRange.start) {
                    const leftParts = parts.slice(0, i);
                    const rightParts = parts.slice(i);
                    return {
                        prefix: makeConcat(leftParts),
                        suffix: makeConcat(rightParts),
                    };
                }

                if (containsRange(p.charRange, caret)) {
                    const split = splitExprAtCaret(p, caret);
                    const leftParts = [...parts.slice(0, i), split.prefix];
                    const rightParts = [split.suffix, ...parts.slice(i + 1)];
                    return {
                        prefix: makeConcat(leftParts),
                        suffix: makeConcat(rightParts),
                    };
                }
            }

            // caret after last part
            return { prefix: makeConcat(parts), suffix: epsilon() };
        }

        case "binary": {
            const inLeft = containsRange(expr.left.charRange, caret);
            const inRight = containsRange(expr.right.charRange, caret);

            if (expr.operator === "|") {
                if (inLeft) return splitExprAtCaret(expr.left, caret);
                if (inRight) return splitExprAtCaret(expr.right, caret);
                // caret not in either: treat as empty insertion
                return { prefix: epsilon(), suffix: epsilon() };
            }

            throw new Error("Unknown operator not supported in name matcher");
            break;
        }

        case "error":
            return { prefix: epsilon(), suffix: epsilon() };
    }
}

function matchFrom(
    expr: AnyExpr,
    str: string,
    pos: number,
    memo: Map<string, Set<number>> = new Map()
): Set<number> {
    const key = makeKey(expr, pos);

    const cached = memo.get(key);
    if (cached) {
        return cached;
    }

    let result = new Set<number>();

    if (isEpsilon(expr)) {
        result.add(pos);
        memo.set(key, result);
        return result;
    }

    switch (expr.kind) {
        case "pattern":
            result = matchAtomsFrom(expr.atoms, str, pos);
            break;

        case "concat": {
            let positions = new Set<number>([pos]);
            for (const part of expr.parts) {
                const next = new Set<number>();
                for (const p of positions) {
                    const ends = matchFrom(part, str, p, memo);
                    for (const e of ends) {
                        next.add(e);
                    }
                }
                positions = next;
                if (positions.size === 0) {
                    break;
                }
            }
            result = positions;
            break;
        }

        case "group": {
            result = matchFrom(expr.expr, str, pos, memo);
            break;
        }

        case "set": {
            const next = new Set<number>();
            for (const item of expr.items) {
                const ends = matchFrom(item, str, pos, memo);
                for (const e of ends) {
                    next.add(e);
                }
            }
            result = next;
            break;
        }

        case "binary": {
            const leftEnds = matchFrom(expr.left, str, pos, memo);
            const rightEnds = matchFrom(expr.right, str, pos, memo);

            if (expr.operator === "|") {
                // Union
                result = new Set<number>(leftEnds);
                for (const e of rightEnds) {
                    result.add(e);
                }
            }
            break;
        }

        case "error":
            result = new Set<number>();
            break;
    }

    memo.set(key, result);
    return result;
}

function matchAtomsFrom(
    atoms: readonly Atom[],
    str: string,
    startPos: number
): Set<number> {
    const n = str.length;
    // dp[i] = set of positions in s reachable after processing first i atoms
    let curr = new Set<number>([startPos]);

    for (const atom of atoms) {
        const next = new Set<number>();

        if (atom.kind === "literal") {
            for (const p of curr) {
                if (str.startsWith(atom.text, p))
                    next.add(p + atom.text.length);
            }
        } else if (atom.kind === "qmark") {
            for (const p of curr) {
                if (p < n) next.add(p + 1);
            }
        } else if (atom.kind === "star") {
            // star can match empty or any run; closure over positions
            // start by adding all current positions (empty match)
            const queue: number[] = Array.from(curr);
            const seen = new Set<number>(curr);

            while (queue.length) {
                const p = queue.pop()!;
                next.add(p); // empty or already advanced

                if (p < n && !seen.has(p + 1)) {
                    seen.add(p + 1);
                    queue.push(p + 1);
                }
            }
        }

        curr = next;
        if (curr.size === 0) break;
    }

    return curr;
}
