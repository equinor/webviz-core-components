import type { Range } from "../types/range";

export type Expr = BinaryExpr | GroupExpr | SetExpr | PatternExpr | ErrorExpr;

export interface BinaryExpr {
    kind: "binary";
    operator: "|" | "&";
    left: Expr;
    right: Expr;
    charRange: Range;
}

export interface GroupExpr {
    kind: "group";
    expr: Expr;
    closed: boolean;
    charRange: Range;
}

export interface SetExpr {
    kind: "set";
    items: Expr[];
    closed: boolean;
    charRange: Range;
}

export interface PatternExpr {
    kind: "pattern";
    atoms: Atom[];
    charRange: Range;
}

export interface ErrorExpr {
    kind: "error";
    message: string;
    charRange: Range;
}

export type Atom =
    | { kind: "literal"; text: string; charRange: Range }
    | { kind: "star"; charRange: Range }
    | { kind: "qmark"; charRange: Range };

export type Segment =
    | { kind: "deep"; charRange: Range }
    | { kind: "expr"; expr: Expr; charRange: Range; unionMode: boolean };

export interface QueryAST {
    segments: Segment[];
}
