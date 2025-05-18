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
exports.updateSymbolsForDocument = updateSymbolsForDocument;
exports.getCompletions = getCompletions;
exports.findSymbol = findSymbol;
exports.getDefinitionLocation = getDefinitionLocation;
const node_1 = require("vscode-languageserver/node");
const parser_1 = require("../shared/parser");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const url_1 = require("url");
const completionsPath = path.resolve(__dirname, '../shared/completions.json');
const builtinCompletions = JSON.parse(fs.readFileSync(completionsPath, 'utf8'));
let symbolTable = [];
for (const item of builtinCompletions) {
    symbolTable.push({
        name: item.label,
        kind: item.kind || node_1.CompletionItemKind.Function,
        uri: 'builtin',
        range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 }
        },
        detail: item.detail,
        documentation: item.documentation
    });
}
const seenFiles = new Set();
function updateSymbolsForDocument(doc) {
    const rootPath = new URL(doc.uri).pathname;
    seenFiles.clear(); // Make sure it's fresh for this document
    const allFiles = resolveIncludes(rootPath, seenFiles);
    const fileUris = allFiles.map(f => (0, url_1.pathToFileURL)(f).toString());
    symbolTable = symbolTable.filter(sym => !fileUris.includes(sym.uri));
    for (const file of allFiles) {
        const uri = (0, url_1.pathToFileURL)(file).toString(); // Ensure same format
        const text = fs.readFileSync(file, 'utf8');
        const { ast } = (0, parser_1.parseAST)(text);
        for (const node of ast) {
            if (node.type === "Function") {
                symbolTable.push({
                    name: node.name,
                    kind: node_1.CompletionItemKind.Function,
                    uri,
                    range: {
                        start: node_1.Position.create(0, 0),
                        end: node_1.Position.create(0, 0)
                    }
                });
            }
        }
    }
}
function getCompletions() {
    return symbolTable.map(sym => {
        var _a;
        return ({
            label: sym.name,
            kind: sym.kind,
            detail: (_a = sym.detail) !== null && _a !== void 0 ? _a : sym.uri,
            documentation: sym.documentation
        });
    });
}
function findSymbol(name) {
    return symbolTable.find(sym => sym.name === name);
}
function getDefinitionLocation(name) {
    const sym = findSymbol(name);
    return sym ? { uri: sym.uri, range: sym.range } : null;
}
function resolveIncludes(file, visited) {
    const files = [];
    if (visited.has(file))
        return files;
    visited.add(file);
    if (!fs.existsSync(file))
        return files;
    files.push(file);
    const content = fs.readFileSync(file, 'utf8');
    const { includes } = (0, parser_1.parseAST)(content);
    for (const inc of includes) {
        const resolved = path.resolve(path.dirname(file), inc);
        files.push(...resolveIncludes(resolved, visited));
    }
    return files;
}
