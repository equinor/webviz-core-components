import { tokenize } from './src/lib/components/NewSmartNodeSelector/core/query-language/lexer.ts';

function isGroupToken(token) {
    return typeof token === "object" && token !== null && "refTokenId" in token;
}

const text = "NodeA[]";
const tokens = tokenize(text, "/");

console.log("Tokens:");
tokens.forEach((t, i) => {
    const ref = isGroupToken(t) ? ` refTokenId=${t.refTokenId}` : '';
    console.log(`  ${i}: ${t.type} "${t.value}" range=${t.charRange.start}-${t.charRange.end}${ref}`);
});

// Simulate stack building for caret at position 7 (right at the end of ])
const caret = 7;
let stack = [];
let tokenAt;

for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (!tokenAt) {
        if (isGroupToken(token)) {
            if (token.refTokenId === undefined) {
                stack.push(token);
                console.log(`Pushed ${token.type} (no refTokenId)`);
            } else if (!stack.find((t) => t.id === token.refTokenId)) {
                stack.push(token);
                console.log(`Pushed ${token.type} (refTokenId ${token.refTokenId} not in stack)`);
            } else {
                stack = stack.filter((t) => t.id !== token.refTokenId);
                console.log(`Filtered out token with id ${token.refTokenId} for ${token.type}`);
            }
        }
    }

    if (token.charRange.start < caret && caret <= token.charRange.end) {
        tokenAt = token;
        console.log(`tokenAt = ${token.type}`);
    }
}

console.log("\nFinal stack:", stack.map(t => t.type));
console.log("insideAttributeFilter:", stack.find(t => t.type === "LSQUAREBRACKET") !== undefined);
