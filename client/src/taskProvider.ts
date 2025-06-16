import * as vscode from 'vscode';
import * as path from 'path';

export interface HPPrimeTaskDefinition extends vscode.TaskDefinition {
    /** Entry HP PPL file */
    entry: string;
    /** Optional output path */
    output?: string;
}

export class HPPrimeTaskProvider implements vscode.TaskProvider {
    static readonly type = 'hpprime';
    constructor(private context: vscode.ExtensionContext) {}

    provideTasks(): vscode.ProviderResult<vscode.Task[]> {
        // Tasks are resolved on demand; none provided by default
        return [];
    }

    resolveTask(task: vscode.Task): vscode.ProviderResult<vscode.Task> {
        const definition = task.definition as HPPrimeTaskDefinition;
        if (!definition.entry) {
            return undefined;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return undefined;
        }

        const script = this.context.asAbsolutePath(path.join('..', 'scripts', 'build.js'));
        const args = [definition.entry];
        if (definition.output) {
            args.push(definition.output);
        }
        const quotedArgs = args.map(a => `"${a}"`).join(' ');
        const exec = new vscode.ShellExecution(`node "${script}" ${quotedArgs}`);
        const resolved = new vscode.Task(
            definition,
            workspaceFolder,
            task.name,
            'hpprime',
            exec
        );
        resolved.group = vscode.TaskGroup.Build;
        return resolved;
    }
}
