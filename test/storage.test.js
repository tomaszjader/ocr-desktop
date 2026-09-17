const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readAppState, writeAppState } = require('../src/storage');

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
