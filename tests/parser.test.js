const { test } = require('node:test');
const assert = require('node:assert');
const { parseAST } = require('../server/server-dist/shared/parser.js');

test('parseAST extracts includes and functions', () => {
  const src = [
    '#include "lib.hpprgm"',
    'EXPORT foo(a)',
    'BEGIN',
    '  RETURN a;',
    'END;',
    '',
    'EXPORT MAIN()',
    'BEGIN',
    '  foo(1);',
    'END;'
  ].join('\n');

  const { ast, includes } = parseAST(src);
  assert.deepStrictEqual(includes, ['lib.hpprgm']);
  const funcs = ast.filter(n => n.type === 'Function').map(n => n.name);
  assert.deepStrictEqual(funcs, ['foo', 'MAIN']);
});
