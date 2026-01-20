import type { InputModifier } from "./interface";

export const vectorSelectorModifier: InputModifier =
    function vectorSelectorModifier(input, meta) {
        if (meta.segmentIndex !== 0) {
            return input;
        }

        if (input.length === 1) {
            return input + meta.delimiter + input;
        }

        return input;
    };
