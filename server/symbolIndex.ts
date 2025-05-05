import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionItemKind, Position, Location, Range, CompletionItem } from 'vscode-languageserver/node';
import { ASTNode, FunctionNode, BlockNode } from './ast';
import { parseAST } from './parser';

import { connection } from './server'; // you'll need to export this

export type SymbolEntry = {
    name: string;
    kind: CompletionItemKind;
    uri: string;
    range: Range;
    detail?: string;
};

let symbolTable: SymbolEntry[] = [];

export function updateSymbolsForDocument(doc: TextDocument) {
    const uri = doc.uri;
    const text = doc.getText();
    const ast = parseAST(text);

    // Clear existing symbols from this file
    symbolTable = symbolTable.filter(s => s.uri !== uri);

    function addSymbol(name: string, kind: CompletionItemKind, offset: number) {
        const pos = doc.positionAt(offset);
        symbolTable.push({
            name,
            kind,
            uri,
            detail: `from ${uri}`,
            range: {
                start: pos,
                end: { line: pos.line, character: pos.character + name.length }
            }
        });        
    }

    function walk(node: ASTNode) {
        if (node.type === 'Function') {
            addSymbol(node.name, CompletionItemKind.Function, node.start.offset);
            walk(node.body); // descend into the function body
        }

        if ('children' in node) {
            for (const child of node.children) {
                walk(child);
            }
        }

        // You can later add LOCAL/EXPORT detection here too
    }

    for (const node of ast) {
        walk(node);
    }

    connection.console.log(`[LSP] Rebuilding symbols for: ${uri}`);
    connection.console.log(`[LSP] Symbols: ` + JSON.stringify(symbolTable.map(s => s.name)));
}

export function getCompletions(): CompletionItem[] {
    return symbolTable.map(sym => ({
        label: sym.name,
        kind: sym.kind,
        detail: sym.detail ?? sym.uri
    }));
}

export function findSymbol(name: string): SymbolEntry | undefined {
    return symbolTable.find(sym => sym.name === name);
}

export function getDefinitionLocation(name: string): Location | null {
    const sym = findSymbol(name);
    return sym ? { uri: sym.uri, range: sym.range } : null;
}