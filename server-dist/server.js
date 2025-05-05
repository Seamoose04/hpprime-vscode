"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const symbolIndex_1 = require("./symbolIndex");
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
exports.connection = connection;
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
// === Initialize LSP Features ===
connection.onInitialize((_params) => {
    return {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: {
                triggerCharacters: ['(', ',', ' ']
            },
            definitionProvider: true,
            hoverProvider: true
        }
    };
});
// === Document content changed ===
documents.onDidChangeContent(change => {
    (0, symbolIndex_1.updateSymbolsForDocument)(change.document);
});
// === Completion ===
connection.onCompletion((_params) => {
    return (0, symbolIndex_1.getCompletions)();
});
// === Hover ===
connection.onHover((params) => {
    const doc = documents.get(params.textDocument.uri);
    const word = getWordAtPosition(doc, params.position);
    const sym = word ? (0, symbolIndex_1.findSymbol)(word) : null;
    return sym
        ? {
            contents: {
                kind: 'markdown',
                value: `**${sym.name}**\n\n_Kind_: ${node_1.CompletionItemKind[sym.kind]}\n_File_: ${sym.uri}`
            }
        }
        : null;
});
// === Go to Definition ===
connection.onDefinition((params) => {
    const doc = documents.get(params.textDocument.uri);
    const word = getWordAtPosition(doc, params.position);
    return word ? (0, symbolIndex_1.getDefinitionLocation)(word) : null;
});
// === Word helper ===
function getWordAtPosition(doc, pos) {
    if (!doc)
        return null;
    const text = doc.getText();
    const offset = doc.offsetAt(pos);
    const slice = text.slice(0, offset);
    const match = slice.match(/(\w+)$/);
    return match ? match[1] : null;
}
// === Start LSP ===
documents.listen(connection);
connection.listen();
