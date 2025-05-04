
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    const filePath = path.join(context.extensionPath, 'completions.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const completions = JSON.parse(fileContents);

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
}

export function deactivate() {}
