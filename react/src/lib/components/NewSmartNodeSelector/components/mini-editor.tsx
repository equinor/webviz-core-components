import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type Pos = { line: number; col: number };

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}
function cmpPos(a: Pos, b: Pos) {
    if (a.line !== b.line) return a.line - b.line;
    return a.col - b.col;
}
function minPos(a: Pos, b: Pos) {
    return cmpPos(a, b) <= 0 ? a : b;
}
function maxPos(a: Pos, b: Pos) {
    return cmpPos(a, b) >= 0 ? a : b;
}
function samePos(a: Pos, b: Pos) {
    return a.line === b.line && a.col === b.col;
}
function escapeHtml(s: string) {
    return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/**
 * Tiny demo highlighter (not real tokenization): keywords + single-quoted strings.
 * Real editors use TextMate/LSP tokenization and theme classes.
 */
function highlightLineHtml(text: string) {
    const kws = new Set(["function", "return", "const", "let", "var", "if", "else", "for", "while", "class", "new"]);
    const escaped = escapeHtml(text);

    let out = "";
    let i = 0;
    while (i < escaped.length) {
        if (escaped[i] === "'") {
            let j = i + 1;
            while (j < escaped.length && escaped[j] !== "'") j++;
            const chunk = escaped.slice(i, Math.min(j + 1, escaped.length));
            out += `<span style="color:#A31515">${chunk}</span>`;
            i = Math.min(j + 1, escaped.length);
        } else {
            let j = i;
            while (j < escaped.length && escaped[j] !== "'") j++;
            const chunk = escaped.slice(i, j);
            out += chunk.replace(/\b[A-Za-z_]\w*\b/g, (m) => {
                if (kws.has(m)) return `<span style="color:#0000FF">${m}</span>`;
                return m;
            });
            i = j;
        }
    }
    return out;
}

export function MiniCodeEditor() {
    // ----- Model -----
    const [lines, setLines] = useState<string[]>(() => [
        "function hello(name) {",
        "  console.log('hello ' + name);",
        "}",
        "",
        "// Try: click, drag, type, paste, enter, backspace, IME",
    ]);

    const [cursor, setCursorState] = useState<Pos>({ line: 0, col: 0 });
    const [anchor, setAnchorState] = useState<Pos>({ line: 0, col: 0 });

    // Keep refs for event handlers (avoid stale closures)
    const linesRef = useRef(lines);
    const cursorRef = useRef(cursor);
    const anchorRef = useRef(anchor);
    useEffect(() => void (linesRef.current = lines), [lines]);
    useEffect(() => void (cursorRef.current = cursor), [cursor]);
    useEffect(() => void (anchorRef.current = anchor), [anchor]);

    // Composition (IME) state
    const composingRef = useRef(false);
    const compositionStartRef = useRef<Pos | null>(null);
    const compositionTextRef = useRef("");

    // ----- View / DOM refs -----
    const editorRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    // Layout constants
    const lineHeight = 20; // px
    const overscan = 10;
    const leftPad = 10;

    // Measured monospace char width
    const [charW, setCharW] = useState(8);

    // Visible range for virtualization
    const [visibleRange, setVisibleRange] = useState<{ first: number; last: number }>({
        first: 0,
        last: 0,
    });

    // Drag selection
    const selectingRef = useRef(false);

    // ---- Helpers that operate on refs (so handlers don't go stale) ----
    const normalizePos = (pos: Pos, ls = linesRef.current): Pos => {
        const line = clamp(pos.line, 0, Math.max(0, ls.length - 1));
        const col = clamp(pos.col, 0, ls[line]?.length ?? 0);
        return { line, col };
    };

    const setCursor = (pos: Pos, keepAnchor: boolean) => {
        const p = normalizePos(pos);
        setCursorState(p);
        if (!keepAnchor) setAnchorState(p);
    };

    const posFromMouse = (evt: MouseEvent | React.MouseEvent): Pos => {
        const ed = editorRef.current!;
        const rect = ed.getBoundingClientRect();

        const x = evt.clientX - rect.left + ed.scrollLeft;
        const y = evt.clientY - rect.top + ed.scrollTop;

        const ls = linesRef.current;
        let line = Math.floor(y / lineHeight);
        line = clamp(line, 0, Math.max(0, ls.length - 1));

        const relX = x - leftPad;
        let col = Math.round(relX / charW);
        col = clamp(col, 0, (ls[line] ?? "").length);

        return { line, col };
    };

    const ensureCaretVisible = (pos = cursorRef.current) => {
        const ed = editorRef.current;
        if (!ed) return;

        const y = pos.line * lineHeight;
        const x = leftPad + pos.col * charW;

        const viewTop = ed.scrollTop;
        const viewBottom = viewTop + ed.clientHeight;

        if (y < viewTop) ed.scrollTop = y;
        else if (y + lineHeight > viewBottom) ed.scrollTop = y + lineHeight - ed.clientHeight;

        const viewLeft = ed.scrollLeft;
        const viewRight = viewLeft + ed.clientWidth;

        if (x < viewLeft) ed.scrollLeft = x;
        else if (x + 10 > viewRight) ed.scrollLeft = x + 10 - ed.clientWidth;
    };

    // ----- Editing ops (apply to current state safely) -----
    const deleteSelectionIfAny = (
        ls: string[],
        c: Pos,
        a: Pos
    ): { ls: string[]; cursor: Pos; anchor: Pos; deleted: boolean } => {
        if (samePos(c, a)) return { ls, cursor: c, anchor: a, deleted: false };

        const from = minPos(c, a);
        const to = maxPos(c, a);
        const next = ls.slice();

        if (from.line === to.line) {
            const s = next[from.line];
            next[from.line] = s.slice(0, from.col) + s.slice(to.col);
        } else {
            const firstPart = next[from.line].slice(0, from.col);
            const lastPart = next[to.line].slice(to.col);
            next.splice(from.line, to.line - from.line + 1, firstPart + lastPart);
        }

        const newPos = normalizePos(from, next);
        return { ls: next, cursor: newPos, anchor: newPos, deleted: true };
    };

    const insertText = (text: string) => {
        setLines((prevLines) => {
            let ls = prevLines;
            let c = cursorRef.current;
            let a = anchorRef.current;

            // Replace selection first
            const delRes = deleteSelectionIfAny(ls, c, a);
            ls = delRes.ls;
            c = delRes.cursor;
            a = delRes.anchor;

            const line = c.line;
            const col = c.col;
            const s = ls[line] ?? "";

            const parts = text.replace(/\r\n/g, "\n").split("\n");
            let next = ls.slice();

            if (parts.length === 1) {
                next[line] = s.slice(0, col) + parts[0] + s.slice(col);
                const newC = normalizePos({ line, col: col + parts[0].length }, next);
                setCursorState(newC);
                setAnchorState(newC);
            } else {
                const before = s.slice(0, col);
                const after = s.slice(col);
                const newLines: string[] = [];
                newLines.push(before + parts[0]);
                for (let i = 1; i < parts.length - 1; i++) newLines.push(parts[i]);
                newLines.push(parts[parts.length - 1] + after);

                next.splice(line, 1, ...newLines);
                const newC = normalizePos({ line: line + parts.length - 1, col: parts[parts.length - 1].length }, next);
                setCursorState(newC);
                setAnchorState(newC);
            }

            return next;
        });
    };

    const backspace = () => {
        setLines((prevLines) => {
            let ls = prevLines;
            let c = cursorRef.current;
            let a = anchorRef.current;

            // delete selection
            const delRes = deleteSelectionIfAny(ls, c, a);
            if (delRes.deleted) {
                setCursorState(delRes.cursor);
                setAnchorState(delRes.anchor);
                return delRes.ls;
            }

            const next = ls.slice();

            if (c.col > 0) {
                const s = next[c.line];
                next[c.line] = s.slice(0, c.col - 1) + s.slice(c.col);
                const newC = normalizePos({ line: c.line, col: c.col - 1 }, next);
                setCursorState(newC);
                setAnchorState(newC);
                return next;
            }

            if (c.line > 0) {
                const prev = next[c.line - 1];
                const curr = next[c.line];
                const newCol = prev.length;
                next.splice(c.line - 1, 2, prev + curr);
                const newC = normalizePos({ line: c.line - 1, col: newCol }, next);
                setCursorState(newC);
                setAnchorState(newC);
                return next;
            }

            return ls;
        });
    };

    const del = () => {
        setLines((prevLines) => {
            let ls = prevLines;
            let c = cursorRef.current;
            let a = anchorRef.current;

            const delRes = deleteSelectionIfAny(ls, c, a);
            if (delRes.deleted) {
                setCursorState(delRes.cursor);
                setAnchorState(delRes.anchor);
                return delRes.ls;
            }

            const next = ls.slice();
            const s = next[c.line];

            if (c.col < s.length) {
                next[c.line] = s.slice(0, c.col) + s.slice(c.col + 1);
                return next;
            }

            if (c.line < next.length - 1) {
                next.splice(c.line, 2, next[c.line] + next[c.line + 1]);
                return next;
            }

            return ls;
        });
    };

    const newline = () => {
        setLines((prevLines) => {
            let ls = prevLines;
            let c = cursorRef.current;
            let a = anchorRef.current;

            const delRes = deleteSelectionIfAny(ls, c, a);
            ls = delRes.ls;
            c = delRes.cursor;
            a = delRes.anchor;

            const next = ls.slice();
            const s = next[c.line] ?? "";
            const before = s.slice(0, c.col);
            const after = s.slice(c.col);
            next.splice(c.line, 1, before, after);

            const newC = normalizePos({ line: c.line + 1, col: 0 }, next);
            setCursorState(newC);
            setAnchorState(newC);
            return next;
        });
    };

    const moveCursor = (dx: number, dy: number, selecting: boolean) => {
        const ls = linesRef.current;
        const c = cursorRef.current;

        let line = clamp(c.line + dy, 0, Math.max(0, ls.length - 1));
        let col = c.col;

        if (dy !== 0) col = clamp(col, 0, (ls[line] ?? "").length);
        else col = clamp(col + dx, 0, (ls[line] ?? "").length);

        const next = { line, col };
        setCursorState(next);
        if (!selecting) setAnchorState(next);
    };

    // ----- Measuring char width -----
    useLayoutEffect(() => {
        const span = document.createElement("span");
        span.style.visibility = "hidden";
        span.style.position = "absolute";
        span.style.whiteSpace = "pre";
        span.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
        span.style.fontSize = "14px";
        span.textContent = "M";
        document.body.appendChild(span);
        const w = span.getBoundingClientRect().width;
        document.body.removeChild(span);
        if (Number.isFinite(w) && w > 0) setCharW(w);
    }, []);

    // ----- Scroll -> visible range -----
    const updateVisibleRange = () => {
        const ed = editorRef.current;
        if (!ed) return;

        const top = ed.scrollTop;
        const bottom = top + ed.clientHeight;

        const first = clamp(Math.floor(top / lineHeight) - overscan, 0, Math.max(0, linesRef.current.length - 1));
        const last = clamp(Math.floor(bottom / lineHeight) + overscan, 0, Math.max(0, linesRef.current.length - 1));

        setVisibleRange({ first, last });
    };

    useEffect(() => {
        updateVisibleRange();
    }, [lines.length]);

    // ----- Global mouse move/up for drag selection -----
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!selectingRef.current) return;
            const pos = posFromMouse(e);
            setCursor(pos, true); // keep anchor
        };
        const onUp = () => {
            selectingRef.current = false;
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [charW]);

    // ----- Keep caret visible after cursor moves -----
    useEffect(() => {
        ensureCaretVisible(cursor);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cursor.line, cursor.col, charW]);

    // ----- Virtualized line nodes -----
    const visibleLines = useMemo(() => {
        const ls = lines;
        const first = visibleRange.first;
        const last = visibleRange.last;
        const out: { i: number; text: string; html: string }[] = [];
        for (let i = first; i <= last; i++) {
            const text = ls[i] ?? "";
            out.push({ i, text, html: highlightLineHtml(text) });
        }
        return out;
    }, [lines, visibleRange]);

    // Selection bounds
    const selA = useMemo(() => minPos(cursor, anchor), [cursor, anchor]);
    const selB = useMemo(() => maxPos(cursor, anchor), [cursor, anchor]);

    // ----- Focus helper -----
    const focusEditor = () => {
        inputRef.current?.focus();
    };

    // ----- Event handlers -----
    const onMouseDown = (e: React.MouseEvent) => {
        editorRef.current?.focus();
        focusEditor();
        selectingRef.current = true;
        const pos = posFromMouse(e);
        setCursor(pos, false);
        e.preventDefault();
    };

    const onScroll = () => updateVisibleRange();

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const selecting = e.shiftKey;

        switch (e.key) {
            case "ArrowLeft":
                moveCursor(-1, 0, selecting);
                break;
            case "ArrowRight":
                moveCursor(1, 0, selecting);
                break;
            case "ArrowUp":
                moveCursor(0, -1, selecting);
                break;
            case "ArrowDown":
                moveCursor(0, 1, selecting);
                break;
            case "Home": {
                const c = cursorRef.current;
                const next = { line: c.line, col: 0 };
                setCursorState(next);
                if (!selecting) setAnchorState(next);
                break;
            }
            case "End": {
                const ls = linesRef.current;
                const c = cursorRef.current;
                const next = { line: c.line, col: (ls[c.line] ?? "").length };
                setCursorState(next);
                if (!selecting) setAnchorState(next);
                break;
            }
            case "Backspace":
                backspace();
                e.preventDefault();
                break;
            case "Delete":
                del();
                e.preventDefault();
                break;
            case "Enter":
                newline();
                e.preventDefault();
                break;
            case "a":
            case "A":
                if (e.metaKey || e.ctrlKey) {
                    const ls = linesRef.current;
                    const start: Pos = { line: 0, col: 0 };
                    const end: Pos = { line: ls.length - 1, col: (ls[ls.length - 1] ?? "").length };
                    setAnchorState(start);
                    setCursorState(end);
                    e.preventDefault();
                }
                break;
        }
    };

    const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        if (composingRef.current) return;
        const ta = e.currentTarget;
        const val = ta.value;
        if (val.length) {
            insertText(val);
            ta.value = "";
        }
    };

    // IME composition handling: preview text by inserting at composition start.
    const onCompositionStart = () => {
        composingRef.current = true;
        compositionStartRef.current = { ...cursorRef.current };
        compositionTextRef.current = "";
    };

    const onCompositionUpdate = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
        const start = compositionStartRef.current;
        if (!start) return;

        const nextText = e.data ?? "";
        const prevText = compositionTextRef.current;

        // Replace previous preview with new preview
        // (Simplified: set selection [start .. start+prevLen] and insert new)
        const s = start;
        setCursorState(s);
        setAnchorState(s);

        // create a selection of previous preview length
        if (prevText.length) {
            setCursorState({ line: s.line, col: s.col + prevText.length });
            setAnchorState(s);
        }

        compositionTextRef.current = nextText;
        insertText(nextText);
        // keep anchor at start to show selection-like preview
        setAnchorState(s);
    };

    const onCompositionEnd = () => {
        composingRef.current = false;
        compositionStartRef.current = null;
        compositionTextRef.current = "";
        // finalize selection
        setAnchorState({ ...cursorRef.current });
        if (inputRef.current) inputRef.current.value = "";
    };

    // ----- Derived caret style -----
    const caretStyle = useMemo(() => {
        return {
            top: cursor.line * lineHeight,
            left: leftPad + cursor.col * charW,
            height: lineHeight,
        } as React.CSSProperties;
    }, [cursor.line, cursor.col, charW]);

    // ----- CSS -----
    const styles = useMemo(
        () => ({
            editor: {
                position: "relative" as const,
                width: 900,
                height: 420,
                border: "1px solid #ccc",
                borderRadius: 8,
                overflow: "auto" as const,
                background: "#fff",
            },
            content: {
                position: "relative" as const,
                width: "100%",
                height: lines.length * lineHeight,
            },
            line: {
                position: "absolute" as const,
                left: 0,
                right: 0,
                height: lineHeight,
                whiteSpace: "pre" as const,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
                fontSize: 14,
                lineHeight: `${lineHeight}px`,
                paddingLeft: leftPad,
                boxSizing: "border-box" as const,
                userSelect: "none" as const,
            },
            selection: {
                position: "absolute" as const,
                top: 0,
                height: lineHeight,
                background: "rgba(0, 120, 215, 0.25)",
                pointerEvents: "none" as const,
            },
            caret: {
                position: "absolute" as const,
                width: 2,
                background: "#111",
                pointerEvents: "none" as const,
                animation: "blink 1s step-end infinite",
            },
            input: {
                position: "absolute" as const,
                opacity: 0,
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                resize: "none" as const,
                border: 0,
                outline: "none",
                overflow: "hidden" as const,
            },
            status: {
                marginTop: 10,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
                color: "#444",
            },
        }),
        [lines.length]
    );

    return (
        <div>
            <style>{`
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>

            <h3>Mini Monaco-like Editor (React)</h3>

            <div
                ref={editorRef}
                style={styles.editor}
                tabIndex={0}
                onMouseDown={onMouseDown}
                onScroll={onScroll}
                onFocus={focusEditor}
                onClick={focusEditor}
            >
                <div ref={contentRef} style={styles.content}>
                    {visibleLines.map(({ i, html }) => {
                        // selection overlay for this line
                        let sel: { left: number; width: number } | null = null;

                        if (!samePos(cursor, anchor)) {
                            if (i >= selA.line && i <= selB.line) {
                                const startCol = i === selA.line ? selA.col : 0;
                                const endCol = i === selB.line ? selB.col : (lines[i] ?? "").length;
                                if (endCol > startCol) {
                                    sel = {
                                        left: leftPad + startCol * charW,
                                        width: (endCol - startCol) * charW,
                                    };
                                }
                            }
                        }

                        return (
                            <div key={i} style={{ ...styles.line, top: i * lineHeight }} data-line={i}>
                                <span dangerouslySetInnerHTML={{ __html: html }} />
                                {sel && (
                                    <div
                                        style={{
                                            ...styles.selection,
                                            left: sel.left,
                                            width: sel.width,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* caret */}
                <div style={{ ...styles.caret, ...caretStyle }} />

                {/* hidden input (text + IME) */}
                <textarea
                    ref={inputRef}
                    spellCheck={false}
                    style={{
                        ...styles.input,
                        top: caretStyle.top,
                        left: caretStyle.left,
                    }}
                    onKeyDown={onKeyDown}
                    onInput={onInput}
                    onCompositionStart={onCompositionStart}
                    onCompositionUpdate={onCompositionUpdate}
                    onCompositionEnd={onCompositionEnd}
                />
            </div>

            <div style={styles.status}>
                {(() => {
                    const sA = minPos(cursor, anchor);
                    const sB = maxPos(cursor, anchor);
                    const hasSel = !samePos(cursor, anchor);
                    const composing = composingRef.current;
                    const comp = compositionTextRef.current;
                    return (
                        <>
                            cursor: ({cursor.line + 1},{cursor.col + 1})
                            {hasSel && (
                                <>
                                    {" "}
                                    selection: [({sA.line + 1},{sA.col + 1})..({sB.line + 1},{sB.col + 1})]
                                </>
                            )}
                            {composing && comp && <> composing: "{comp}"</>}
                        </>
                    );
                })()}
            </div>
        </div>
    );
}
