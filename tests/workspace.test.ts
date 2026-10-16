import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Workspace, MAX_BYTES } from '../src/workspace.js';

function fixture(t: { after: (fn: () => void) => void }) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-'));
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  return { parent, ws: new Workspace(path.join(parent, 'workspace')) };
}
test('create, list, read, replace, inspect, search and delete', t => {
  const { ws } = fixture(t);
  ws.write('notes.txt', 'hello\nworld');
  assert.equal(ws.list('.')[0].name, 'notes.txt');
  assert.equal(ws.read('notes.txt'), 'hello\nworld');
  ws.replace('notes.txt', 'world', 'Claude');
  assert.equal(ws.read('notes.txt'), 'hello\nClaude');
  assert.equal(ws.info('notes.txt').type, 'file');
  assert.deepEqual(ws.searchFiles('.', 'NOTES').matches, ['notes.txt']);
  assert.equal(ws.searchText('.', 'Claude').matches[0].line, 2);
  ws.delete('notes.txt');
  assert.throws(() => ws.read('notes.txt'));
});
test('reject traversal, absolute paths, Windows drives, UNC and aliases', t => {
  const { ws, parent } = fixture(t);
  fs.writeFileSync(path.join(parent, 'secret.txt'), 'private');
  for (const input of ['../secret.txt', '..\\secret.txt', '/etc/passwd', 'C:\\secret.txt', '\\\\host\\share', 'a:stream', 'NUL.txt', 'bad.']) {
    assert.throws(() => ws.resolve(input), input);
  }
  assert.throws(() => ws.write('../new.txt', 'bad'));
  assert.equal(fs.existsSync(path.join(parent, 'new.txt')), false);
  assert.throws(() => ws.delete('../secret.txt'));
  assert.equal(fs.readFileSync(path.join(parent, 'secret.txt'), 'utf8'), 'private');
});
test('block directory symlink escape and skip links in searches', t => {
  const { ws, parent } = fixture(t);
  const outside = path.join(parent, 'outside'); fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'secret.txt'), 'secret');
  fs.symlinkSync(outside, path.join(ws.root, 'link'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => ws.read('link/secret.txt'));
  assert.throws(() => ws.write('link/new.txt', 'bad'));
  assert.throws(() => ws.delete('link/secret.txt'));
  assert.deepEqual(ws.searchFiles('.', 'secret').matches, []);
});
test('protect root, directories, existing files and exact replacement', t => {
  const { ws } = fixture(t);
  assert.throws(() => ws.delete('.'));
  assert.throws(() => ws.write('.', 'bad'));
  fs.mkdirSync(path.join(ws.root, 'folder'));
  assert.throws(() => ws.delete('folder'));
  ws.write('a.txt', 'same same');
  assert.throws(() => ws.write('a.txt', 'bad'));
  assert.equal(ws.read('a.txt'), 'same same');
  assert.throws(() => ws.replace('a.txt', 'same', 'bad'));
  assert.throws(() => ws.replace('a.txt', 'missing', 'bad'));
  assert.throws(() => ws.replace('a.txt', '', 'bad'));
  ws.write('a.txt', 'updated', true);
  assert.equal(ws.read('a.txt'), 'updated');
});
test('enforce text and size limits', t => {
  const { ws } = fixture(t);
  assert.throws(() => ws.write('large.txt', 'x'.repeat(MAX_BYTES + 1)));
  assert.throws(() => ws.write('large.txt', '界'.repeat(400_000)));
  fs.writeFileSync(path.join(ws.root, 'big.txt'), Buffer.alloc(MAX_BYTES + 1));
  assert.throws(() => ws.read('big.txt'));
  fs.writeFileSync(path.join(ws.root, 'binary.bin'), Buffer.from([0, 1]));
  assert.throws(() => ws.read('binary.bin'));
});
test('search reports truncation and skipped binary files', t => {
  const { ws } = fixture(t);
  ws.write('many.txt', Array.from({ length: 201 }, () => 'match').join('\n'));
  fs.writeFileSync(path.join(ws.root, 'binary.bin'), Buffer.from([0, 1]));
  const result = ws.searchText('.', 'match');
  assert.equal(result.matches.length, 200);
  assert.equal(result.truncated, true);
  assert.deepEqual(result.skipped, ['binary.bin']);
});
