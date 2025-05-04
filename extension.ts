
import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    // Load completions from completions.json
    const filePath = path.join(context.extensionPath, 'completions.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const completions = JSON.parse(fileContents);

    // Register autocomplete provider for hpprime language
    const provider = vscode.languages.registerCompletionItemProvider('hpprime', {
        provideCompletionItems(document, position) {
            return completions.map((item: any) => {
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

        exec(`python3 "${buildScript}"`, { cwd: workspaceRoot }, (err, stdout, stderr) => {
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

export function deactivate() {}
