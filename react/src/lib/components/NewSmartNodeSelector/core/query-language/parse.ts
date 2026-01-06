import type { QueryAST } from "./ast";
import { tokenize, type Token } from "./lexer";
import { parseSegment } from "./segment-parser/parseSegment";
import { splitSegments, type SegmentSpan } from "./segments";
import type { Diagnostic } from "./types/diagnostics";

export type ParsedQuery = {
    text: string;
    tokens: Token[];
    segments: SegmentSpan[];
    ast: QueryAST;
    diagnostics: Diagnostic[];
};

export type ParseOptions = {
    delimiter: string;
};

export function parseQuery(text: string, options: ParseOptions): ParsedQuery {
    const tokens = tokenize(text, options.delimiter);
    const { segments, diagnostics: segmentSplitDiagnostics } = splitSegments(
        tokens,
        options.delimiter,
        text.length
    );

    const diagnostics: Diagnostic[] = [...segmentSplitDiagnostics];

    const astSegments = segments.map((span) => {
        const { segment, diagnostics: segmentDiagnostics } = parseSegment(
            tokens,
            span
        );
        diagnostics.push(...segmentDiagnostics);
        return segment;
    });

    const ast: QueryAST = {
        segments: astSegments,
    };

    return {
        text: text,
        tokens,
        segments,
        ast,
        diagnostics,
    };
}
