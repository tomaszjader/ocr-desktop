const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHistoryStore } = require('../src/history');

test('history keeps newest unique OCR results within its limit', () => {
  const history = createHistoryStore(2);
  history.add({ id: 'a', text: 'pierwszy' });
  history.add({ id: 'b', text: 'drugi' });
  history.add({ id: 'c', text: 'trzeci' });
  assert.deepEqual(history.list().map(item => item.text), ['trzeci', 'drugi']);
  history.add({ id: 'd', text: 'drugi' });
  assert.deepEqual(history.list().map(item => item.text), ['drugi', 'trzeci']);
});

test('history supports restore, remove and clear operations', () => {
  const history = createHistoryStore();
  history.add({ id: 'a', text: 'tekst' });
  assert.equal(history.get('a').text, 'tekst');
  history.remove('a');
  assert.equal(history.get('a'), null);
  history.add({ id: 'b', text: 'inny tekst' });
  history.clear();
  assert.deepEqual(history.list(), []);
});
