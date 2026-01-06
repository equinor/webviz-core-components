import type { Range } from "./range";

export type Diagnostic = {
    charRange: Range;
    message: string;
    severity: "error" | "warning";
};
