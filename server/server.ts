import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    CompletionItem,
    CompletionItemKind,
    InitializeParams,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    HoverParams,
    Location,
    Position
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import {
    getCompletions,
    updateSymbolsForDocument,
    findSymbol,
    getDefinitionLocation
} from './symbolIndex';

import * as path from 'path';
import * as vscode from 'vscode'; // Required only if used outside LSP

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let workspaceRoot = '';

// === Initialize LSP Features ===
connection.onInitialize((_params: InitializeParams) => {
    const folders = _params.workspaceFolders;
    if (folders && folders.length > 0) {
        // Get the first workspace folder
        workspaceRoot = new URL(folders[0].uri).pathname;
    }

    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
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
    updateSymbolsForDocument(change.document);
});

// === Completion ===
connection.onCompletion((_params: TextDocumentPositionParams): CompletionItem[] => {
    return getCompletions();
});

// === Hover ===
connection.onHover((params: HoverParams) => {
    const doc = documents.get(params.textDocument.uri);
    const word = getWordAtPosition(doc, params.position);
    const sym = word ? findSymbol(word) : null;

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
    return word ? getDefinitionLocation(word) : null;
});

// === Word helper ===
function getWordAtPosition(doc: TextDocument | undefined, pos: Position): string | null {
    if (!doc) return null;
    const text = doc.getText();
    const offset = doc.offsetAt(pos);

    const left = text.slice(0, offset).match(/[\w\d_]+$/)?.[0] ?? '';
    const right = text.slice(offset).match(/^[\w\d_]+/)?.[0] ?? '';

    return left + right || null;
}

// === Start LSP ===
documents.listen(connection);
connection.listen();

export {connection};