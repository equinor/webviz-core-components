export type InputModifierMetadata = {
    segmentIndex: number;
    delimiter: string;
};

export interface InputModifier {
    (input: string, meta: InputModifierMetadata): string;
}
