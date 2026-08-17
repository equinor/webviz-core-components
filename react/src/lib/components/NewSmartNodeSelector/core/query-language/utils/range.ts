import type { Range } from "../../utils/range";

export function caretInRange(caret: number, range: Range): boolean {
    return caret >= range.start && caret < range.end;
}

export function normalizeCaretIntoRange(caret: number, range: Range): number {
    if (caret === range.end && caret > range.start) {
        return caret - 1;
    }
    return caret;
}
