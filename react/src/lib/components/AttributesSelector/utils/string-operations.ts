export const escapeRegExp = (string: string): string => {
    const newString = string.replace(/[-[\]{}()+.,\\^$|#]/g, "\\$&");
    return newString;
};

export const replaceAll = (
    str: string,
    find: string,
    replace: string
): string => {
    return str.split(find).join(replace);
};
