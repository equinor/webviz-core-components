/*
 * Assigns default values to a props object.
*/

export type Optionals<T> = Required<Pick<T, Exclude<{
    [K in keyof T]: T extends Record<K, T[K]> ? never : K
}[keyof T], undefined>>>;

type NoUndefinedField<T> = { [P in keyof T]: Exclude<T[P], null | undefined> };

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function getPropsWithMissingValuesSetToDefault<Props extends { [index: string]: any }>(
    props: Props,
    defaults: Optionals<Props>
): Required<NoUndefinedField<Props>> {
    return Object.assign({ ...props }, ...Object.keys(defaults).map(key => ({
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        [key]: props[key] ?? (defaults as { [index: string]: any })[key]
    })));
}
