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
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function activate(context) {
    // Load completions from completions.json
    const filePath = path.join(context.extensionPath, 'completions.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const completions = JSON.parse(fileContents);
    // Register autocomplete provider for hpprime language
    const provider = vscode.languages.registerCompletionItemProvider('hpprime', {
        provideCompletionItems(document, position) {
            return completions.map((item) => {
                const completionItem = new vscode.CompletionItem(item.label, vscode.CompletionItemKind.Function);
                completionItem.detail = item.detail;
                completionItem.documentation = new vscode.MarkdownString(item.documentation);
                return completionItem;
            });
        }
    }, ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
    context.subscriptions.push(provider);
    // Register the HP PPL build command
    const disposable = vscode.commands.registerCommand('hpprgm.build', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage("No workspace folder open.");
            return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const buildScript = path.join(context.extensionPath, 'build.py');
        (0, child_process_1.exec)(`python3 "${buildScript}"`, { cwd: workspaceRoot }, (err, stdout, stderr) => {
            if (err) {
                vscode.window.showErrorMessage(`❌ HP PPL Build Failed:\n${stderr}`);
                return;
            }
            vscode.window.showInformationMessage('✅ HP PPL Build Complete!');
            console.log(stdout);
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
