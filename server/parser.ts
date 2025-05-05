// parser.ts

import { ASTNode, FunctionNode, BlockNode, IfNode, WhileNode, ForNode, PushableNode } from './ast';
import { Token, TokenType, tokenize } from './tokenizer';

function hasChildren(node: unknown): node is BlockNode | WhileNode | ForNode {
    return !!node && typeof node === 'object' && 'children' in node;
}

export function parseAST(text: string): ASTNode[] {
    const tokens = tokenize(text);
    const nodes: ASTNode[] = [];

    const stack: PushableNode[] = [];


    let currentIf: IfNode | null = null;

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const tokenVal = t.value.toUpperCase();

        // === Function func() BEGIN ===
        if (
            t.type === TokenType.Identifier &&
            tokens[i + 1]?.value === '(' &&
            tokens[i + 2]?.value === ')' &&
            tokens[i + 3]?.type === TokenType.Keyword &&
            tokens[i + 3].value.toUpperCase() === 'BEGIN'
        ) {
            const func: FunctionNode = {
                type: 'Function',
                name: t.value,
                start: { offset: t.offset },
                end: null,
                body: { type: 'Block', start: { offset: tokens[i + 3].offset }, end: null, children: [] }
            };
            stack.push(func.body);
            nodes.push(func);
            i += 3;
            continue;
        }

        // === IF ... THEN ===
        if (tokenVal === 'IF' && tokens[i + 2]?.value.toUpperCase() === 'THEN') {
            const thenBlock: BlockNode = {
                type: 'Block',
                start: { offset: tokens[i + 2].offset },
                end: null,
                children: []
            };
            const ifNode: IfNode = {
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
                const elseBlock: BlockNode = {
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
        if (tokenVal === 'WHILE' && tokens[i + 2]?.value.toUpperCase() === 'DO') {
            const node: WhileNode = {
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
        if (tokenVal === 'FOR' && tokens[i + 4]?.value.toUpperCase() === 'DO') {
            const node: ForNode = {
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
            const block: BlockNode = {
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
        if (tokenVal === 'END' && tokens[i + 1]?.value === ';') {
            const block = stack.pop();
            if (block) {
                block.end = { offset: tokens[i + 1].offset + 1 };
                if ('thenBlock' in block || block === currentIf?.elseBlock) {
                    currentIf!.end = block.end;
                    currentIf = null;
                }
            }
            i++; // skip semicolon
            continue;
        }

        // === Default Token ===
        const parent = stack[stack.length - 1];
        if (hasChildren(parent)) {
            parent.children.push({
                type: 'Token',
                start: { offset: t.offset },
                end: { offset: t.offset + t.value.length }
            } as any);
        }
    }

    return nodes;
}