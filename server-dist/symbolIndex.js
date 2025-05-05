"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSymbolsForDocument = updateSymbolsForDocument;
exports.getCompletions = getCompletions;
exports.findSymbol = findSymbol;
exports.getDefinitionLocation = getDefinitionLocation;
const node_1 = require("vscode-languageserver/node");
const parser_1 = require("./parser");
const server_1 = require("./server"); // you'll need to export this
let symbolTable = [];
function updateSymbolsForDocument(doc) {
    const uri = doc.uri;
    const text = doc.getText();
    const ast = (0, parser_1.parseAST)(text);
    // Clear existing symbols from this file
    symbolTable = symbolTable.filter(s => s.uri !== uri);
    function addSymbol(name, kind, offset) {
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
    function walk(node) {
        if (node.type === 'Function') {
            addSymbol(node.name, node_1.CompletionItemKind.Function, node.start.offset);
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
    server_1.connection.console.log(`[LSP] Rebuilding symbols for: ${uri}`);
    server_1.connection.console.log(`[LSP] Symbols: ` + JSON.stringify(symbolTable.map(s => s.name)));
}
function getCompletions() {
    return symbolTable.map(sym => ({
        label: sym.name,
        kind: sym.kind,
        detail: sym.detail ?? sym.uri
    }));
}
function findSymbol(name) {
    return symbolTable.find(sym => sym.name === name);
}
function getDefinitionLocation(name) {
    const sym = findSymbol(name);
    return sym ? { uri: sym.uri, range: sym.range } : null;
}
