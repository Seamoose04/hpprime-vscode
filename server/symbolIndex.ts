import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionItemKind, Position, Location, Range, CompletionItem } from 'vscode-languageserver/node';
import { ASTNode, FunctionNode, BlockNode } from '../shared/ast';
import { parseAST } from '../shared/parser';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';

const completionsPath = path.resolve(__dirname, '../shared/completions.json');
const builtinCompletions = JSON.parse(fs.readFileSync(completionsPath, 'utf8'));

import { connection } from './server'; // you'll need to export this

export type SymbolEntry = {
    name: string;
    kind: CompletionItemKind;
    uri: string;
    range: Range;
    detail?: string;
    documentation?: string;
};

let symbolTable: SymbolEntry[] = [];

for (const item of builtinCompletions) {
    symbolTable.push({
        name: item.label,
        kind: item.kind || CompletionItemKind.Function,
        uri: 'builtin',
        range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 }
        },
        detail: item.detail,
        documentation: item.documentation
    });
}

const seenFiles = new Set<string>();

export function updateSymbolsForDocument(doc: TextDocument) {
    const rootPath = new URL(doc.uri).pathname;
    seenFiles.clear();  // Make sure it's fresh for this document
    const allFiles = resolveIncludes(rootPath, seenFiles);

    const fileUris = allFiles.map(f => pathToFileURL(f).toString());
    symbolTable = symbolTable.filter(sym => !fileUris.includes(sym.uri));

    for (const file of allFiles) {
        const uri = pathToFileURL(file).toString(); // Ensure same format
    
        const text = fs.readFileSync(file, 'utf8');
        const { ast } = parseAST(text);

        for (const node of ast) {
            if (node.type === "Function") {
                symbolTable.push({
                    name: node.name,
                    kind: CompletionItemKind.Function,
                    uri,
                    range: {
                        start: Position.create(0, 0),
                        end: Position.create(0, 0)
                    }
                });
            }
        }
    }    
}

export function getCompletions(): CompletionItem[] {
    return symbolTable.map(sym => ({
        label: sym.name,
        kind: sym.kind,
        detail: sym.detail ?? sym.uri,
        documentation: sym.documentation
    }));
}

export function findSymbol(name: string): SymbolEntry | undefined {
    return symbolTable.find(sym => sym.name === name);
}  

export function getDefinitionLocation(name: string): Location | null {
    const sym = findSymbol(name);
    return sym ? { uri: sym.uri, range: sym.range } : null;
}

function resolveIncludes(file: string, visited: Set<string>): string[] {
    const files: string[] = [];
    if (visited.has(file)) return files;
    visited.add(file);

    if (!fs.existsSync(file)) return files;

    files.push(file);

    const content = fs.readFileSync(file, 'utf8');
    const { includes } = parseAST(content);

    for (const inc of includes) {
        const resolved = path.resolve(path.dirname(file), inc);
        files.push(...resolveIncludes(resolved, visited));
    }

    return files;
}
