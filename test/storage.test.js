const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readAppState, writeAppState } = require('../src/main/storage');

test('persists and restores application state as JSON', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-desktop-'));
  const filePath = path.join(directory, 'state.json');
  const state = { settings: { autoCopy: false }, history: [{ id: '1', text: 'tekst', createdAt: '2026-01-01T00:00:00.000Z' }] };
  writeAppState(filePath, state);
  assert.deepEqual(readAppState(filePath), state);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('uses an empty state when the state file is missing or invalid', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-desktop-'));
  const filePath = path.join(directory, 'state.json');
  assert.deepEqual(readAppState(filePath), {});
  fs.writeFileSync(filePath, '{broken', 'utf8');
  assert.deepEqual(readAppState(filePath), {});
  fs.rmSync(directory, { recursive: true, force: true });
});

test('rejects oversized or non-object state files', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-desktop-'));
  const filePath = path.join(directory, 'state.json');
  fs.writeFileSync(filePath, '[]', 'utf8');
  assert.deepEqual(readAppState(filePath), {});
  fs.writeFileSync(filePath, 'x'.repeat(10 * 1024 * 1024 + 1), 'utf8');
  assert.deepEqual(readAppState(filePath), {});
  fs.rmSync(directory, { recursive: true, force: true });
});

test('writes through a temporary file and leaves no temporary files behind', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-desktop-'));
  const filePath = path.join(directory, 'state.json');
  writeAppState(filePath, { settings: { autoCopy: true } });
  writeAppState(filePath, { settings: { autoCopy: false } });
  assert.deepEqual(readAppState(filePath), { settings: { autoCopy: false } });
  assert.deepEqual(fs.readdirSync(directory), ['state.json']);
  fs.rmSync(directory, { recursive: true, force: true });
});
