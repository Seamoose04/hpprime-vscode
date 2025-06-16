const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { buildHPProgram } = require('../client/out/client/src/build.js');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'hpprime-test-'));
}

test('buildHPProgram resolves includes and orders dependencies', () => {
  const dir = tmpDir();
  const util = path.join(dir, 'util.hpprgm');
  const main = path.join(dir, 'main.hpprgm');

  fs.writeFileSync(util, 'EXPORT foo()\nBEGIN\n RETURN 1;\nEND;\n');
  fs.writeFileSync(main, '#include "util.hpprgm"\nEXPORT MAIN()\nBEGIN\n foo();\nEND;\n');

  const result = buildHPProgram(main);

  assert.ok(result.includes('// ----- util.hpprgm -----'));
  assert.ok(result.includes('// ----- main.hpprgm -----'));
  assert.ok(!result.includes('#include'));

  const utilIdx = result.indexOf('util.hpprgm');
  const mainIdx = result.indexOf('main.hpprgm');
  assert.ok(utilIdx < mainIdx);
});
