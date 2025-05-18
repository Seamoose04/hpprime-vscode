"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
exports.tokenize = tokenize;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["Identifier"] = 0] = "Identifier";
    TokenType[TokenType["Keyword"] = 1] = "Keyword";
    TokenType[TokenType["Symbol"] = 2] = "Symbol";
    TokenType[TokenType["Number"] = 3] = "Number";
    TokenType[TokenType["String"] = 4] = "String";
    TokenType[TokenType["Whitespace"] = 5] = "Whitespace";
    TokenType[TokenType["Comment"] = 6] = "Comment";
    TokenType[TokenType["Newline"] = 7] = "Newline";
    TokenType[TokenType["Unknown"] = 8] = "Unknown";
})(TokenType || (exports.TokenType = TokenType = {}));
const keywords = new Set([
    'BEGIN', 'END', 'EXPORT', 'LOCAL',
    'IF', 'THEN', 'ELSE', 'WHILE', 'DO', 'REPEAT',
    'RETURN', 'MSGBOX'
]);
function tokenize(text) {
    const tokens = [];
    let i = 0;
    while (i < text.length) {
        const ch = text[i];
        // Whitespace
        if (/\s/.test(ch)) {
            let start = i;
            while (i < text.length && /\s/.test(text[i]))
                i++;
            tokens.push({ type: TokenType.Whitespace, value: text.slice(start, i), offset: start });
            continue;
        }
        // Comment (single line //)
        if (text.slice(i, i + 2) === '//') {
            let start = i;
            i += 2;
            while (i < text.length && text[i] !== '\n')
                i++;
            tokens.push({ type: TokenType.Comment, value: text.slice(start, i), offset: start });
            continue;
        }
        // String
        if (ch === '"') {
            let start = i++;
            while (i < text.length && text[i] !== '"')
                i++;
            i++; // consume closing quote
            tokens.push({ type: TokenType.String, value: text.slice(start, i), offset: start });
            continue;
        }
        // Identifier / Keyword
        if (/[a-zA-Z_]/.test(ch)) {
            let start = i;
            while (i < text.length && /[a-zA-Z0-9_]/.test(text[i]))
                i++;
            const val = text.slice(start, i);
            tokens.push({
                type: keywords.has(val.toUpperCase()) ? TokenType.Keyword : TokenType.Identifier,
                value: val,
                offset: start
            });
            continue;
        }
        // Number
        if (/\d/.test(ch)) {
            let start = i;
            while (i < text.length && /[\d.]/.test(text[i]))
                i++;
            tokens.push({ type: TokenType.Number, value: text.slice(start, i), offset: start });
            continue;
        }
        // Symbol
        if (/[\(\)\[\];,=+\-*/<>]/.test(ch)) {
            tokens.push({ type: TokenType.Symbol, value: ch, offset: i });
            i++;
            continue;
        }
        // Unknown
        tokens.push({ type: TokenType.Unknown, value: ch, offset: i });
        i++;
    }
    return tokens;
}
