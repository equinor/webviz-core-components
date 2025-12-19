import { v4 } from "uuid";
import type { Tag } from "../state/type";

export function makeTags(values: string[]): Tag[] {
    // Adding an empty tag at the end to allow for new tag creation
    return [...values, ""].map((value, index, array) => ({
        id: v4(),
        value,
        isLast: index === array.length - 1,
    }));
}
