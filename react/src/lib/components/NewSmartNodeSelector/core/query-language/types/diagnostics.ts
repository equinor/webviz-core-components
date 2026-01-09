import type { Range } from "../../utils/range";

export type Diagnostic = {
    charRange: Range;
    message: string;
    severity: "error" | "warning";
};
