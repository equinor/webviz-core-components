import type { ParsedQuery } from "../query-language/parse";

export type QueryItem = {
    id: string;
    query: string;
    parsedQuery: ParsedQuery;
};
