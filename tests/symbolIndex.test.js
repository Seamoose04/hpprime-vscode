const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { TextDocument } = require('vscode-languageserver-textdocument');
const { updateSymbolsForDocument, findSymbol, getCompletions, getDefinitionLocation } = require('../server/server-dist/server/symbolIndex.js');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'hpprime-test-'));
}

test('symbol index provides completions and definitions', () => {
  const dir = tmpDir();
  const util = path.join(dir, 'util.hpprgm');
  const main = path.join(dir, 'main.hpprgm');

  fs.writeFileSync(util, 'EXPORT foo()\nBEGIN\nEND;');
  fs.writeFileSync(main, '#include "util.hpprgm"\nEXPORT MAIN()\nBEGIN\n foo();\nEND;');

  const mainDoc = TextDocument.create('file://' + main, 'hpprime', 1, fs.readFileSync(main, 'utf8'));
  updateSymbolsForDocument(mainDoc);

  const completions = getCompletions();
  assert.ok(completions.some(c => c.label === 'foo'));

  const sym = findSymbol('foo');
  assert.ok(sym && sym.uri.startsWith('file://'));

  const def = getDefinitionLocation('foo');
  assert.ok(def && def.uri.endsWith('util.hpprgm'));
});
