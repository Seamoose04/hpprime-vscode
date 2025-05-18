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
exports.activate = activate;
exports.deactivate = deactivate;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const build_1 = require("./build");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    const serverModule = context.asAbsolutePath(path.join('..', 'server-dist', 'server', 'server.js'));
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: { module: serverModule, transport: node_1.TransportKind.ipc }
    };
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'hpprime' }]
    };
    client = new node_1.LanguageClient('hpprgmLanguageServer', 'HP PPL Language Server', serverOptions, clientOptions);
    context.subscriptions.push(vscode.commands.registerCommand('hpprime.buildCombinedFile', async () => {
        const entryUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: { 'HP Prime Files': ['hpprgm'] },
            openLabel: 'Select Entry File'
        });
        if (!entryUri || entryUri.length === 0)
            return;
        const entryPath = entryUri[0].fsPath;
        try {
            const built = (0, build_1.buildHPProgram)(entryPath);
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage("No workspace folder is open.");
                return;
            }
            const outputPath = path.join(workspaceFolder.uri.fsPath, 'combined.hpprgm');
            fs.writeFileSync(outputPath, built, 'utf8');
            vscode.window.showInformationMessage(`Built combined.hpprgm at ${outputPath}`);
            const doc = await vscode.workspace.openTextDocument(outputPath);
            vscode.window.showTextDocument(doc);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Build failed: ${err.message}`);
        }
    }));
    client.start();
}
function deactivate() {
    return client?.stop();
}
