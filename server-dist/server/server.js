"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const symbolIndex_1 = require("./symbolIndex");
const path = __importStar(require("path"));
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
exports.connection = connection;
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let workspaceRoot = '';
// === Initialize LSP Features ===
connection.onInitialize((_params) => {
    const folders = _params.workspaceFolders;
    if (folders && folders.length > 0) {
        // Get the first workspace folder
        workspaceRoot = new URL(folders[0].uri).pathname;
    }
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
    const relativePath = sym?.uri === 'builtin'
        ? 'built-in'
        : sym ? path.relative(workspaceRoot, new URL(sym.uri).pathname) : null;
    return sym ? {
        contents: {
            kind: 'markdown',
            value: `**${sym?.name}**\n\n${sym.documentation ?? '_No documentation available._'}\n\n_File_: ${relativePath}`
        }
    } : null;
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
    const left = text.slice(0, offset).match(/[\w\d_]+$/)?.[0] ?? '';
    const right = text.slice(offset).match(/^[\w\d_]+/)?.[0] ?? '';
    return left + right || null;
}
// === Start LSP ===
documents.listen(connection);
connection.listen();
