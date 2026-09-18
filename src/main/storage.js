const fs = require('node:fs');
const path = require('node:path');

function readAppState(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // A missing or damaged state file should never prevent the app from starting.
    return {};
  }
}

function writeAppState(filePath, state) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

module.exports = { readAppState, writeAppState };
