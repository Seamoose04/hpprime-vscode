"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
var vscode = require("vscode");
var path = require("path");
var fs = require("fs");
function activate(context) {
    var _a;
    var filePath = path.join(context.extensionPath, 'completions.json');
    var fileContents = fs.readFileSync(filePath, 'utf8');
    var completions = JSON.parse(fileContents);
    var provider = (_a = vscode.languages).registerCompletionItemProvider.apply(_a, __spreadArray(['hpprime', {
            provideCompletionItems: function (document, position) {
                return completions.map(function (item) {
                    var completionItem = new vscode.CompletionItem(item.label, vscode.CompletionItemKind.Function);
                    completionItem.detail = item.detail;
                    completionItem.documentation = new vscode.MarkdownString(item.documentation);
                    return completionItem;
                });
            }
        }], 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), false));
    context.subscriptions.push(provider);
}
function deactivate() { }
