import type { Atom } from "../ast/ast";

export type MatchNameOptions = {
    caseInsensitive?: boolean;
};

export function matchName(
    name: string,
    atoms: Atom[],
    opts?: MatchNameOptions
): boolean {
    const n = name.length;
    const m = atoms.length;

    const modifiedName = opts?.caseInsensitive ? name.toLowerCase() : name;
    const modifiedAtoms = opts?.caseInsensitive
        ? atoms.map((x) =>
              x.kind === "literal" ? { ...x, text: x.text.toLowerCase() } : x
          )
        : atoms;

    // dpPrev[j] = dp[i-1][j], dpCur[j] = dp[i][j]
    let dpPrev = new Array<boolean>(n + 1).fill(false);
    dpPrev[0] = true; // 0 atoms match empty string

    for (let i = 1; i <= m; i++) {
        const atom = modifiedAtoms[i - 1];
        const dpCur = new Array<boolean>(n + 1).fill(false);

        if (atom.kind === "star") {
            // '*' can match empty: dp[i][0] = dp[i-1][0]
            dpCur[0] = dpPrev[0];

            // dp[i][j] = dp[i-1][j] (star matches empty)
            //         OR dp[i][j-1] (star matches one more char)
            for (let j = 1; j <= n; j++) {
                dpCur[j] = dpPrev[j] || dpCur[j - 1];
            }
        } else if (atom.kind === "qmark") {
            // '?' consumes exactly 1 char
            for (let j = 1; j <= n; j++) {
                dpCur[j] = dpPrev[j - 1];
            }
        } else {
            // literal consumes len characters
            const t = atom.text;
            const L = t.length;

            for (let j = L; j <= n; j++) {
                // dp[i][j] = dp[i-1][j-L] && s[j-L .. j) == t
                if (dpPrev[j - L] && modifiedName.slice(j - L, j) === t) {
                    dpCur[j] = true;
                }
            }
        }

        dpPrev = dpCur;
    }

    return dpPrev[n];
}
