const fs = require('node:fs');
const path = require('node:path');

const MAX_STATE_BYTES = 10 * 1024 * 1024;

function readAppState(filePath) {
  try {
    if (fs.statSync(filePath).size > MAX_STATE_BYTES) return {};
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    // A missing or damaged state file should never prevent the app from starting.
    return {};
  }
}

function writeAppState(filePath, state) {
  const directory = path.dirname(filePath);
  const temporaryPath = path.join(directory, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  const serialized = `${JSON.stringify(state, null, 2)}\n`;

  fs.mkdirSync(directory, { recursive: true });
  try {
    fs.writeFileSync(temporaryPath, serialized, { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temporaryPath, filePath);
    // On Windows this is best effort; the file remains readable if chmod is unsupported.
    try { fs.chmodSync(filePath, 0o600); } catch {}
  } finally {
    try { fs.rmSync(temporaryPath, { force: true }); } catch {}
  }
}

module.exports = { readAppState, writeAppState };
