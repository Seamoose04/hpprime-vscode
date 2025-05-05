export enum TokenType {
    Identifier,
    Keyword,
    Symbol,
    Number,
    String,
    Whitespace,
    Comment,
    Newline,
    Unknown
}

export type Token = {
    type: TokenType;
    value: string;
    offset: number;
};

const keywords = new Set([
    'BEGIN', 'END', 'EXPORT', 'LOCAL',
    'IF', 'THEN', 'ELSE', 'WHILE', 'DO', 'REPEAT',
    'RETURN', 'MSGBOX'
]);

export function tokenize(text: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < text.length) {
        const ch = text[i];

        // Whitespace
        if (/\s/.test(ch)) {
            let start = i;
            while (i < text.length && /\s/.test(text[i])) i++;
            tokens.push({ type: TokenType.Whitespace, value: text.slice(start, i), offset: start });
            continue;
        }

        // Comment (single line //)
        if (text.slice(i, i + 2) === '//') {
            let start = i;
            i += 2;
            while (i < text.length && text[i] !== '\n') i++;
            tokens.push({ type: TokenType.Comment, value: text.slice(start, i), offset: start });
            continue;
        }

        // String
        if (ch === '"') {
            let start = i++;
            while (i < text.length && text[i] !== '"') i++;
            i++; // consume closing quote
            tokens.push({ type: TokenType.String, value: text.slice(start, i), offset: start });
            continue;
        }

        // Identifier / Keyword
        if (/[a-zA-Z_]/.test(ch)) {
            let start = i;
            while (i < text.length && /[a-zA-Z0-9_]/.test(text[i])) i++;
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
            while (i < text.length && /[\d.]/.test(text[i])) i++;
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