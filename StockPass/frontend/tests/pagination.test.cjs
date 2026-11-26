const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '../src/components/Pagination/paginateItems.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const compiledModule = new Module(sourcePath, module);
compiledModule.filename = sourcePath;
compiledModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
compiledModule._compile(compiled, sourcePath);
const { paginateItems } = compiledModule.exports;

test('splits filtered records into first and following pages', () => {
  const filtered = Array.from({ length: 23 }, (_, index) => `filtered-${index + 1}`);

  const first = paginateItems(filtered, 1, 10);
  const second = paginateItems(filtered, 2, 10);

  assert.equal(first.totalPages, 3);
  assert.equal(first.items.length, 10);
  assert.equal(first.items[0], 'filtered-1');
  assert.equal(second.items[0], 'filtered-11');
});

test('returns the final partial page and clamps an obsolete page after list shrink', () => {
  const result = paginateItems(Array.from({ length: 21 }, (_, index) => index + 1), 4, 10);

  assert.equal(result.currentPage, 3);
  assert.deepEqual(result.items, [21]);
  assert.equal(result.startIndex, 20);
  assert.equal(result.endIndex, 21);
});

test('supports the selected page size', () => {
  const result = paginateItems(Array.from({ length: 45 }, (_, index) => index), 2, 20);

  assert.equal(result.totalPages, 3);
  assert.equal(result.items.length, 20);
  assert.equal(result.items[0], 20);
});

test('keeps empty lists on page one with no visible records', () => {
  const result = paginateItems([], 5, 10);

  assert.equal(result.currentPage, 1);
  assert.equal(result.totalPages, 1);
  assert.deepEqual(result.items, []);
  assert.equal(result.startIndex, 0);
  assert.equal(result.endIndex, 0);
});
