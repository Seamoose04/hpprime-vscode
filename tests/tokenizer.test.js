const { test } = require('node:test');
const assert = require('node:assert');
const { tokenize, TokenType } = require('../server/server-dist/server/tokenizer.js');

test('tokenize basic program', () => {
  const tokens = tokenize('EXPORT F()\nBEGIN\nEND;');
  const hasExport = tokens.some(t => t.type === TokenType.Keyword && t.value.toUpperCase() === 'EXPORT');
  const hasIdentifier = tokens.some(t => t.type === TokenType.Identifier && t.value === 'F');
  assert.ok(hasExport && hasIdentifier);
});
