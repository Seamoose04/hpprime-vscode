"use strict";
// parser.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAST = parseAST;
const tokenizer_1 = require("../server/tokenizer");
function hasChildren(node) {
    return !!node && typeof node === 'object' && 'children' in node;
}
function parseAST(text) {
    var _a, _b, _c, _d, _e, _f, _g;
    const includes = [];
    // 🧠 Extract includes manually from source text
    for (const line of text.split(/\r?\n/)) {
        const match = line.trim().match(/^#include\s+"(.+?)"/i);
        if (match) {
            includes.push(match[1]);
        }
    }
    const tokens = (0, tokenizer_1.tokenize)(text);
    const nodes = [];
    const stack = [];
    let currentIf = null;
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const tokenVal = t.value.toUpperCase();
        const isLineStart = i === 0 || tokens[i - 1].value.includes('\n');
        // === Function funcName(...) BEGIN ===
        if (isLineStart && t.type === tokenizer_1.TokenType.Identifier && /^[A-Za-z]/.test(t.value)) {
            let parenIdx = i + 1;
            // Skip intervening non-symbols until we find the '('
            while (tokens[parenIdx] &&
                tokens[parenIdx].type !== tokenizer_1.TokenType.Symbol &&
                tokens[parenIdx].value !== '(') {
                parenIdx++;
            }
            if (((_a = tokens[parenIdx]) === null || _a === void 0 ? void 0 : _a.value) !== '(')
                continue;
            // Find the closing ')'
            let closeParenIdx = parenIdx + 1;
            while (tokens[closeParenIdx] && tokens[closeParenIdx].value !== ')') {
                closeParenIdx++;
            }
            if (!tokens[closeParenIdx])
                continue; // malformed header
            // --- Refined Function Definition/Call Distinction ---
            // 1. Check for semicolon immediately after ')', skipping whitespace/comments
            let isCall = false;
            let currentIdx = closeParenIdx + 1;
            while (tokens[currentIdx] && (tokens[currentIdx].type === tokenizer_1.TokenType.Whitespace || tokens[currentIdx].type === tokenizer_1.TokenType.Comment)) {
                currentIdx++;
            }
            if (((_b = tokens[currentIdx]) === null || _b === void 0 ? void 0 : _b.value) === ';') {
                isCall = true;
            }
            if (isCall) {
                continue; // It's a function call, skip parsing as definition
            }
            // 2. Look ahead for 'BEGIN', checking for semicolons in between
            let beginIdx = -1;
            let semicolonBetween = false;
            currentIdx = closeParenIdx + 1; // Start searching after ')'
            while (tokens[currentIdx]) {
                const currentToken = tokens[currentIdx];
                const currentValUpper = currentToken.value.toUpperCase();
                // Found BEGIN?
                if (currentToken.type === tokenizer_1.TokenType.Keyword && currentValUpper === 'BEGIN') {
                    beginIdx = currentIdx;
                    break; // Found BEGIN, stop searching
                }
                // Found a semicolon before BEGIN? (Skip whitespace/comments)
                if (currentToken.type === tokenizer_1.TokenType.Symbol && currentToken.value === ';') {
                    semicolonBetween = true;
                    break; // Found semicolon, stop searching
                }
                // Stop searching if we hit another potential block start or end prematurely
                // (This might need refinement based on language grammar)
                if (currentToken.type === tokenizer_1.TokenType.Keyword && ['IF', 'WHILE', 'FOR', 'END', 'ELSE', 'REPEAT'].includes(currentValUpper)) {
                    break;
                }
                currentIdx++;
            }
            // 3. Conditions for NOT being a function definition:
            //    - No BEGIN found
            //    - OR a semicolon was found before BEGIN
            if (beginIdx === -1 || semicolonBetween) {
                continue; // Not a valid function definition structure
            }
            // --- End Refined Logic ---
            // Confirmed function declaration
            const paramTokens = tokens.slice(parenIdx + 1, closeParenIdx).filter(tok => tok.type === tokenizer_1.TokenType.Identifier);
            const params = paramTokens.map(tok => tok.value);
            const func = {
                type: 'Function',
                name: t.value,
                params,
                start: { offset: t.offset },
                end: null,
                body: {
                    type: 'Block',
                    start: { offset: tokens[beginIdx].offset },
                    end: null,
                    children: []
                }
            };
            // Register the function globally
            nodes.push(func);
            // Attach to parent block if one exists
            const parent = stack[stack.length - 1];
            if (hasChildren(parent)) {
                parent.children.push(func);
            }
            // Push the function body block to the stack
            stack.push(func.body);
            i = beginIdx;
            continue;
        }
        // === IF ... THEN ===
        if (tokenVal === 'IF' && ((_c = tokens[i + 2]) === null || _c === void 0 ? void 0 : _c.value.toUpperCase()) === 'THEN') {
            const thenBlock = {
                type: 'Block',
                start: { offset: tokens[i + 2].offset },
                end: null,
                children: []
            };
            const ifNode = {
                type: 'If',
                start: { offset: t.offset },
                end: null,
                thenBlock
            };
            const parent = stack[stack.length - 1];
            if (hasChildren(parent)) {
                parent.children.push(ifNode);
            }
            stack.push(thenBlock);
            currentIf = ifNode;
            nodes.push(ifNode);
            i += 2;
            continue;
        }
        // === ELSE ===
        if (tokenVal === 'ELSE' && currentIf) {
            const ended = stack.pop(); // finish thenBlock
            if (ended && ended === currentIf.thenBlock) {
                const elseBlock = {
                    type: 'Block',
                    start: { offset: t.offset },
                    end: null,
                    children: []
                };
                currentIf.elseBlock = elseBlock;
                stack.push(elseBlock);
                continue;
            }
        }
        // === WHILE ... DO ===
        if (tokenVal === 'WHILE' && ((_d = tokens[i + 2]) === null || _d === void 0 ? void 0 : _d.value.toUpperCase()) === 'DO') {
            const node = {
                type: 'While',
                start: { offset: t.offset },
                end: null,
                children: []
            };
            const parent = stack[stack.length - 1];
            if (hasChildren(parent)) {
                parent.children.push(node);
            }
            stack.push(node);
            continue;
        }
        // === FOR ... FROM ... TO ... DO ===
        if (tokenVal === 'FOR' && ((_e = tokens[i + 4]) === null || _e === void 0 ? void 0 : _e.value.toUpperCase()) === 'DO') {
            const node = {
                type: 'For',
                start: { offset: t.offset },
                end: null,
                children: []
            };
            const parent = stack[stack.length - 1];
            if (hasChildren(parent)) {
                parent.children.push(node);
            }
            stack.push(node);
            continue;
        }
        // === BEGIN ===
        if (tokenVal === 'BEGIN') {
            const block = {
                type: 'Block',
                start: { offset: t.offset },
                end: null,
                children: []
            };
            const parent = stack[stack.length - 1];
            if (hasChildren(parent)) {
                parent.children.push(block);
            }
            stack.push(block);
            continue;
        }
        // === END; ===
        if (tokenVal === 'END' && ((_f = tokens[i + 1]) === null || _f === void 0 ? void 0 : _f.value) === ';') {
            const block = stack.pop();
            if (block) {
                block.end = { offset: tokens[i + 1].offset + 1 };
                if ('thenBlock' in block || block === (currentIf === null || currentIf === void 0 ? void 0 : currentIf.elseBlock)) {
                    currentIf.end = block.end;
                    currentIf = null;
                }
            }
            i++; // skip semicolon
            continue;
        }
        // === RETURN [expr]; ===
        if (tokenVal === 'RETURN') {
            const start = t.offset;
            // Look ahead to next token (expression or semicolon)
            const next = tokens[i + 1];
            let end = t.offset + t.value.length;
            let expr;
            if (next && next.value !== ';') {
                expr = {
                    type: 'Token',
                    start: { offset: next.offset },
                    end: { offset: next.offset + next.value.length }
                };
                if (expr === null || expr === void 0 ? void 0 : expr.end) {
                    end = expr.end.offset;
                }
                i++; // advance to include expression
            }
            // Skip final semicolon if present
            if (((_g = tokens[i + 1]) === null || _g === void 0 ? void 0 : _g.value) === ';') {
                end = tokens[i + 1].offset + 1;
                i++;
            }
            const returnNode = {
                type: 'Return',
                start: { offset: start },
                end: { offset: end },
                expression: expr
            };
            const parent = stack[stack.length - 1];
            if (hasChildren(parent)) {
                parent.children.push(returnNode);
            }
            continue;
        }
        // === Default Token ===
        const parent = stack[stack.length - 1];
        if (hasChildren(parent)) {
            parent.children.push({
                type: 'Token',
                start: { offset: t.offset },
                end: { offset: t.offset + t.value.length }
            });
        }
    }
    return { ast: nodes, includes };
}
