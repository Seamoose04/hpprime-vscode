import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { buildHPProgram } from './build';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    const serverModule = context.asAbsolutePath(path.join('..', 'server-dist', 'server.js'));

    const serverOptions: ServerOptions = {
        run:   { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'hpprime' }]
    };

    client = new LanguageClient(
        'hpprgmLanguageServer',
        'HP PPL Language Server',
        serverOptions,
        clientOptions
    );

    context.subscriptions.push(vscode.commands.registerCommand('hpprime.buildCombinedFile', async () => {
        const entryUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: { 'HP Prime Files': ['hpprgm'] },
            openLabel: 'Select Entry File'
        });
    
        if (!entryUri || entryUri.length === 0) return;
        const entryPath = entryUri[0].fsPath;
    
        try {
            const built = buildHPProgram(entryPath);
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
        } catch (err: any) {
            vscode.window.showErrorMessage(`Build failed: ${err.message}`);
        }
    }));    

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    return client?.stop();
}
